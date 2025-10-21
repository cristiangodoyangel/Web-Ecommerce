from django.contrib import admin
from django.utils.html import format_html
from django.urls import reverse
from django.utils.safestring import mark_safe
from .models import Orden, OrdenProducto
from envios.models import Envio

# Filtros personalizados para Ordenes
class EstadoOrdenFilter(admin.SimpleListFilter):
    title = 'Estado de la Orden'
    parameter_name = 'estado_orden'

    def lookups(self, request, model_admin):
        return (
            ('pendiente', 'Pendiente'),
            ('enviado', 'Enviado'),
        )

    def queryset(self, request, queryset):
        if self.value():
            return queryset.filter(estado=self.value())

class TipoClienteFilter(admin.SimpleListFilter):
    title = 'Tipo de Cliente'
    parameter_name = 'tipo_cliente'

    def lookups(self, request, model_admin):
        return (
            ('registrado', 'Usuario Registrado'),
            ('invitado', 'Usuario Invitado'),
        )

    def queryset(self, request, queryset):
        if self.value() == 'registrado':
            return queryset.filter(usuario__isnull=False)
        elif self.value() == 'invitado':
            return queryset.filter(usuario__isnull=True)

class MontoFilter(admin.SimpleListFilter):
    title = 'Rango de Monto'
    parameter_name = 'monto_range'

    def lookups(self, request, model_admin):
        return (
            ('bajo', 'Bajo (<$50,000)'),
            ('medio', 'Medio ($50,000-$200,000)'),
            ('alto', 'Alto ($200,000-$500,000)'),
            ('premium', 'Premium (>$500,000)'),
        )

    def queryset(self, request, queryset):
        if self.value() == 'bajo':
            return queryset.filter(total__lt=50000)
        elif self.value() == 'medio':
            return queryset.filter(total__gte=50000, total__lt=200000)
        elif self.value() == 'alto':
            return queryset.filter(total__gte=200000, total__lt=500000)
        elif self.value() == 'premium':
            return queryset.filter(total__gte=500000)

# Inline para productos de la orden
class OrdenProductoInline(admin.TabularInline):
    model = OrdenProducto
    extra = 0
    readonly_fields = ['producto_id', 'nombre_producto', 'precio_producto', 'cantidad', 'subtotal']
    can_delete = False
    
    def has_add_permission(self, request, obj=None):
        return False

# Inline mejorado para envíos con gestión completa
class EnvioInline(admin.TabularInline):
    model = Envio
    extra = 0
    fields = ['direccion', 'tipo', 'estado', 'fecha']
    readonly_fields = ['fecha']
    verbose_name = "Información de Envío"
    verbose_name_plural = "Gestión de Envío"

@admin.register(Orden)
class OrdenAdmin(admin.ModelAdmin):
    list_display = [
        'numero_orden',
        'cliente_display',
        'tipo_cliente_display',
        'total_formateado',
        'estado',  # Campo editable
        'estado_con_envio',  # Estado combinado orden+envío (solo lectura)
        'fecha_display',
        'acciones_display'
    ]
    
    list_filter = [
        EstadoOrdenFilter,
        TipoClienteFilter,
        MontoFilter,
        'fecha',
    ]
    
    search_fields = [
        'id',
        'usuario__username',
        'usuario__email',
        'email_invitado',
        'nombre_invitado'
    ]
    
    list_editable = ['estado']  # Estado editable directamente
    
    date_hierarchy = 'fecha'
    
    list_per_page = 25
    
    ordering = ['-fecha']
    
    inlines = [OrdenProductoInline, EnvioInline]
    
    # Configuración de fieldsets
    fieldsets = (
        ('Información de la Orden', {
            'fields': ('estado', 'total'),
            'classes': ('wide',)
        }),
        ('Cliente Registrado', {
            'fields': ('usuario',),
            'classes': ('wide',),
            'description': 'Solo si es un usuario registrado'
        }),
        ('Cliente Invitado', {
            'fields': ('session_key', 'email_invitado', 'nombre_invitado', 'telefono_invitado', 'direccion_invitado'),
            'classes': ('wide', 'collapse'),
            'description': 'Solo para usuarios no registrados'
        }),
    )
    
    readonly_fields = ['fecha']
    
    # Displays personalizados
    def numero_orden(self, obj):
        return format_html(
            '<strong style="color: #2c3e50; font-size: 14px;">#{}</strong>',
            obj.id
        )
    numero_orden.short_description = "Nº Orden"
    numero_orden.admin_order_field = 'id'
    
    def cliente_display(self, obj):
        if obj.usuario:
            return format_html(
                '<div style="line-height: 1.3;"><strong>{}</strong><br><small style="color: #666;">{}</small></div>',
                obj.nombre_completo,
                obj.email_contacto
            )
        else:
            return format_html(
                '<div style="line-height: 1.3;"><strong>{}</strong><br><small style="color: #666;">{}</small></div>',
                obj.nombre_invitado or 'Invitado',
                obj.email_invitado or 'Sin email'
            )
    cliente_display.short_description = "Cliente"
    
    def tipo_cliente_display(self, obj):
        if obj.usuario:
            return format_html(
                '<span style="background: #3498db; color: white; padding: 2px 6px; border-radius: 10px; font-size: 11px;">Registrado</span>'
            )
        else:
            return format_html(
                '<span style="background: #95a5a6; color: white; padding: 2px 6px; border-radius: 10px; font-size: 11px;">Invitado</span>'
            )
    tipo_cliente_display.short_description = "Tipo"
    
    def total_formateado(self, obj):
        total_formatted = "${:,.0f}".format(obj.total)
        return format_html(
            '<span style="font-weight: bold; color: #27ae60; font-size: 14px;">{}</span>',
            total_formatted
        )
    total_formateado.short_description = "Total"
    total_formateado.admin_order_field = 'total'
    
    def estado_con_envio(self, obj):
        """Muestra el estado de la orden y del envío de forma integrada"""
        # Estado de la orden
        estado_colors = {
            'pendiente': '#f39c12',
            'enviado': '#27ae60',
        }
        
        color_orden = estado_colors.get(obj.estado, '#95a5a6')
        
        # Estado del envío (si existe)
        envio = obj.envios.first()
        envio_info = ""
        if envio:
            envio_colors = {
                'pendiente': '#f39c12',
                'preparando': '#3498db',
                'en_camino': '#9b59b6',
                'entregado': '#27ae60',
                'devuelto': '#e74c3c'
            }
            color_envio = envio_colors.get(envio.estado, '#95a5a6')
            envio_info = format_html(
                '<br><small>Envío: <span style="background: {}; color: white; padding: 1px 4px; border-radius: 6px; font-size: 10px;">{}</span></small>',
                color_envio, envio.estado.upper()
            )
        
        return format_html(
            '<div style="line-height: 1.2;"><span style="background: {}; color: white; padding: 4px 8px; border-radius: 12px; font-size: 11px; font-weight: bold;">{}</span>{}</div>',
            color_orden, obj.estado.upper(), envio_info
        )
    estado_con_envio.short_description = "Estado Orden & Envío"
    estado_con_envio.admin_order_field = 'estado'
    
    def fecha_display(self, obj):
        return format_html(
            '<span style="font-size: 12px; color: #666;">{}</span>',
            obj.fecha.strftime('%d/%m/%Y %H:%M')
        )
    fecha_display.short_description = "Fecha"
    fecha_display.admin_order_field = 'fecha'
    
    def acciones_display(self, obj):
        edit_url = reverse('admin:ordenes_orden_change', args=[obj.pk])
        return format_html(
            '<a href="{}" style="background: #3498db; color: white; padding: 4px 8px; border-radius: 4px; text-decoration: none; font-size: 11px;">Ver Detalle</a>',
            edit_url
        )
    acciones_display.short_description = "Acciones"
    
    # Acciones personalizadas
    actions = ['marcar_pendiente', 'marcar_pagado', 'marcar_procesando', 'marcar_enviado', 'marcar_entregado', 'marcar_cancelado', 'reporte_ventas']
    
    def marcar_pendiente(self, request, queryset):
        count = queryset.update(estado='pendiente')
        # También actualizar envíos a "pendiente" si existen
        for orden in queryset:
            orden.envios.update(estado='pendiente')
        self.message_user(request, '{} órdenes marcadas como "Pendiente" y envíos actualizados.'.format(count))
    marcar_pendiente.short_description = "Marcar como Pendiente"
    
    def marcar_pagado(self, request, queryset):
        count = queryset.update(estado='pagado')
        self.message_user(request, '{} órdenes marcadas como "Pagado".'.format(count))
    marcar_pagado.short_description = "Marcar como Pagado"
    
    def marcar_procesando(self, request, queryset):
        count = queryset.update(estado='procesando')
        # También actualizar envíos a "preparando" si existen
        for orden in queryset:
            orden.envios.update(estado='preparando')
        self.message_user(request, '{} órdenes marcadas como "Procesando" y envíos actualizados.'.format(count))
    marcar_procesando.short_description = "Marcar como Procesando"
    
    def marcar_enviado(self, request, queryset):
        count = queryset.update(estado='enviado')
        # También actualizar envíos a "en_camino" si existen
        for orden in queryset:
            orden.envios.update(estado='en_camino')
        self.message_user(request, '{} órdenes marcadas como "Enviado" y envíos actualizados.'.format(count))
    marcar_enviado.short_description = "Marcar como Enviado"
    
    def marcar_entregado(self, request, queryset):
        count = queryset.update(estado='entregado')
        # También actualizar envíos a "entregado" si existen
        for orden in queryset:
            orden.envios.update(estado='entregado')
        self.message_user(request, '{} órdenes marcadas como "Entregado" y envíos actualizados.'.format(count))
    marcar_entregado.short_description = "Marcar como Entregado"
    
    def marcar_cancelado(self, request, queryset):
        count = queryset.update(estado='cancelado')
        self.message_user(request, '{} órdenes marcadas como "Cancelado".'.format(count))
    marcar_cancelado.short_description = "Marcar como Cancelado"
    
    def reporte_ventas(self, request, queryset):
        total_ordenes = queryset.count()
        total_ventas = sum(orden.total for orden in queryset)
        pendientes = queryset.filter(estado='pendiente').count()
        pagadas = queryset.filter(estado='pagado').count()
        procesando = queryset.filter(estado='procesando').count()
        enviadas = queryset.filter(estado='enviado').count()
        entregadas = queryset.filter(estado='entregado').count()
        canceladas = queryset.filter(estado='cancelado').count()
        
        ventas_formatted = "${:,.0f}".format(total_ventas)
        
        self.message_user(
            request,
            'REPORTE: {} órdenes | Ventas: {} | Pendientes: {} | Pagadas: {} | Procesando: {} | Enviadas: {} | Entregadas: {} | Canceladas: {}'.format(
                total_ordenes, ventas_formatted, pendientes, pagadas, procesando, enviadas, entregadas, canceladas
            )
        )
    reporte_ventas.short_description = "Generar reporte de ventas"
