from rest_framework import viewsets, permissions
from .models import Usuario
from .serializers import UsuarioSerializer, RegistroUsuarioSerializer, UsuarioProfileSerializer
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework import generics
from rest_framework.response import Response
from rest_framework.decorators import api_view, permission_classes, authentication_classes
from rest_framework.decorators import action
from rest_framework import status

class IsOwnerOrAdmin(permissions.BasePermission):
    """Permiso personalizado: solo el propietario o admin pueden ver/editar"""
    
    def has_object_permission(self, request, view, obj):
        # Admin puede ver todo
        if request.user.is_staff:
            return True
        # El usuario solo puede ver/editar su propia información
        return obj == request.user

class UsuarioViewSet(viewsets.ModelViewSet):
    serializer_class = UsuarioSerializer
    permission_classes = [IsAuthenticated, IsOwnerOrAdmin]
    
    def get_queryset(self):
        """Cada usuario solo puede ver su propia información"""
        if self.request.user.is_staff:
            # Admin puede ver todos los usuarios
            return Usuario.objects.all()
        else:
            # Usuario normal solo ve su propia información
            return Usuario.objects.filter(id=self.request.user.id)
    
    def get_serializer_class(self):
        """Usar diferentes serializers según el tipo de usuario"""
        if self.action in ['retrieve', 'update', 'partial_update']:
            return UsuarioProfileSerializer
        return UsuarioSerializer
    
    @action(detail=False, methods=['get'], permission_classes=[IsAuthenticated])
    def perfil(self, request):
        """Endpoint para obtener el perfil del usuario autenticado"""
        serializer = UsuarioProfileSerializer(request.user)
        return Response(serializer.data) 

# VISTA SIMPLIFICADA PARA PRUEBAS
@api_view(['POST'])
@permission_classes([AllowAny])
@authentication_classes([])
def registro_usuario_simple(request):
    serializer = RegistroUsuarioSerializer(data=request.data)
    if serializer.is_valid():
        user = serializer.save()
        return Response({'message': 'Usuario creado exitosamente', 'user_id': user.id})
    return Response(serializer.errors, status=400)

class RegistroUsuarioView(generics.CreateAPIView):
    queryset = Usuario.objects.all()
    serializer_class = RegistroUsuarioSerializer
    permission_classes = [AllowAny]
    authentication_classes = []