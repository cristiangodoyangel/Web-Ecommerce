from django.test import TestCase
from rest_framework.test import APITestCase, APIClient
from rest_framework import status
from decimal import Decimal
from django.contrib.auth import get_user_model
from .models import Pago
from productos.models import Producto, Categoria
from ordenes.models import Orden

User = get_user_model()

class PagoModelTest(TestCase):
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
        
        # Orden (usuario logueado - usa datos del perfil)
        self.orden = Orden.objects.create(
            usuario=self.user,
            total=Decimal('100.00'),
            estado='procesando'
        )

    def test_crear_pago(self):
        """Test de creación de pago"""
        pago = Pago.objects.create(
            orden=self.orden,
            usuario=self.user,
            monto=Decimal('100.00'),
            estado='pendiente'
        )
        
        self.assertEqual(pago.orden, self.orden)
        self.assertEqual(pago.usuario, self.user)
        self.assertEqual(pago.monto, Decimal('100.00'))
        self.assertEqual(pago.estado, 'pendiente')

    def test_pago_invitado(self):
        """Test pago para usuario invitado"""
        # Orden de invitado
        orden_invitado = Orden.objects.create(
            usuario=None,  # Usuario invitado
            session_key='session123',
            email_invitado='invitado@test.com',
            nombre_invitado='Usuario Invitado',
            direccion_invitado='Calle Invitado 456',
            total=Decimal('75.00'),
            estado='procesando'
        )
        
        pago = Pago.objects.create(
            orden=orden_invitado,
            usuario=None,  # Pago de invitado
            monto=Decimal('75.00'),
            estado='completado'
        )
        
        self.assertIsNone(pago.usuario)
        self.assertEqual(pago.orden, orden_invitado)
        self.assertEqual(pago.monto, Decimal('75.00'))
