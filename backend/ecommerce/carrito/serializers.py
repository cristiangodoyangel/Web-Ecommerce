from rest_framework import serializers
from django.utils import timezone
from django.db import models
from .models import Carrito
from productos.serializers import ProductoSerializer

class CarritoSerializer(serializers.ModelSerializer):
    producto = ProductoSerializer(read_only=True)
    producto_id = serializers.IntegerField(write_only=True)
    subtotal = serializers.SerializerMethodField()
    precio_unitario = serializers.SerializerMethodField()
    tiene_oferta = serializers.SerializerMethodField()
    porcentaje_descuento = serializers.SerializerMethodField()

    class Meta:
        model = Carrito
        fields = ['id', 'usuario', 'producto', 'producto_id', 'cantidad', 'agregado', 'subtotal', 'precio_unitario', 'tiene_oferta', 'porcentaje_descuento']
        read_only_fields = ['usuario', 'agregado']

    def get_precio_unitario(self, obj):
        """Obtiene el precio unitario considerando ofertas activas"""
        # Buscar oferta activa para este producto
        now = timezone.now()
        try:
            oferta_activa = obj.producto.ofertas.filter(
                activo=True,
                fecha_inicio__lte=now
            ).filter(
                models.Q(fecha_fin__isnull=True) | models.Q(fecha_fin__gte=now)
            ).first()
            
            if oferta_activa:
                return float(oferta_activa.precio_con_descuento)
            else:
                return float(obj.producto.precio)
        except:
            return float(obj.producto.precio)

    def get_subtotal(self, obj):
        """Calcula el subtotal considerando ofertas activas"""
        precio_unitario = self.get_precio_unitario(obj)
        return precio_unitario * obj.cantidad

    def get_tiene_oferta(self, obj):
        """Verifica si el producto tiene oferta activa"""
        now = timezone.now()
        try:
            return obj.producto.ofertas.filter(
                activo=True,
                fecha_inicio__lte=now
            ).filter(
                models.Q(fecha_fin__isnull=True) | models.Q(fecha_fin__gte=now)
            ).exists()
        except:
            return False

    def get_porcentaje_descuento(self, obj):
        """Obtiene el porcentaje de descuento si hay oferta activa"""
        now = timezone.now()
        try:
            oferta_activa = obj.producto.ofertas.filter(
                activo=True,
                fecha_inicio__lte=now
            ).filter(
                models.Q(fecha_fin__isnull=True) | models.Q(fecha_fin__gte=now)
            ).first()
            
            if oferta_activa:
                return oferta_activa.porcentaje_descuento
            else:
                return 0
        except:
            return 0

class CarritoCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Carrito
        fields = ['producto', 'cantidad']

class CarritoUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Carrito
        fields = ['cantidad']