from django.db import models
from usuarios.models import Usuario
from ordenes.models import Orden

class Envio(models.Model):
	usuario = models.ForeignKey(Usuario, on_delete=models.CASCADE, related_name='envios')
	orden = models.ForeignKey(Orden, on_delete=models.CASCADE, related_name='envios')
	direccion = models.CharField(max_length=255)
	tipo = models.CharField(max_length=30, default='retiro')  # retiro o domicilio
	estado = models.CharField(max_length=30, default='pendiente')
	fecha = models.DateTimeField(auto_now_add=True)

	def __str__(self):
		return f"Envio #{self.id} - {self.usuario.username} - {self.tipo}"
