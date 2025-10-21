from django.db import models
from usuarios.models import Usuario
from productos.models import Producto

class Carrito(models.Model):
    usuario = models.ForeignKey(Usuario, on_delete=models.CASCADE, related_name='carritos', null=True, blank=True)
    session_key = models.CharField(max_length=40, null=True, blank=True)  # Para invitados
    producto = models.ForeignKey(Producto, on_delete=models.CASCADE)
    cantidad = models.PositiveIntegerField(default=1)
    agregado = models.DateTimeField(auto_now_add=True)

    class Meta:
        # Un usuario/sesión puede tener solo un item del mismo producto
        constraints = [
            models.UniqueConstraint(
                fields=['usuario', 'producto'],
                condition=models.Q(usuario__isnull=False),
                name='unique_user_product'
            ),
            models.UniqueConstraint(
                fields=['session_key', 'producto'],
                condition=models.Q(session_key__isnull=False),
                name='unique_session_product'
            ),
        ]

    def __str__(self):
        if self.usuario:
            return f"{self.usuario.username} - {self.producto.nombre} ({self.cantidad})"
        return f"Invitado - {self.producto.nombre} ({self.cantidad})" 