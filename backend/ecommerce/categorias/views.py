from rest_framework import viewsets
from categorias.models import Categoria
from rest_framework import serializers

# Serializador para el modelo Categoria
class CategoriaSerializer(serializers.ModelSerializer):
    class Meta:
        model = Categoria
        fields = '__all__'

# ViewSet para manejar las operaciones CRUD
class CategoriaViewSet(viewsets.ModelViewSet):
    queryset = Categoria.objects.filter(activo=True)
    serializer_class = CategoriaSerializer
    pagination_class = None  # Desactivar paginación para compatibilidad con frontend
