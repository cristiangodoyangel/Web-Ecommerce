from django.urls import path
from . import views

app_name = 'notificaciones'

urlpatterns = [
    # API endpoints
    path('api/configuracion/', views.ConfiguracionNotificacionView.as_view(), name='configuracion'),
    path('api/test-email/', views.TestEmailView.as_view(), name='test-email'),
    
    # Páginas web
    path('unsubscribe/<int:user_id>/', views.unsubscribe_view, name='unsubscribe'),
    path('configuracion/', views.configuracion_view, name='configuracion_web'),
]