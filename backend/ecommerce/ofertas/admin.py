from django.contrib import admin
from django.utils.html import format_html
from .models import Oferta

@admin.register(Oferta)
class OfertaAdmin(admin.ModelAdmin):
    list_display = [
        'producto',
        'porcentaje_descuento',
        'precio_original',
        'precio_con_descuento_display',
        'activo',
        'fecha_inicio',
        'fecha_fin',
        'is_active_display'
    ]
    list_filter = ['activo', 'fecha_inicio', 'fecha_fin', 'producto__categorias']
    search_fields = ['producto__nombre', 'descripcion']
    list_editable = ['activo', 'porcentaje_descuento']
    date_hierarchy = 'fecha_inicio'

    def precio_original(self, obj):
        precio = f"${obj.producto.precio:,.0f}"
        return precio
    precio_original.short_description = "Precio Original"

    def precio_con_descuento_display(self, obj):
        precio_descuento = obj.precio_con_descuento
        precio_formateado = f"${precio_descuento:,.0f}"
        return format_html(
            '<span style="color: #e74c3c; font-weight: bold;">{}</span>',
            precio_formateado
        )
    precio_con_descuento_display.short_description = "Precio c/Descuento"

    def is_active_display(self, obj):
        if obj.is_active():
            return format_html('<span style="color: green;">✓ Activa</span>')
        return format_html('<span style="color: red;">✗ Inactiva</span>')
    is_active_display.short_description = "Estado"

    fieldsets = (
        ('Información básica', {
            'fields': ('producto', 'porcentaje_descuento', 'descripcion')
        }),
        ('Configuración', {
            'fields': ('activo', 'fecha_inicio', 'fecha_fin')
        }),
    )