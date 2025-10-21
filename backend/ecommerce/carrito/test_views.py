from django.test import TestCase
from django.urls import reverse
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient
from rest_framework import status
from decimal import Decimal
from carrito.models import Carrito
from productos.models import Producto
from categorias.models import Categoria

User = get_user_model()

class CarritoViewSetTest(TestCase):
    def setUp(self):
        """Configuración inicial para las pruebas"""
        self.client = APIClient()
        self.user = User.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='testpassword'
        )
        
        # Crear categoría y producto de prueba
        self.categoria = Categoria.objects.create(nombre='Test Category')
        self.producto = Producto.objects.create(
            nombre='Perfume Test',
            descripcion='Un perfume de prueba',
            precio=Decimal('50000'),
            stock=10,
            activo=True
        )
        self.producto.categorias.add(self.categoria)
        
    def test_agregar_producto_carrito_usuario_autenticado(self):
        """Probar agregar producto al carrito para usuario autenticado"""
        self.client.force_authenticate(user=self.user)
        
        data = {
            'producto': self.producto.id,
            'cantidad': 2
        }
        
        url = reverse('carrito-list')
        response = self.client.post(url, data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(Carrito.objects.filter(usuario=self.user).count(), 1)
        
        carrito_item = Carrito.objects.get(usuario=self.user)
        self.assertEqual(carrito_item.producto, self.producto)
        self.assertEqual(carrito_item.cantidad, 2)
        
    def test_agregar_producto_carrito_invitado(self):
        """Probar agregar producto al carrito para invitado"""
        # Configurar sesión
        session = self.client.session
        session.save()
        
        data = {
            'producto': self.producto.id,
            'cantidad': 1
        }
        
        url = reverse('carrito-list')
        response = self.client.post(url, data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(Carrito.objects.filter(session_key=session.session_key).count(), 1)
        
    def test_actualizar_cantidad_carrito(self):
        """Probar actualizar cantidad en carrito"""
        self.client.force_authenticate(user=self.user)
        
        # Crear item en carrito
        carrito_item = Carrito.objects.create(
            usuario=self.user,
            producto=self.producto,
            cantidad=1
        )
        
        data = {'cantidad': 3}
        url = reverse('carrito-detail', kwargs={'pk': carrito_item.pk})
        response = self.client.patch(url, data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        carrito_item.refresh_from_db()
        self.assertEqual(carrito_item.cantidad, 3)
        
    def test_eliminar_producto_carrito(self):
        """Probar eliminar producto del carrito"""
        self.client.force_authenticate(user=self.user)
        
        # Crear item en carrito
        carrito_item = Carrito.objects.create(
            usuario=self.user,
            producto=self.producto,
            cantidad=2
        )
        
        url = reverse('carrito-detail', kwargs={'pk': carrito_item.pk})
        response = self.client.delete(url)
        
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertEqual(Carrito.objects.filter(usuario=self.user).count(), 0)
        
    def test_obtener_resumen_carrito(self):
        """Probar obtener resumen del carrito"""
        self.client.force_authenticate(user=self.user)
        
        # Agregar productos al carrito
        Carrito.objects.create(
            usuario=self.user,
            producto=self.producto,
            cantidad=2
        )
        
        url = reverse('carrito-resumen')
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('total_items', response.data)
        self.assertIn('total_precio', response.data)
        self.assertEqual(response.data['total_items'], 2)
        
    def test_limpiar_carrito(self):
        """Probar limpiar carrito completo"""
        self.client.force_authenticate(user=self.user)
        
        # Agregar productos al carrito
        Carrito.objects.create(
            usuario=self.user,
            producto=self.producto,
            cantidad=1
        )
        
        url = reverse('carrito-limpiar')
        response = self.client.delete(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(Carrito.objects.filter(usuario=self.user).count(), 0)