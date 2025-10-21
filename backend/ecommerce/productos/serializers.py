from rest_framework import serializers
from .models import Producto
from categorias.models import Categoria
from django.utils import timezone
from django.db import models

class CategoriaSimpleSerializer(serializers.ModelSerializer):
    class Meta:
        model = Categoria
        fields = ['id', 'nombre']

class ProductoSerializer(serializers.ModelSerializer):
    categorias = CategoriaSimpleSerializer(many=True, read_only=True)
    categoria = serializers.SerializerMethodField()  # Campo adicional para compatibilidad
    precio_oferta = serializers.SerializerMethodField()
    en_oferta = serializers.SerializerMethodField()
    porcentaje_descuento = serializers.SerializerMethodField()
    imagen = serializers.SerializerMethodField()  # Devolver URL completa de la imagen

    class Meta:
        model = Producto
        fields = '__all__'
    
    def get_imagen(self, obj):
        """Devuelve la URL completa de la imagen"""
        if obj.imagen:
            request = self.context.get('request')
            if request is not None:
                return request.build_absolute_uri(obj.imagen.url)
            return obj.imagen.url
        return None

    def get_categoria(self, obj):
        # Devolver el nombre de la primera categoría para compatibilidad con el frontend
        categorias = obj.categorias.all()
        return categorias.first().nombre if categorias.exists() else ''
    
    def get_en_oferta(self, obj):
        """Verifica si el producto tiene una oferta activa"""
        now = timezone.now()
        oferta = obj.ofertas.filter(
            activo=True,
            fecha_inicio__lte=now
        ).filter(
            models.Q(fecha_fin__isnull=True) | models.Q(fecha_fin__gte=now)
        ).first()
        return oferta is not None
    
    def get_precio_oferta(self, obj):
        """Calcula el precio con oferta si existe una oferta activa"""
        now = timezone.now()
        oferta = obj.ofertas.filter(
            activo=True,
            fecha_inicio__lte=now
        ).filter(
            models.Q(fecha_fin__isnull=True) | models.Q(fecha_fin__gte=now)
        ).first()
        
        if oferta:
            return oferta.precio_con_descuento
        return None
    
    def get_porcentaje_descuento(self, obj):
        """Devuelve el porcentaje de descuento si existe una oferta activa"""
        now = timezone.now()
        oferta = obj.ofertas.filter(
            activo=True,
            fecha_inicio__lte=now
        ).filter(
            models.Q(fecha_fin__isnull=True) | models.Q(fecha_fin__gte=now)
        ).first()
        
        if oferta:
            return oferta.porcentaje_descuento
        return None