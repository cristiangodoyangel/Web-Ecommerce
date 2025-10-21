from django.db import models
from categorias.models import Categoria  # Asegúrate de importar la clase Categoria

class Producto(models.Model):
    nombre = models.CharField(max_length=100)
    descripcion = models.TextField(blank=True)
    precio = models.DecimalField(max_digits=10, decimal_places=2)
    categorias = models.ManyToManyField(Categoria, related_name='productos', blank=True)  # Cambio aquí
    imagen = models.ImageField(upload_to='productos/', blank=True, null=True)
    activo = models.BooleanField(default=True)
    creado = models.DateTimeField(auto_now_add=True)
    stock = models.PositiveIntegerField(default=0)

    def __str__(self):
        return self.nombre
