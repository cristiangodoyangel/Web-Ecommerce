from rest_framework import viewsets, status
from rest_framework.response import Response
from rest_framework.decorators import action
from rest_framework.permissions import AllowAny
from django.contrib.sessions.models import Session
from django.http import JsonResponse
from django.utils import timezone
from django.db import models
from .models import Carrito
from .serializers import CarritoSerializer
from productos.models import Producto

class CarritoViewSet(viewsets.ModelViewSet):
    serializer_class = CarritoSerializer
    pagination_class = None  # Desactivar paginación para compatibilidad con frontend
    permission_classes = [AllowAny]  # Permitir acceso sin autenticación
    
    def get_authenticators(self):
        """Usar JWT auth de forma opcional: reconoce usuarios autenticados pero permite guests"""
        from rest_framework_simplejwt.authentication import JWTAuthentication
        return [JWTAuthentication()]

    def get_queryset(self):
        if self.request.user.is_authenticated:
            return Carrito.objects.filter(usuario=self.request.user)
        else:
            # Para invitados, usar session_key
            session_key = self.request.session.session_key
            if not session_key:
                self.request.session.create()
                session_key = self.request.session.session_key
            queryset = Carrito.objects.filter(session_key=session_key)
            return queryset

    def perform_create(self, serializer):
        if self.request.user.is_authenticated:
            serializer.save(usuario=self.request.user)
        else:
            # Para invitados
            if not self.request.session.session_key:
                self.request.session.create()
            serializer.save(session_key=self.request.session.session_key)

    def create(self, request, *args, **kwargs):
        producto_id = request.data.get('producto')
        cantidad = int(request.data.get('cantidad', 1))
        
        if not producto_id:
            return Response(
                {'error': 'ID del producto es requerido'}, 
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            producto = Producto.objects.get(id=producto_id)
        except Producto.DoesNotExist:
            return Response(
                {'error': 'Producto no encontrado'}, 
                status=status.HTTP_404_NOT_FOUND
            )

        # Verificar stock
        if cantidad > producto.stock:
            return Response(
                {'error': f'Stock insuficiente. Disponible: {producto.stock}'}, 
                status=status.HTTP_400_BAD_REQUEST
            )

        # Buscar item existente
        if request.user.is_authenticated:
            carrito_item, created = Carrito.objects.get_or_create(
                usuario=request.user,
                producto=producto,
                defaults={'cantidad': cantidad}
            )
        else:
            if not request.session.session_key:
                request.session.create()
            carrito_item, created = Carrito.objects.get_or_create(
                session_key=request.session.session_key,
                producto=producto,
                defaults={'cantidad': cantidad}
            )

        if not created:
            # Item ya existe, actualizar cantidad
            nueva_cantidad = carrito_item.cantidad + cantidad
            if nueva_cantidad > producto.stock:
                return Response(
                    {'error': f'Stock insuficiente. Máximo disponible: {producto.stock}'}, 
                    status=status.HTTP_400_BAD_REQUEST
                )
            carrito_item.cantidad = nueva_cantidad
            carrito_item.save()

        serializer = self.get_serializer(carrito_item)
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    @action(detail=False, methods=['get'])
    def resumen(self, request):
        queryset = self.get_queryset()
        
        total_items = sum(item.cantidad for item in queryset)
        
        # Calcular total_precio considerando ofertas activas
        total_precio = 0
        now = timezone.now()
        
        for item in queryset:
            # Buscar oferta activa para este producto
            try:
                oferta_activa = item.producto.ofertas.filter(
                    activo=True,
                    fecha_inicio__lte=now
                ).filter(
                    models.Q(fecha_fin__isnull=True) | models.Q(fecha_fin__gte=now)
                ).first()
                
                if oferta_activa:
                    precio_unitario = float(oferta_activa.precio_con_descuento)
                else:
                    precio_unitario = float(item.producto.precio)
                    
                total_precio += precio_unitario * item.cantidad
                
            except Exception as e:
                # Fallback al precio base
                total_precio += float(item.producto.precio) * item.cantidad
        
        result = {
            'total_items': total_items,
            'total_precio': total_precio,
            'items_count': queryset.count()
        }
        
        return Response(result)

    @action(detail=False, methods=['delete'])
    def limpiar(self, request):
        queryset = self.get_queryset()
        count = queryset.count()
        queryset.delete()
        return Response({
            'message': f'{count} items eliminados del carrito'
        }, status=status.HTTP_200_OK)

    @action(detail=False, methods=['post'])
    def migrar_a_usuario(self, request):
        """Migrar carrito de invitado a usuario autenticado"""
        if not request.user.is_authenticated:
            return Response(
                {'error': 'Usuario debe estar autenticado'}, 
                status=status.HTTP_401_UNAUTHORIZED
            )

        session_key = request.data.get('session_key')
        if not session_key:
            return Response(
                {'error': 'session_key es requerido'}, 
                status=status.HTTP_400_BAD_REQUEST
            )

        # Obtener items del carrito de invitado
        items_invitado = Carrito.objects.filter(session_key=session_key)
        migrados = 0

        for item in items_invitado:
            # Verificar si el usuario ya tiene este producto
            carrito_usuario, created = Carrito.objects.get_or_create(
                usuario=request.user,
                producto=item.producto,
                defaults={'cantidad': item.cantidad}
            )
            
            if not created:
                # Sumar cantidades si ya existe
                carrito_usuario.cantidad += item.cantidad
                carrito_usuario.save()
            
            item.delete()
            migrados += 1

        return Response({
            'message': f'{migrados} items migrados al carrito de usuario'
        }, status=status.HTTP_200_OK)