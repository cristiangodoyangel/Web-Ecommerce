from django.test import TestCase
from rest_framework.test import APITestCase, APIClient
from rest_framework import status
from decimal import Decimal
from django.contrib.auth import get_user_model
from .models import Deseo
from productos.models import Producto, Categoria

User = get_user_model()

class DeseoModelTest(TestCase):
    def setUp(self):
        """Configurar datos de prueba"""
        # Usuario
        self.user = User.objects.create_user(
            username='testuser',
            email='user@test.com'
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

    def test_crear_deseo(self):
        """Test de creación de deseo"""
        deseo = Deseo.objects.create(
            usuario=self.user,
            producto=self.producto
        )
        
        self.assertEqual(deseo.usuario, self.user)
        self.assertEqual(deseo.producto, self.producto)

    def test_str_representation(self):
        """Test string representation del deseo"""
        deseo = Deseo.objects.create(
            usuario=self.user,
            producto=self.producto
        )
        
        expected = f"{self.user.username} - {self.producto.nombre}"
        self.assertEqual(str(deseo), expected)
