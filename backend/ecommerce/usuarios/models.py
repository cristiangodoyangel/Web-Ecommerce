from django.contrib.auth.models import AbstractUser
from django.db import models

class Usuario(AbstractUser):
    # Campos adicionales para el perfil del usuario
    direccion = models.CharField(max_length=255, null=True, blank=True)
    telefono = models.CharField(max_length=20, null=True, blank=True)
    fecha_nacimiento = models.DateField(null=True, blank=True)
    ciudad = models.CharField(max_length=100, null=True, blank=True)
    comuna = models.CharField(max_length=100, null=True, blank=True)
    codigo_postal = models.CharField(max_length=10, null=True, blank=True)

    class Meta:
        ordering = ['username']

    def __str__(self):
        if self.first_name and self.last_name:
            return f"{self.first_name} {self.last_name}"
        return self.username