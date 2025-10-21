from django.db import models
from usuarios.models import Usuario

class Analitica(models.Model):
	usuario = models.ForeignKey(Usuario, on_delete=models.CASCADE, related_name='analiticas')
	evento = models.CharField(max_length=100)
	valor = models.CharField(max_length=255, blank=True)
	fecha = models.DateTimeField(auto_now_add=True)

	class Meta:
		ordering = ['-fecha']

	def __str__(self):
		return f"{self.usuario.username} - {self.evento}"
