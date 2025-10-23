from django.contrib import admin
from django.urls import path, include
from drf_spectacular.views import SpectacularSwaggerView, SpectacularRedocView, SpectacularAPIView
from rest_framework.routers import DefaultRouter
from usuarios.views import UsuarioViewSet
from productos.views import ProductoViewSet
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from carrito.views import CarritoViewSet
from deseos.views import DeseoViewSet
from categorias.views import CategoriaViewSet
from django.conf import settings
from django.conf.urls.static import static
from django.views.generic import RedirectView

router = DefaultRouter()
router.register(r'productos', ProductoViewSet, basename='producto') 
router.register(r'carrito', CarritoViewSet, basename='carrito') 
router.register(r'deseos', DeseoViewSet, basename='deseos')
router.register(r'categorias', CategoriaViewSet, basename='categoria')  

# ROUTER SEPARADO PARA USUARIOS
usuarios_router = DefaultRouter()
usuarios_router.register(r'usuarios-admin', UsuarioViewSet, basename='usuario-admin')

urlpatterns = [
    path('admin/', admin.site.urls),

    # Root redirect to API docs (avoid 404 on '/').
    path('', RedirectView.as_view(url='/api/swagger/', permanent=False)),

    # USUARIOS PRIMERO - ANTES DEL ROUTER
    path('api/', include('usuarios.urls')),

    # API endpoints
    path('api/', include(router.urls)),
    path('api/', include(usuarios_router.urls)),
    
    # Ofertas endpoint
    path('api/ofertas/', include('ofertas.urls')),

    path('api/ordenes/', include('ordenes.urls')),
    
    # Pagos endpoint
    path('api/pagos/', include('pagos.urls')),
    
    # Analítica endpoint
    path('api/analiticas/', include('analitica.urls')),
    
    # Notificaciones endpoint
    path('api/notificaciones/', include('notificaciones.urls')),

    # Auth
    path('api/login/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('api/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),

    # Documentación de la API
    path('api/schema/', SpectacularAPIView.as_view(), name='schema'),
    path('api/swagger/', SpectacularSwaggerView.as_view(url_name='schema'), name='swagger-ui'),
    path('api/redoc/', SpectacularRedocView.as_view(url_name='schema'), name='redoc'),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)