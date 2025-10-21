from django.test import TestCase
from rest_framework import status
from rest_framework.test import APIClient
from django.contrib.auth import get_user_model

class UsuarioTests(TestCase):
    def setUp(self):
        self.client = APIClient()

    def test_registro_usuario(self):
        url = '/api/usuarios/registro/'
        data = {
            'username': 'usuario_test',
            'email': 'test@correo.com',
            'password': 'passwordseguro123',
            'direccion': 'Calle Falsa 123',
            'telefono': '1234567890'
        }
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

    def test_login_usuario(self):
        # Crea un usuario y prueba el login
        user = get_user_model().objects.create_user(
            username='usuario_test',
            email='test@correo.com',
            password='passwordseguro123'
        )
        url = '/api/login/'
        data = {'username': 'usuario_test', 'password': 'passwordseguro123'}
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('access', response.data)  # Verifica que el token de acceso esté en la respuesta


class UsuarioSeguridadTests(TestCase):
    """Tests específicos para validar la seguridad de la API de usuarios"""
    
    def setUp(self):
        self.client = APIClient()
        self.user1 = get_user_model().objects.create_user(
            username='user1',
            email='user1@test.com',
            password='testpass123',
            first_name='Usuario',
            last_name='Uno'
        )
        self.user2 = get_user_model().objects.create_user(
            username='user2',
            email='user2@test.com',
            password='testpass123',
            first_name='Usuario',
            last_name='Dos'
        )
        self.admin = get_user_model().objects.create_superuser(
            username='admin',
            email='admin@test.com',
            password='adminpass123'
        )

    def test_acceso_no_autenticado_lista_usuarios(self):
        """Verificar que usuarios no autenticados NO pueden ver la lista"""
        url = '/api/usuarios/'
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_usuario_normal_solo_ve_su_perfil(self):
        """Verificar que usuario normal solo puede ver su propia información"""
        self.client.force_authenticate(user=self.user1)
        url = '/api/usuarios/'
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['results']), 1)
        self.assertEqual(response.data['results'][0]['id'], self.user1.id)
        self.assertEqual(response.data['results'][0]['username'], 'user1')

    def test_usuario_no_puede_ver_otro_usuario(self):
        """Verificar que un usuario no puede acceder a otro usuario específico"""
        self.client.force_authenticate(user=self.user1)
        url = f'/api/usuarios/{self.user2.id}/'
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_admin_puede_ver_todos_usuarios(self):
        """Verificar que admin puede ver todos los usuarios"""
        self.client.force_authenticate(user=self.admin)
        url = '/api/usuarios/'
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['results']), 3)  # user1, user2, admin

    def test_endpoint_perfil_seguro(self):
        """Verificar que el endpoint /perfil/ funciona correctamente"""
        self.client.force_authenticate(user=self.user1)
        url = '/api/usuarios/perfil/'
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['id'], self.user1.id)
        self.assertEqual(response.data['username'], 'user1')
        self.assertIn('email', response.data)
        self.assertIn('first_name', response.data)

    def test_usuario_puede_actualizar_su_perfil(self):
        """Verificar que usuario puede actualizar su propio perfil"""
        self.client.force_authenticate(user=self.user1)
        url = f'/api/usuarios/{self.user1.id}/'
        data = {
            'first_name': 'Nombre Actualizado',
            'telefono': '987654321'
        }
        response = self.client.patch(url, data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['first_name'], 'Nombre Actualizado')

    def test_usuario_no_puede_actualizar_otro_usuario(self):
        """Verificar que usuario no puede actualizar a otro usuario"""
        self.client.force_authenticate(user=self.user1)
        url = f'/api/usuarios/{self.user2.id}/'
        data = {
            'first_name': 'Intento Malicioso'
        }
        response = self.client.patch(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)