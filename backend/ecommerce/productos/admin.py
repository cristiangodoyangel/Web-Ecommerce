from django.contrib import admin
from django.utils.html import format_html
from django.urls import reverse
from django.utils.safestring import mark_safe
from django.urls import path
from django.shortcuts import redirect
from .models import Producto

# Filtros personalizados
class StockFilter(admin.SimpleListFilter):
    title = 'Estado de Stock'
    parameter_name = 'stock_status'

    def lookups(self, request, model_admin):
        return (
            ('sin_stock', '🔴 Sin Stock (0)'),
            ('bajo_stock', '🟡 Bajo Stock (1-9)'),
            ('stock_normal', '🟢 Stock Normal (10-49)'),
            ('stock_alto', '🔵 Stock Alto (50+)'),
        )

    def queryset(self, request, queryset):
        if self.value() == 'sin_stock':
            return queryset.filter(stock=0)
        elif self.value() == 'bajo_stock':
            return queryset.filter(stock__gte=1, stock__lt=10)
        elif self.value() == 'stock_normal':
            return queryset.filter(stock__gte=10, stock__lt=50)
        elif self.value() == 'stock_alto':
            return queryset.filter(stock__gte=50)

class PrecioFilter(admin.SimpleListFilter):
    title = 'Rango de Precio'
    parameter_name = 'precio_range'

    def lookups(self, request, model_admin):
        return (
            ('economico', '💚 Económico (<$10,000)'),
            ('medio', '💛 Precio Medio ($10,000-$50,000)'),
            ('premium', '💙 Premium ($50,000-$100,000)'),
            ('lujo', '💜 Lujo (>$100,000)'),
        )

    def queryset(self, request, queryset):
        if self.value() == 'economico':
            return queryset.filter(precio__lt=10000)
        elif self.value() == 'medio':
            return queryset.filter(precio__gte=10000, precio__lt=50000)
        elif self.value() == 'premium':
            return queryset.filter(precio__gte=50000, precio__lt=100000)
        elif self.value() == 'lujo':
            return queryset.filter(precio__gte=100000)

@admin.register(Producto)
class ProductoAdmin(admin.ModelAdmin):
    
    # Agregar botón personalizado de "Añadir Oferta"
    change_list_template = "admin/productos/producto_changelist.html"
    
    list_display = [
        'thumbnail_display',    # Imagen
        'nombre',              # Nombre
        'precio',              # Precio
        'stock',               # Stock
        'estado_stock',        # Estado
        'acciones_display'     # Acciones
    ]
    
    list_filter = [
        'activo',
        StockFilter,
        PrecioFilter,
        'categorias',
        'creado',
    ]
    
    search_fields = [
        'nombre',
        'descripcion',
        'categorias__nombre'
    ]
    
    list_editable = [
        'precio',
        'stock'
    ]
    
    date_hierarchy = 'creado'
    
    list_per_page = 25
    
    ordering = ['-creado']
    
    # Filtros personalizados
    def get_queryset(self, request):
        return super().get_queryset(request).prefetch_related('categorias')
    
    # Displays personalizados
    def thumbnail_display(self, obj):
        if obj.imagen:
            return format_html(
                '<img src="{}" style="width: 50px; height: 50px; border-radius: 5px; object-fit: cover;" />',
                obj.imagen.url
            )
        return format_html(
            '<div style="width: 50px; height: 50px; background: #f0f0f0; border-radius: 5px; display: flex; align-items: center; justify-content: center; font-size: 12px; color: #666;">Sin imagen</div>'
        )
    thumbnail_display.short_description = "Imagen"
    
    def categorias_display(self, obj):
        categorias = obj.categorias.all()
        if categorias:
            badges = []
            for categoria in categorias[:3]:  # Máximo 3 categorías mostradas
                badges.append(f'<span style="background: #3498db; color: white; padding: 2px 6px; border-radius: 10px; font-size: 11px; margin-right: 2px;">{categoria.nombre}</span>')
            if categorias.count() > 3:
                badges.append(f'<span style="color: #666; font-size: 11px;">+{categorias.count() - 3} más</span>')
            return format_html(''.join(badges))
        return format_html('<span style="color: #95a5a6; font-style: italic;">Sin categoría</span>')
    categorias_display.short_description = "Categorías"
    
    def precio_formateado(self, obj):
        return format_html(
            '<span style="font-weight: bold; color: #27ae60;">${:,.0f}</span>',
            obj.precio
        )
    precio_formateado.short_description = "Precio"
    precio_formateado.admin_order_field = 'precio'
    
    def stock_display(self, obj):
        if obj.stock == 0:
            color = "#e74c3c"
            icon = "⚠️"
        elif obj.stock < 10:
            color = "#f39c12"
            icon = "⚡"
        else:
            color = "#27ae60"
            icon = "✅"
        
        return format_html(
            '<span style="color: {}; font-weight: bold;">{} {} unidades</span>',
            color, icon, obj.stock
        )
    stock_display.short_description = "Stock"
    stock_display.admin_order_field = 'stock'
    
    def estado_stock(self, obj):
        if obj.stock == 0:
            return format_html('<span style="background: #e74c3c; color: white; padding: 3px 8px; border-radius: 12px; font-size: 11px; font-weight: bold;">AGOTADO</span>')
        elif obj.stock < 10:
            return format_html('<span style="background: #f39c12; color: white; padding: 3px 8px; border-radius: 12px; font-size: 11px; font-weight: bold;">BAJO STOCK</span>')
        elif obj.stock < 50:
            return format_html('<span style="background: #3498db; color: white; padding: 3px 8px; border-radius: 12px; font-size: 11px; font-weight: bold;">DISPONIBLE</span>')
        else:
            return format_html('<span style="background: #27ae60; color: white; padding: 3px 8px; border-radius: 12px; font-size: 11px; font-weight: bold;">STOCK ALTO</span>')
    estado_stock.short_description = "Estado"
    
    def activo_display(self, obj):
        if obj.activo:
            return format_html('<span style="color: #27ae60; font-weight: bold;">✓ Activo</span>')
        return format_html('<span style="color: #e74c3c; font-weight: bold;">✗ Inactivo</span>')
    activo_display.short_description = "Estado"
    activo_display.admin_order_field = 'activo'
    
    def creado_display(self, obj):
        return format_html(
            '<span style="font-size: 12px; color: #666;">{}</span>',
            obj.creado.strftime('%d/%m/%Y %H:%M')
        )
    creado_display.short_description = "Creado"
    creado_display.admin_order_field = 'creado'
    
    def acciones_display(self, obj):
        edit_url = reverse('admin:productos_producto_change', args=[obj.pk])
        return format_html(
            '<a href="{}" style="background: #3498db; color: white; padding: 4px 8px; border-radius: 4px; text-decoration: none; font-size: 11px;">✏️ Editar</a>',
            edit_url
        )
    acciones_display.short_description = "Acciones"
    
    # Configuración de fieldsets para el formulario - TODO EN UNA PÁGINA
    fieldsets = (
        ('📝 Crear/Editar Producto', {
            'fields': (
                'nombre', 
                'descripcion', 
                'precio', 
                'stock', 
                'categorias', 
                'imagen', 
                'activo'
            ),
            'classes': ('wide',),
            'description': 'Complete todos los campos necesarios para crear o editar el producto.'
        }),
    )
    
    # Configuración adicional
    save_on_top = True
    save_as = True  # Permite "Guardar como nuevo"
    
    # Configuración para hacer más amigable el formulario
    autocomplete_fields = []  # Si tuvieras muchas categorías, esto ayudaría
    filter_horizontal = ('categorias',)  # Widget más amigable para seleccionar categorías múltiples
    
    # Texto de ayuda personalizado
    help_texts = {
        'nombre': 'Nombre del producto que aparecerá en la tienda.',
        'descripcion': 'Descripción detallada del producto para los clientes.',
        'precio': 'Precio en pesos chilenos (sin puntos ni comas).',
        'stock': 'Cantidad disponible en inventario.',
        'imagen': 'Imagen principal del producto. Recomendado: 800x800px.',
        'activo': 'Desmarcar para ocultar el producto de la tienda sin eliminarlo.',
    }
    
    # Acciones personalizadas
    actions = ['activar_productos', 'desactivar_productos', 'marcar_sin_stock', 'reporte_inventario']
    
    def activar_productos(self, request, queryset):
        count = queryset.update(activo=True)
        self.message_user(request, f'✅ {count} productos activados correctamente.')
    activar_productos.short_description = "✅ Activar productos seleccionados"
    
    def desactivar_productos(self, request, queryset):
        count = queryset.update(activo=False)
        self.message_user(request, f'❌ {count} productos desactivados correctamente.')
    desactivar_productos.short_description = "❌ Desactivar productos seleccionados"
    
    def marcar_sin_stock(self, request, queryset):
        count = queryset.update(stock=0)
        self.message_user(request, f'📦 {count} productos marcados sin stock.')
    marcar_sin_stock.short_description = "📦 Marcar como sin stock"
    
    def reporte_inventario(self, request, queryset):
        total_productos = queryset.count()
        sin_stock = queryset.filter(stock=0).count()
        bajo_stock = queryset.filter(stock__gte=1, stock__lt=10).count()
        valor_total = sum(p.precio * p.stock for p in queryset)
        
        self.message_user(
            request, 
            f'📊 REPORTE: {total_productos} productos | Sin stock: {sin_stock} | Bajo stock: {bajo_stock} | Valor total inventario: ${valor_total:,.0f}'
        )
    reporte_inventario.short_description = "📊 Generar reporte de inventario"
