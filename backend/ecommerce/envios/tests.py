from django.test import TestCase
from decimal import Decimal
from django.contrib.auth import get_user_model
from .models import Envio
from productos.models import Producto, Categoria
from ordenes.models import Orden

User = get_user_model()

class EnvioModelTest(TestCase):
    def setUp(self):
        """Configurar datos de prueba"""
        # Usuario
        self.user = User.objects.create_user(
            username='testuser',
            email='user@test.com',
            direccion='Calle Test 123'
        )
        
        # Categoria
        self.categoria = Categoria.objects.create(
            nombre='Test Categoria',
            descripcion='Test descripcion'
        )
        
        # Producto
        self.producto = Producto.objects.create(
            nombre='Test Producto',
            precio=Decimal('100.00'),
            stock=10
        )
        self.producto.categorias.add(self.categoria)
        
        # Orden
        self.orden = Orden.objects.create(
            usuario=self.user,
            total=Decimal('100.00'),
            estado='procesando'
        )

    def test_crear_envio(self):
        """Test de creación de envío"""
        envio = Envio.objects.create(
            usuario=self.user,
            orden=self.orden,
            direccion='Calle Envío 456',
            estado='preparando',
            tipo='domicilio'
        )
        
        self.assertEqual(envio.usuario, self.user)
        self.assertEqual(envio.orden, self.orden)
        self.assertEqual(envio.direccion, 'Calle Envío 456')
        self.assertEqual(envio.estado, 'preparando')
        self.assertEqual(envio.tipo, 'domicilio')

    def test_str_representation(self):
        """Test string representation del envío"""
        envio = Envio.objects.create(
            usuario=self.user,
            orden=self.orden,
            direccion='Calle Test 789',
            estado='en_transito'
        )
        
        expected = f"Envio #{envio.id} - {self.user.username} - retiro"
        self.assertEqual(str(envio), expected)
