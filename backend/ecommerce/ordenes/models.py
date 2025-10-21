from django.db import models
from usuarios.models import Usuario

class Orden(models.Model):
    ESTADO_CHOICES = [
        ('pendiente', 'Pendiente'),      # Orden creada, esperando pago
        ('pagado', 'Pagado'),            # Pago confirmado por MercadoPago
        ('procesando', 'Procesando'),    # Preparando envío
        ('enviado', 'Enviado'),          # En camino
        ('entregado', 'Entregado'),      # Completado
        ('cancelado', 'Cancelado'),      # Pago rechazado o cancelado por usuario
    ]
    
    METODO_ENTREGA_CHOICES = [
        ('delivery', 'Delivery a Domicilio'),
        ('retiro', 'Retiro en Tienda'),
    ]
    
    usuario = models.ForeignKey(Usuario, on_delete=models.CASCADE, related_name='ordenes', null=True, blank=True)
    session_key = models.CharField(max_length=40, null=True, blank=True)  # Para invitados
    
    # Información del invitado (solo se usa cuando usuario=None)
    email_invitado = models.EmailField(null=True, blank=True)
    nombre_invitado = models.CharField(max_length=100, null=True, blank=True)
    telefono_invitado = models.CharField(max_length=20, null=True, blank=True)
    direccion_invitado = models.TextField(null=True, blank=True)
    
    # Método de entrega
    metodo_entrega = models.CharField(
        max_length=20,
        choices=METODO_ENTREGA_CHOICES,
        default='delivery',
        verbose_name='Método de Entrega'
    )
    costo_envio = models.DecimalField(max_digits=8, decimal_places=2, default=0)
    
    fecha = models.DateTimeField(auto_now_add=True)
    estado = models.CharField(
        max_length=30, 
        choices=ESTADO_CHOICES, 
        default='pendiente',
        verbose_name='Estado de la Orden'
    )
    total = models.DecimalField(max_digits=10, decimal_places=2, default=0)

    def __str__(self):
        if self.usuario:
            return f"Orden #{self.id} - {self.usuario.username}"
        return f"Orden #{self.id} - Invitado ({self.email_invitado})"
    
    class Meta:
        ordering = ['-fecha']
    
    @property
    def direccion_envio(self):
        """Obtiene la dirección de envío según el tipo de usuario"""
        if self.usuario:
            # Usuario logueado: usar dirección del perfil
            return self.usuario.direccion
        else:
            # Usuario invitado: usar dirección proporcionada
            return self.direccion_invitado
    
    @property
    def email_contacto(self):
        """Obtiene el email de contacto según el tipo de usuario"""
        if self.usuario:
            return self.usuario.email
        else:
            return self.email_invitado
    
    @property
    def nombre_completo(self):
        """Obtiene el nombre completo según el tipo de usuario"""
        if self.usuario:
            if self.usuario.first_name and self.usuario.last_name:
                return f"{self.usuario.first_name} {self.usuario.last_name}"
            return self.usuario.username
        else:
            return self.nombre_invitado

class OrdenProducto(models.Model):
    """Productos en una orden específica"""
    orden = models.ForeignKey(Orden, on_delete=models.CASCADE, related_name='productos')
    producto_id = models.IntegerField()  # ID del producto
    nombre_producto = models.CharField(max_length=200)  # Nombre al momento de la compra
    precio_producto = models.DecimalField(max_digits=10, decimal_places=2)  # Precio al momento de la compra
    cantidad = models.PositiveIntegerField()
    subtotal = models.DecimalField(max_digits=10, decimal_places=2)

    def __str__(self):
        return f"Orden #{self.orden.id} - {self.nombre_producto} x{self.cantidad}"