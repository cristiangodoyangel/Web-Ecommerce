"""""
from rest_framework.routers import DefaultRouter
from .views import UsuarioViewSet, RegistroUsuarioView
from drf_spectacular.views import SpectacularAPIView, SpectacularRedocView, SpectacularSwaggerView
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView

router = DefaultRouter()
router.register(r'usuarios', UsuarioViewSet, basename='usuario')

urlpatterns = [
    # ESTAS RUTAS DEBEN IR ANTES DEL ROUTER
    path('usuarios/registro/', RegistroUsuarioView.as_view(), name='registro-usuario'),
    path('login/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('schema/', SpectacularAPIView.as_view(), name='schema'),
    path('swagger/', SpectacularSwaggerView.as_view(url_name='schema'), name='swagger-ui'),
    path('redoc/', SpectacularRedocView.as_view(url_name='schema'), name='redoc'),
    
    # EL ROUTER VA AL FINAL
    path('', include(router.urls)), 
] """

from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import UsuarioViewSet, RegistroUsuarioView, registro_usuario_simple

router = DefaultRouter()
router.register(r'usuarios', UsuarioViewSet, basename='usuario')

urlpatterns = [
    # PRUEBA SIMPLE PRIMERO
    path('usuarios/registro-simple/', registro_usuario_simple, name='registro-simple'),
    path('usuarios/registro/', RegistroUsuarioView.as_view(), name='registro-usuario'),
    path('', include(router.urls)),
]