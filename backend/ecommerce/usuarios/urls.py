from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import UsuarioViewSet, RegistroUsuarioView, registro_usuario_simple

router = DefaultRouter()
router.register(r'usuarios', UsuarioViewSet, basename='usuario')

urlpatterns = [
 
    path('usuarios/registro-simple/', registro_usuario_simple, name='registro-simple'),
    path('usuarios/registro/', RegistroUsuarioView.as_view(), name='registro-usuario'),
    path('', include(router.urls)),
]