from django.test import TestCase
from django.urls import reverse
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient
from rest_framework import status
from decimal import Decimal
from ordenes.models import Orden, OrdenProducto
from productos.models import Producto
from categorias.models import Categoria
from carrito.models import Carrito

User = get_user_model()

class OrdenViewSetTest(TestCase):
    def setUp(self):
        """Configuración inicial para las pruebas"""
        self.client = APIClient()
        self.user = User.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='testpassword'
        )
        

        self.categoria = Categoria.objects.create(nombre='Test Category')
        self.producto = Producto.objects.create(
            nombre='Perfume Test',
            descripcion='Un perfume de prueba',
            precio=Decimal('50000'),
            stock=10,
            activo=True
        )
        self.producto.categorias.add(self.categoria)
        
    def test_crear_orden_usuario_autenticado_exitoso(self):
        """Probar creación exitosa de orden para usuario autenticado"""

        self.client.force_authenticate(user=self.user)
        

        Carrito.objects.create(
            usuario=self.user,
            producto=self.producto,
            cantidad=2
        )
        

        url = reverse('orden-list')
        response = self.client.post(url, {}, format='json')
        

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertIn('orden', response.data)
        self.assertIn('message', response.data)
        

        self.assertEqual(Orden.objects.count(), 1)
        orden = Orden.objects.first()
        self.assertEqual(orden.usuario, self.user)
        self.assertEqual(orden.productos.count(), 1)
        

        self.producto.refresh_from_db()
        self.assertEqual(self.producto.stock, 8)

        self.assertEqual(Carrito.objects.filter(usuario=self.user).count(), 0)
        
    def test_crear_orden_carrito_vacio(self):
        """Probar creación de orden con carrito vacío"""
        self.client.force_authenticate(user=self.user)
        
        url = reverse('orden-list')
        response = self.client.post(url, {}, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('error', response.data)
        self.assertIn('vacío', response.data['error'])
        
    def test_crear_orden_stock_insuficiente(self):
        """Probar creación de orden con stock insuficiente"""
        self.client.force_authenticate(user=self.user)
        

        Carrito.objects.create(
            usuario=self.user,
            producto=self.producto,
            cantidad=15  
        )
        
        url = reverse('orden-list')
        response = self.client.post(url, {}, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('error', response.data)
        self.assertIn('Stock insuficiente', response.data['error'])
        
    def test_crear_orden_invitado_exitoso(self):
        """Probar creación exitosa de orden para invitado"""

        session = self.client.session
        session.save()
        session_key = session.session_key
        

        Carrito.objects.create(
            session_key=session_key,
            producto=self.producto,
            cantidad=1
        )
        

        datos_invitado = {
            'email': 'invitado@test.com',
            'nombre': 'Test Invitado',
            'telefono': '+56912345678',
            'direccion': 'Calle Test 123'
        }
        
        url = reverse('orden-crear-orden-invitado')
        response = self.client.post(url, datos_invitado, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertIn('orden_id', response.data)
        self.assertIn('total', response.data)
        

        self.assertEqual(Orden.objects.count(), 1)
        orden = Orden.objects.first()
        self.assertEqual(orden.email_invitado, 'invitado@test.com')
        

        self.producto.refresh_from_db()
        self.assertEqual(self.producto.stock, 9)
        
    def test_acceso_no_autenticado_historial(self):
        """Probar acceso no autenticado al historial"""
        url = reverse('orden-list')
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
        
    def test_historial_usuario_autenticado(self):
        """Probar historial para usuario autenticado"""
        self.client.force_authenticate(user=self.user)
        

        orden = Orden.objects.create(
            usuario=self.user,
            estado='entregada',
            total=Decimal('50000')
        )
        
        url = reverse('orden-list')
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['results']), 1)