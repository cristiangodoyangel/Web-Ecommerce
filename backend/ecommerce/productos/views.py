from rest_framework import viewsets, permissions, filters
from django_filters.rest_framework import DjangoFilterBackend
from .models import Producto
from .serializers import ProductoSerializer

class ProductoViewSet(viewsets.ModelViewSet):
    queryset = Producto.objects.filter(activo=True)
    serializer_class = ProductoSerializer
    permission_classes = [permissions.AllowAny]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['categorias__nombre']  # Permitir filtrar por nombre de categoría
    search_fields = ['nombre', 'descripcion']
    ordering_fields = ['nombre', 'precio', 'creado']
    ordering = ['nombre']
    pagination_class = None  # Desactivar paginación para compatibilidad con frontend