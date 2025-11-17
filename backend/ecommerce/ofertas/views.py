from rest_framework import generics
from rest_framework.pagination import PageNumberPagination
from django.utils import timezone
from django.db import models
from .models import Oferta
from .serializers import OfertaSerializer

class OfertasActivasListView(generics.ListAPIView):
    
    serializer_class = OfertaSerializer
    pagination_class = None 
    
    def get_queryset(self):
        now = timezone.now()
        return Oferta.objects.filter(
            activo=True,
            fecha_inicio__lte=now
        ).filter(
            models.Q(fecha_fin__isnull=True) | models.Q(fecha_fin__gte=now)
        ).select_related('producto').prefetch_related('producto__categorias')

class OfertaDetailView(generics.RetrieveAPIView):
    
    queryset = Oferta.objects.all()
    serializer_class = OfertaSerializer