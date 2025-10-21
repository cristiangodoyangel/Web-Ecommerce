from django.contrib import admin
from django.utils.html import format_html
from django.urls import reverse
from django.utils.safestring import mark_safe
from .models import TemplateCorreo, NotificacionCorreo, ConfiguracionNotificacion, TipoNotificacion, EstadoNotificacion

@admin.register(TemplateCorreo)
class TemplateCorreoAdmin(admin.ModelAdmin):
    list_display = ['nombre', 'tipo', 'asunto', 'activo', 'fecha_modificacion']
    list_filter = ['tipo', 'activo', 'fecha_creacion']
    search_fields = ['nombre', 'asunto', 'tipo']
    readonly_fields = ['fecha_creacion', 'fecha_modificacion']
    
    fieldsets = (
        ('Información General', {
            'fields': ('nombre', 'tipo', 'asunto', 'activo')
        }),
        ('Contenido', {
            'fields': ('contenido_html', 'contenido_texto'),
            'classes': ('wide',)
        }),
        ('Fechas', {
            'fields': ('fecha_creacion', 'fecha_modificacion'),
            'classes': ('collapse',)
        }),
    )

    def get_queryset(self, request):
        qs = super().get_queryset(request)
        return qs.select_related()

@admin.register(NotificacionCorreo)
class NotificacionCorreoAdmin(admin.ModelAdmin):
    list_display = [
        'tipo', 'email_destinatario', 'usuario_link', 'estado', 
        'fecha_envio', 'intentos_envio', 'orden_link'
    ]
    list_filter = [
        'tipo', 'estado', 'fecha_creacion', 'fecha_envio', 
        'intentos_envio'
    ]
    search_fields = [
        'email_destinatario', 'asunto', 'usuario__email', 
        'usuario__first_name', 'usuario__last_name'
    ]
    readonly_fields = [
        'fecha_creacion', 'fecha_envio', 'usuario_link', 
        'orden_link', 'producto_link'
    ]
    date_hierarchy = 'fecha_creacion'
    
    fieldsets = (
        ('Destinatario', {
            'fields': ('usuario_link', 'email_destinatario')
        }),
        ('Contenido', {
            'fields': ('tipo', 'asunto', 'contenido'),
            'classes': ('wide',)
        }),
        ('Estado y Programación', {
            'fields': ('estado', 'fecha_programada', 'fecha_envio', 'intentos_envio')
        }),
        ('Referencias', {
            'fields': ('orden_link', 'producto_link', 'datos_adicionales'),
            'classes': ('collapse',)
        }),
        ('Errores', {
            'fields': ('mensaje_error',),
            'classes': ('collapse',)
        }),
        ('Información del Sistema', {
            'fields': ('fecha_creacion',),
            'classes': ('collapse',)
        }),
    )

    def usuario_link(self, obj):
        if obj.usuario:
            url = reverse('admin:usuarios_usuario_change', args=[obj.usuario.pk])
            return format_html('<a href="{}">{}</a>', url, obj.usuario.get_full_name() or obj.usuario.email)
        return "-"
    usuario_link.short_description = "Usuario"

    def orden_link(self, obj):
        if obj.orden_id:
            try:
                url = reverse('admin:ordenes_orden_change', args=[obj.orden_id])
                return format_html('<a href="{}">Orden #{}</a>', url, obj.orden_id)
            except:
                return f"Orden #{obj.orden_id}"
        return "-"
    orden_link.short_description = "Orden"

    def producto_link(self, obj):
        if obj.producto_id:
            try:
                url = reverse('admin:productos_producto_change', args=[obj.producto_id])
                return format_html('<a href="{}">Producto #{}</a>', url, obj.producto_id)
            except:
                return f"Producto #{obj.producto_id}"
        return "-"
    producto_link.short_description = "Producto"

    def get_queryset(self, request):
        qs = super().get_queryset(request)
        return qs.select_related('usuario')

    actions = ['marcar_como_pendiente', 'reenviar_notificaciones']

    def marcar_como_pendiente(self, request, queryset):
        updated = queryset.filter(estado=EstadoNotificacion.FALLIDA).update(
            estado=EstadoNotificacion.PENDIENTE,
            mensaje_error=None
        )
        self.message_user(request, f'{updated} notificaciones marcadas como pendientes.')
    marcar_como_pendiente.short_description = "Marcar como pendiente"

    def reenviar_notificaciones(self, request, queryset):
        # Importar aquí para evitar importación circular
        from .services import NotificacionService
        
        service = NotificacionService()
        reenviadas = 0
        
        for notificacion in queryset.filter(estado__in=[EstadoNotificacion.FALLIDA, EstadoNotificacion.PENDIENTE]):
            try:
                service.reenviar_notificacion(notificacion)
                reenviadas += 1
            except Exception as e:
                continue
                
        self.message_user(request, f'{reenviadas} notificaciones reenviadas exitosamente.')
    reenviar_notificaciones.short_description = "Reenviar notificaciones seleccionadas"

@admin.register(ConfiguracionNotificacion)
class ConfiguracionNotificacionAdmin(admin.ModelAdmin):
    list_display = [
        'usuario', 'recibir_confirmaciones', 'recibir_orden_updates', 
        'recibir_promociones', 'recibir_newsletter', 'fecha_modificacion'
    ]
    list_filter = [
        'recibir_confirmaciones', 'recibir_orden_updates', 
        'recibir_promociones', 'recibir_newsletter', 'fecha_creacion'
    ]
    search_fields = [
        'usuario__email', 'usuario__first_name', 'usuario__last_name'
    ]
    readonly_fields = ['fecha_creacion', 'fecha_modificacion']
    
    fieldsets = (
        ('Usuario', {
            'fields': ('usuario',)
        }),
        ('Configuración de Notificaciones', {
            'fields': (
                'recibir_bienvenida',
                'recibir_confirmaciones', 
                'recibir_orden_updates',
                'recibir_promociones',
                'recibir_newsletter',
                'recibir_ofertas'
            ),
            'classes': ('wide',)
        }),
        ('Fechas', {
            'fields': ('fecha_creacion', 'fecha_modificacion'),
            'classes': ('collapse',)
        }),
    )

    def get_queryset(self, request):
        qs = super().get_queryset(request)
        return qs.select_related('usuario')

# Personalización adicional del admin
admin.site.site_header = "Life Sex Shop - Administración"
admin.site.site_title = "Life Sex Shop Admin"
admin.site.index_title = "Panel de Administración"
