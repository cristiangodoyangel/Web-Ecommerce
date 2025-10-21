from rest_framework import serializers
from .models import Deseo
from productos.serializers import ProductoSerializer

class DeseoSerializer(serializers.ModelSerializer):
    producto = ProductoSerializer(read_only=True)
    producto_id = serializers.IntegerField(write_only=True)

    class Meta:
        model = Deseo
        fields = ['id', 'usuario', 'producto', 'producto_id', 'fecha']
        read_only_fields = ['usuario', 'fecha']

class DeseoCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Deseo
        fields = ['producto']