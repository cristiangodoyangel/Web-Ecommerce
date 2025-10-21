from rest_framework import serializers
from .models import Orden, OrdenProducto

class OrdenProductoSerializer(serializers.ModelSerializer):
    class Meta:
        model = OrdenProducto
        fields = '__all__'

class OrdenSerializer(serializers.ModelSerializer):
    productos = OrdenProductoSerializer(many=True, read_only=True)
    total_productos = serializers.SerializerMethodField()
    fecha_formateada = serializers.SerializerMethodField()
    metodo_entrega_display = serializers.SerializerMethodField()
    
    class Meta:
        model = Orden
        fields = '__all__'
    
    def get_total_productos(self, obj):
        """Obtener total de productos en la orden"""
        return obj.productos.count()
    
    def get_fecha_formateada(self, obj):
        """Formatear fecha para mostrar en frontend"""
        return obj.fecha.strftime('%d/%m/%Y %H:%M')
    
    def get_metodo_entrega_display(self, obj):
        """Obtener descripción legible del método de entrega"""
        return obj.get_metodo_entrega_display()

class OrdenHistorialSerializer(serializers.ModelSerializer):
    """Serializer simplificado para el historial de compras"""
    total_productos = serializers.SerializerMethodField()
    fecha_formateada = serializers.SerializerMethodField()
    estado_display = serializers.SerializerMethodField()
    
    class Meta:
        model = Orden
        fields = ['id', 'fecha', 'fecha_formateada', 'estado', 'estado_display', 'total', 'total_productos']
    
    def get_total_productos(self, obj):
        return obj.productos.count()
    
    def get_fecha_formateada(self, obj):
        return obj.fecha.strftime('%d/%m/%Y')
    
    def get_estado_display(self, obj):
        """Mostrar estado más amigable"""
        estados = {
            'pendiente': 'Pendiente',
            'confirmada': 'Confirmada',
            'enviada': 'Enviada',
            'entregada': 'Entregada',
            'cancelada': 'Cancelada'
        }
        return estados.get(obj.estado, obj.estado.title())

class OrdenConProductosSerializer(serializers.ModelSerializer):
    """Serializer completo para ver detalle de orden"""
    productos = OrdenProductoSerializer(many=True, read_only=True)
    fecha_formateada = serializers.SerializerMethodField()
    estado_display = serializers.SerializerMethodField()
    usuario_info = serializers.SerializerMethodField()
    
    class Meta:
        model = Orden
        fields = [
            'id', 'fecha', 'fecha_formateada', 'estado', 'estado_display', 
            'total', 'productos', 'usuario_info', 'email_invitado', 
            'nombre_invitado', 'telefono_invitado', 'direccion_invitado'
        ]
    
    def get_fecha_formateada(self, obj):
        return obj.fecha.strftime('%d/%m/%Y %H:%M')
    
    def get_estado_display(self, obj):
        estados = {
            'pendiente': 'Pendiente',
            'confirmada': 'Confirmada',
            'enviada': 'Enviada',
            'entregada': 'Entregada',
            'cancelada': 'Cancelada'
        }
        return estados.get(obj.estado, obj.estado.title())
    
    def get_usuario_info(self, obj):
        """Información del usuario o invitado"""
        if obj.usuario:
            return {
                'tipo': 'usuario',
                'nombre': obj.usuario.username,
                'email': getattr(obj.usuario, 'email', None)
            }
        else:
            return {
                'tipo': 'invitado',
                'nombre': obj.nombre_invitado,
                'email': obj.email_invitado
            }

class OrdenInvitadoSerializer(serializers.Serializer):
    email = serializers.EmailField()
    nombre = serializers.CharField(max_length=100)
    telefono = serializers.CharField(max_length=20)
    direccion = serializers.CharField(max_length=500)
    metodo_entrega = serializers.ChoiceField(
        choices=[('delivery', 'Delivery a Domicilio'), ('retiro', 'Retiro en Tienda')],
        default='delivery'
    )
    
    def validate_email(self, value):
        """Validar formato de email"""
        return value.lower().strip()
    
    def validate_nombre(self, value):
        """Validar nombre"""
        return value.strip().title()
    
    def validate_telefono(self, value):
        """Validar teléfono básico"""
        return value.strip()
    
    def validate_metodo_entrega(self, value):
        """Validar método de entrega"""
        if value not in ['delivery', 'retiro']:
            raise serializers.ValidationError("Método de entrega inválido")
        return value