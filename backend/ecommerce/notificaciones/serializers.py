from rest_framework import serializers
from .models import ConfiguracionNotificacion, NotificacionCorreo, TemplateCorreo

class ConfiguracionNotificacionSerializer(serializers.ModelSerializer):
    """Serializer para la configuración de notificaciones"""
    
    class Meta:
        model = ConfiguracionNotificacion
        fields = [
            'recibir_bienvenida',
            'recibir_confirmaciones', 
            'recibir_orden_updates',
            'recibir_promociones',
            'recibir_newsletter',
            'recibir_ofertas',
            'fecha_creacion',
            'fecha_modificacion'
        ]
        read_only_fields = ['fecha_creacion', 'fecha_modificacion']

class NotificacionCorreoSerializer(serializers.ModelSerializer):
    """Serializer para las notificaciones de correo"""
    tipo_display = serializers.CharField(source='get_tipo_display', read_only=True)
    estado_display = serializers.CharField(source='get_estado_display', read_only=True)
    usuario_email = serializers.CharField(source='usuario.email', read_only=True)
    
    class Meta:
        model = NotificacionCorreo
        fields = [
            'id',
            'tipo',
            'tipo_display',
            'email_destinatario',
            'usuario_email',
            'asunto',
            'estado',
            'estado_display',
            'fecha_programada',
            'fecha_envio',
            'fecha_creacion',
            'orden_id',
            'producto_id',
            'intentos_envio',
            'mensaje_error'
        ]
        read_only_fields = [
            'id', 'fecha_creacion', 'fecha_envio', 'intentos_envio', 
            'mensaje_error', 'tipo_display', 'estado_display', 'usuario_email'
        ]

class TemplateCorreoSerializer(serializers.ModelSerializer):
    """Serializer para los templates de correo"""
    tipo_display = serializers.CharField(source='get_tipo_display', read_only=True)
    
    class Meta:
        model = TemplateCorreo
        fields = [
            'id',
            'tipo',
            'tipo_display',
            'nombre',
            'asunto',
            'contenido_html',
            'contenido_texto',
            'activo',
            'fecha_creacion',
            'fecha_modificacion'
        ]
        read_only_fields = ['id', 'fecha_creacion', 'fecha_modificacion', 'tipo_display']