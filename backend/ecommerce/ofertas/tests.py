from django.test import TestCase
from rest_framework.test import APITestCase, APIClient
from rest_framework import status
from decimal import Decimal
from django.utils import timezone
from datetime import timedelta
from django.contrib.auth import get_user_model
from .models import Oferta
from productos.models import Producto, Categoria

class OfertaModelTest(TestCase):
    def setUp(self):
        # Crear categoria
        self.categoria = Categoria.objects.create(
            nombre='Test Categoria',
            descripcion='Test Descripcion'
        )

        # Crear producto y asignar categoria correctamente
        self.producto = Producto.objects.create(
            nombre='Test Producto',
            precio=Decimal('100.00'),
            stock=10
        )
        self.producto.categorias.add(self.categoria)

    def test_crear_oferta(self):
        """Test de creación de oferta"""
        oferta = Oferta.objects.create(
            producto=self.producto,
            porcentaje_descuento=25,
            descripcion='Oferta de prueba',
            activo=True
        )
        
        self.assertEqual(oferta.producto, self.producto)
        self.assertEqual(oferta.porcentaje_descuento, 25)
        self.assertEqual(oferta.descripcion, 'Oferta de prueba')
        self.assertTrue(oferta.activo)

    def test_aplicar_descuento(self):
        """Test del método aplicar_descuento"""
        producto = Producto.objects.create(
            nombre='Test Producto 2',
            precio=Decimal('50.00'),
            stock=5
        )
        producto.categorias.add(self.categoria)
        
        oferta = Oferta.objects.create(
            producto=producto,
            porcentaje_descuento=20,
            activo=True
        )
        
        precio_con_descuento = oferta.aplicar_descuento()
        precio_esperado = Decimal('40.00')  # 50 - 20% = 40
        self.assertEqual(precio_con_descuento, precio_esperado)
