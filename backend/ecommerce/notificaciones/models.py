from django.db import models
from django.contrib.auth import get_user_model
from django.utils import timezone

User = get_user_model()

class TipoNotificacion(models.TextChoices):
    """Tipos de notificaciones disponibles"""
    BIENVENIDA = 'bienvenida', 'Bienvenida'
    CONFIRMACION_REGISTRO = 'confirmacion_registro', 'Confirmación de Registro'
    CONFIRMACION_EMAIL = 'confirmacion_email', 'Confirmación de Email'
    RESETEO_PASSWORD = 'reseteo_password', 'Reseteo de Contraseña'
    ORDEN_CONFIRMADA = 'orden_confirmada', 'Orden Confirmada'
    ORDEN_ENVIADA = 'orden_enviada', 'Orden Enviada'
    ORDEN_ENTREGADA = 'orden_entregada', 'Orden Entregada'
    ORDEN_CANCELADA = 'orden_cancelada', 'Orden Cancelada'
    PAGO_EXITOSO = 'pago_exitoso', 'Pago Exitoso'
    PAGO_FALLIDO = 'pago_fallido', 'Pago Fallido'
    PRODUCTO_DISPONIBLE = 'producto_disponible', 'Producto Disponible'
    OFERTA_ESPECIAL = 'oferta_especial', 'Oferta Especial'
    NEWSLETTER = 'newsletter', 'Newsletter'
    PROMOCION = 'promocion', 'Promoción'

class EstadoNotificacion(models.TextChoices):
    """Estados de las notificaciones"""
    PENDIENTE = 'pendiente', 'Pendiente'
    ENVIADA = 'enviada', 'Enviada'
    FALLIDA = 'fallida', 'Fallida'
    PROGRAMADA = 'programada', 'Programada'

class TemplateCorreo(models.Model):
    """Plantillas para los correos electrónicos"""
    tipo = models.CharField(
        max_length=50,
        choices=TipoNotificacion.choices,
        unique=True,
        verbose_name="Tipo de Notificación"
    )
    nombre = models.CharField(max_length=100, verbose_name="Nombre del Template")
    asunto = models.CharField(max_length=200, verbose_name="Asunto del Email")
    contenido_html = models.TextField(verbose_name="Contenido HTML")
    contenido_texto = models.TextField(
        blank=True,
        null=True,
        verbose_name="Contenido en Texto Plano"
    )
    activo = models.BooleanField(default=True, verbose_name="Activo")
    fecha_creacion = models.DateTimeField(auto_now_add=True)
    fecha_modificacion = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "Template de Correo"
        verbose_name_plural = "Templates de Correo"
        ordering = ['tipo']

    def __str__(self):
        return f"{self.nombre} ({self.get_tipo_display()})"

class NotificacionCorreo(models.Model):
    """Registro de notificaciones enviadas"""
    usuario = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='notificaciones_correo',
        verbose_name="Usuario"
    )
    tipo = models.CharField(
        max_length=50,
        choices=TipoNotificacion.choices,
        verbose_name="Tipo de Notificación"
    )
    email_destinatario = models.EmailField(verbose_name="Email Destinatario")
    asunto = models.CharField(max_length=200, verbose_name="Asunto")
    contenido = models.TextField(verbose_name="Contenido")
    estado = models.CharField(
        max_length=20,
        choices=EstadoNotificacion.choices,
        default=EstadoNotificacion.PENDIENTE,
        verbose_name="Estado"
    )
    fecha_programada = models.DateTimeField(
        null=True,
        blank=True,
        verbose_name="Fecha Programada"
    )
    fecha_envio = models.DateTimeField(
        null=True,
        blank=True,
        verbose_name="Fecha de Envío"
    )
    fecha_creacion = models.DateTimeField(auto_now_add=True)
    
    # Campos para tracking
    orden_id = models.PositiveIntegerField(
        null=True,
        blank=True,
        verbose_name="ID de Orden"
    )
    producto_id = models.PositiveIntegerField(
        null=True,
        blank=True,
        verbose_name="ID de Producto"
    )
    datos_adicionales = models.JSONField(
        default=dict,
        blank=True,
        verbose_name="Datos Adicionales"
    )
    
    # Campos para errores
    mensaje_error = models.TextField(
        blank=True,
        null=True,
        verbose_name="Mensaje de Error"
    )
    intentos_envio = models.PositiveSmallIntegerField(
        default=0,
        verbose_name="Intentos de Envío"
    )

    class Meta:
        verbose_name = "Notificación de Correo"
        verbose_name_plural = "Notificaciones de Correo"
        ordering = ['-fecha_creacion']
        indexes = [
            models.Index(fields=['usuario', 'tipo']),
            models.Index(fields=['estado', 'fecha_programada']),
            models.Index(fields=['fecha_envio']),
        ]

    def __str__(self):
        return f"{self.get_tipo_display()} - {self.email_destinatario} ({self.get_estado_display()})"

    def marcar_como_enviada(self):
        """Marca la notificación como enviada"""
        self.estado = EstadoNotificacion.ENVIADA
        self.fecha_envio = timezone.now()
        self.save(update_fields=['estado', 'fecha_envio'])

    def marcar_como_fallida(self, error_message):
        """Marca la notificación como fallida"""
        self.estado = EstadoNotificacion.FALLIDA
        self.mensaje_error = error_message
        self.intentos_envio += 1
        self.save(update_fields=['estado', 'mensaje_error', 'intentos_envio'])

class ConfiguracionNotificacion(models.Model):
    """Configuración global de notificaciones"""
    usuario = models.OneToOneField(
        User,
        on_delete=models.CASCADE,
        related_name='config_notificaciones',
        verbose_name="Usuario"
    )
    
    # Configuraciones por tipo de notificación
    recibir_bienvenida = models.BooleanField(default=True, verbose_name="Recibir Bienvenida")
    recibir_confirmaciones = models.BooleanField(default=True, verbose_name="Recibir Confirmaciones")
    recibir_orden_updates = models.BooleanField(default=True, verbose_name="Recibir Actualizaciones de Órdenes")
    recibir_promociones = models.BooleanField(default=True, verbose_name="Recibir Promociones")
    recibir_newsletter = models.BooleanField(default=False, verbose_name="Recibir Newsletter")
    recibir_ofertas = models.BooleanField(default=True, verbose_name="Recibir Ofertas Especiales")
    
    fecha_creacion = models.DateTimeField(auto_now_add=True)
    fecha_modificacion = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "Configuración de Notificación"
        verbose_name_plural = "Configuraciones de Notificación"

    def __str__(self):
        return f"Configuración de {self.usuario.get_full_name() or self.usuario.email}"

    def puede_recibir_notificacion(self, tipo_notificacion):
        """Verifica si el usuario puede recibir un tipo específico de notificación"""
        mapping = {
            TipoNotificacion.BIENVENIDA: self.recibir_bienvenida,
            TipoNotificacion.CONFIRMACION_REGISTRO: self.recibir_confirmaciones,
            TipoNotificacion.CONFIRMACION_EMAIL: self.recibir_confirmaciones,
            TipoNotificacion.RESETEO_PASSWORD: True,  # Siempre permitido
            TipoNotificacion.ORDEN_CONFIRMADA: self.recibir_orden_updates,
            TipoNotificacion.ORDEN_ENVIADA: self.recibir_orden_updates,
            TipoNotificacion.ORDEN_ENTREGADA: self.recibir_orden_updates,
            TipoNotificacion.ORDEN_CANCELADA: self.recibir_orden_updates,
            TipoNotificacion.PAGO_EXITOSO: self.recibir_confirmaciones,
            TipoNotificacion.PAGO_FALLIDO: self.recibir_confirmaciones,
            TipoNotificacion.PRODUCTO_DISPONIBLE: self.recibir_ofertas,
            TipoNotificacion.OFERTA_ESPECIAL: self.recibir_ofertas,
            TipoNotificacion.NEWSLETTER: self.recibir_newsletter,
            TipoNotificacion.PROMOCION: self.recibir_promociones,
        }
        return mapping.get(tipo_notificacion, False)
