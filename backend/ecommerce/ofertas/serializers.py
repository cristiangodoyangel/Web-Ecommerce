from rest_framework import serializers
from .models import Oferta
from productos.serializers import ProductoSerializer

class OfertaSerializer(serializers.ModelSerializer):
    producto = ProductoSerializer(read_only=True)
    precio_con_descuento = serializers.ReadOnlyField()
    is_active = serializers.ReadOnlyField()

    class Meta:
        model = Oferta
        fields = [
            'id',
            'producto',
            'porcentaje_descuento',
            'descripcion',
            'activo',
            'fecha_inicio',
            'fecha_fin',
            'precio_con_descuento',
            'is_active',
            'created_at'
        ]