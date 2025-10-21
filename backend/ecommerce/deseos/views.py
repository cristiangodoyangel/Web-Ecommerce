from rest_framework import viewsets, status, permissions, serializers  # Agregar serializers aquí
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import Deseo
from .serializers import DeseoSerializer, DeseoCreateSerializer
from productos.models import Producto

class DeseoViewSet(viewsets.ModelViewSet):
    serializer_class = DeseoSerializer
    permission_classes = [permissions.IsAuthenticated]
    pagination_class = None  # Desactivar paginación para compatibilidad con frontend

    def get_queryset(self):
        return Deseo.objects.filter(usuario=self.request.user).select_related('producto')

    def get_serializer_class(self):
        if self.action == 'create':
            return DeseoCreateSerializer
        return DeseoSerializer

    def perform_create(self, serializer):
        producto = serializer.validated_data['producto']
        
        # Verificar si ya existe en deseos
        deseo_existente = Deseo.objects.filter(
            usuario=self.request.user,
            producto=producto
        ).first()
        
        if deseo_existente:
            raise serializers.ValidationError(
                {'producto': 'Este producto ya está en tu lista de deseos'}
            )
        
        serializer.save(usuario=self.request.user)

    @action(detail=False, methods=['get'])
    def resumen(self, request):
        """Obtener resumen de la wishlist"""
        items = self.get_queryset()
        return Response({
            'total_items': items.count()
        })

    @action(detail=False, methods=['post'])
    def toggle(self, request):
        """Agregar o quitar producto de wishlist"""
        producto_id = request.data.get('producto_id')
        
        if not producto_id:
            return Response(
                {'error': 'producto_id es requerido'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            producto = Producto.objects.get(id=producto_id, activo=True)
        except Producto.DoesNotExist:
            return Response(
                {'error': 'Producto no encontrado'}, 
                status=status.HTTP_404_NOT_FOUND
            )
        
        deseo_existente = Deseo.objects.filter(
            usuario=request.user,
            producto=producto
        ).first()
        
        if deseo_existente:
            deseo_existente.delete()
            return Response({
                'message': 'Producto eliminado de wishlist',
                'in_wishlist': False
            })
        else:
            Deseo.objects.create(usuario=request.user, producto=producto)
            return Response({
                'message': 'Producto agregado a wishlist',
                'in_wishlist': True
            })