from django.db import models
from usuarios.models import Usuario
from ordenes.models import Orden

class Pago(models.Model):
    usuario = models.ForeignKey(Usuario, on_delete=models.CASCADE, related_name='pagos', null=True, blank=True)
    orden = models.ForeignKey(Orden, on_delete=models.CASCADE, related_name='pagos')
    monto = models.DecimalField(max_digits=10, decimal_places=2)
    fecha = models.DateTimeField(auto_now_add=True)
    estado = models.CharField(max_length=30, default='pendiente')
    
    # Campos para pasarela de pagos
    preference_id = models.CharField(max_length=100, null=True, blank=True)
    payment_id = models.CharField(max_length=100, null=True, blank=True)
    payment_method = models.CharField(max_length=50, null=True, blank=True)
    payment_type = models.CharField(max_length=50, null=True, blank=True)

    def __str__(self):
        if self.usuario:
            return f"Pago #{self.id} - {self.usuario.username} - {self.monto}"
        return f"Pago #{self.id} - Invitado - {self.monto}"