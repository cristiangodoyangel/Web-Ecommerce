from django.db import models
from django.utils import timezone
from productos.models import Producto

class Oferta(models.Model):
    producto = models.ForeignKey(Producto, on_delete=models.CASCADE, related_name='ofertas')
    porcentaje_descuento = models.PositiveIntegerField(
        help_text="Porcentaje de descuento (ej: 25 para 25%)"
    )
    descripcion = models.TextField(blank=True, null=True)
    activo = models.BooleanField(default=True)
    fecha_inicio = models.DateTimeField(default=timezone.now)
    fecha_fin = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']
        unique_together = ['producto']  # Un producto solo puede tener una oferta activa

    def __str__(self):
        return f"Oferta {self.porcentaje_descuento}% - {self.producto.nombre}"

    @property
    def precio_con_descuento(self):
        """Calcula el precio con descuento aplicado"""
        descuento = (self.producto.precio * self.porcentaje_descuento) / 100
        return self.producto.precio - descuento
    
    def aplicar_descuento(self):
        """Método para aplicar descuento - alias de precio_con_descuento"""
        return self.precio_con_descuento

    def is_active(self):
        """Verifica si la oferta está activa y dentro del rango de fechas"""
        now = timezone.now()
        if not self.activo:
            return False
        if self.fecha_fin and now > self.fecha_fin:
            return False
        return now >= self.fecha_inicio