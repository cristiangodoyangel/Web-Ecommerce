from rest_framework import viewsets, permissions
from .models import Analitica
from .serializers import AnaliticaSerializer

class AnaliticaViewSet(viewsets.ModelViewSet):
	serializer_class = AnaliticaSerializer
	permission_classes = [permissions.IsAuthenticated]

	def get_queryset(self):
		return Analitica.objects.filter(usuario=self.request.user)

	def perform_create(self, serializer):
		serializer.save(usuario=self.request.user)
