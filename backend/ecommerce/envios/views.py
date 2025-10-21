from rest_framework import viewsets, permissions
from .models import Envio
from .serializers import EnvioSerializer

class EnvioViewSet(viewsets.ModelViewSet):
	serializer_class = EnvioSerializer
	permission_classes = [permissions.IsAuthenticated]

	def get_queryset(self):
		return Envio.objects.filter(usuario=self.request.user)

	def perform_create(self, serializer):
		serializer.save(usuario=self.request.user)
