from rest_framework.test import APITestCase
from django.urls import reverse
from rest_framework import status
from usuarios.models import Usuario
from productos.models import Producto

class CarritoTests(APITestCase):
    def setUp(self):

        self.usuario = Usuario.objects.create_user(username="usuario1", password="password123")
        self.producto = Producto.objects.create(nombre="Producto 1", precio=100, stock=10)


        self.url_login = reverse('token_obtain_pair')
        response = self.client.post(self.url_login, {"username": "usuario1", "password": "password123"})
        self.token = response.data['access']
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {self.token}')

    def test_agregar_producto_carrito(self):
        url = reverse('carrito-list')
        data = {"producto": self.producto.id, "cantidad": 2}
        response = self.client.post(url, data, format='json')


        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['producto']['id'], self.producto.id)
        self.assertEqual(response.data['cantidad'], 2)

    def test_validar_stock_al_agregar_producto(self):
        url = reverse('carrito-list')
        data = {"producto": self.producto.id, "cantidad": 15}  
        response = self.client.post(url, data, format='json')


        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('Stock insuficiente', str(response.data))


    def test_usuario_asociado_al_carrito(self):

        url = reverse('carrito-list')
        data = {"producto": self.producto.id, "cantidad": 2}
        response = self.client.post(url, data, format='json')


        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['usuario'], self.usuario.id) 
