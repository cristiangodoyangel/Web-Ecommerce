from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from django.shortcuts import render, get_object_or_404, redirect
from django.contrib.auth import get_user_model
from django.contrib import messages
from .models import ConfiguracionNotificacion, NotificacionCorreo
from .services import NotificacionService
from .serializers import ConfiguracionNotificacionSerializer

User = get_user_model()

class ConfiguracionNotificacionView(APIView):
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        try:
            config = ConfiguracionNotificacion.objects.get(usuario=request.user)
        except ConfiguracionNotificacion.DoesNotExist:
            config = ConfiguracionNotificacion.objects.create(usuario=request.user)
        
        serializer = ConfiguracionNotificacionSerializer(config)
        return Response(serializer.data)
    
    def put(self, request):
        try:
            config = ConfiguracionNotificacion.objects.get(usuario=request.user)
        except ConfiguracionNotificacion.DoesNotExist:
            config = ConfiguracionNotificacion.objects.create(usuario=request.user)
        
        serializer = ConfiguracionNotificacionSerializer(config, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class TestEmailView(APIView):
    permission_classes = [IsAuthenticated]
    
    def post(self, request):
        if not request.user.is_staff:
            return Response(
                {"error": "Solo staff puede enviar correos de prueba"}, 
                status=status.HTTP_403_FORBIDDEN
            )
        
        tipo_email = request.data.get('tipo', 'bienvenida')
        email_destinatario = request.data.get('email', request.user.email)
        
        try:
            service = NotificacionService()
            
            if tipo_email == 'bienvenida':
                notificacion = service.enviar_bienvenida(request.user)
            else:
                return Response(
                    {"error": f"Tipo de email '{tipo_email}' no soportado"}, 
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            return Response({
                "message": f"Email de prueba enviado exitosamente a {email_destinatario}",
                "notificacion_id": notificacion.id if notificacion else None
            })
            
        except Exception as e:
            return Response(
                {"error": f"Error enviando correo de prueba: {str(e)}"}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

def unsubscribe_view(request, user_id):
    user = get_object_or_404(User, id=user_id)
    
    if request.method == 'POST':
        config, created = ConfiguracionNotificacion.objects.get_or_create(usuario=user)
        
        config.recibir_promociones = False
        config.recibir_newsletter = False
        config.recibir_ofertas = False
        config.recibir_bienvenida = False
        config.save()
        
        messages.success(request, 'Te has dado de baja exitosamente de las notificaciones promocionales.')
        return redirect('notificaciones:unsubscribe', user_id=user_id)
    
    context = {
        'usuario': user,
        'config': getattr(user, 'config_notificaciones', None)
    }
    return render(request, 'notificaciones/unsubscribe.html', context)

def configuracion_view(request):
    if not request.user.is_authenticated:
        return redirect('login')
    
    config, created = ConfiguracionNotificacion.objects.get_or_create(usuario=request.user)
    
    if request.method == 'POST':
        config.recibir_bienvenida = request.POST.get('recibir_bienvenida') == 'on'
        config.recibir_confirmaciones = request.POST.get('recibir_confirmaciones') == 'on'
        config.recibir_orden_updates = request.POST.get('recibir_orden_updates') == 'on'
        config.recibir_promociones = request.POST.get('recibir_promociones') == 'on'
        config.recibir_newsletter = request.POST.get('recibir_newsletter') == 'on'
        config.recibir_ofertas = request.POST.get('recibir_ofertas') == 'on'
        config.save()
        
        messages.success(request, 'Configuración de notificaciones actualizada exitosamente.')
        return redirect('notificaciones:configuracion_web')
    
    notificaciones_recientes = NotificacionCorreo.objects.filter(
        usuario=request.user
    ).order_by('-fecha_creacion')[:10]
    
    context = {
        'config': config,
        'notificaciones_recientes': notificaciones_recientes
    }
    return render(request, 'notificaciones/configuracion.html', context)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def historial_notificaciones(request):
    notificaciones = NotificacionCorreo.objects.filter(
        usuario=request.user
    ).order_by('-fecha_creacion')
    
    page = int(request.GET.get('page', 1))
    per_page = int(request.GET.get('per_page', 20))
    start = (page - 1) * per_page
    end = start + per_page
    
    notificaciones_page = notificaciones[start:end]
    
    data = []
    for notif in notificaciones_page:
        data.append({
            'id': notif.id,
            'tipo': notif.get_tipo_display(),
            'asunto': notif.asunto,
            'estado': notif.get_estado_display(),
            'fecha_envio': notif.fecha_envio,
            'fecha_creacion': notif.fecha_creacion,
        })
    
    return Response({
        'notificaciones': data,
        'total': notificaciones.count(),
        'page': page,
        'per_page': per_page,
        'has_next': end < notificaciones.count()
    })