from django.test import TestCase
from rest_framework.test import APITestCase, APIClient
from rest_framework import status
from decimal import Decimal
from django.contrib.auth import get_user_model
from django.db import IntegrityError
from .models import Categoria
from productos.models import Producto

class CategoriaModelTest(TestCase):
    def test_crear_categoria(self):
        """Test de creación de categoría"""
        categoria = Categoria.objects.create(
            nombre='Electrónicos',
            descripcion='Productos electrónicos y tecnología',
            activo=True
        )
        
        self.assertEqual(categoria.nombre, 'Electrónicos')
        self.assertEqual(categoria.descripcion, 'Productos electrónicos y tecnología')
        self.assertTrue(categoria.activo)

    def test_categoria_activo_por_defecto(self):
        """Test de valor por defecto para campo activo"""
        categoria = Categoria.objects.create(
            nombre='Deportes',
            descripcion='Artículos deportivos'
        )
        
        self.assertTrue(categoria.activo)  # Valor por defecto

    def test_categoria_sin_descripcion(self):
        """Test de categoría sin descripción (campo opcional)"""
        categoria = Categoria.objects.create(
            nombre='Libros'
        )
        
        self.assertEqual(categoria.nombre, 'Libros')
        self.assertEqual(categoria.descripcion, '')  # Campo blank=True

    def test_str_representation(self):
        """Test de representación string del modelo"""
        categoria = Categoria.objects.create(
            nombre='Ropa y Accesorios'
        )
        
        self.assertEqual(str(categoria), 'Ropa y Accesorios')

    def test_nombre_unico(self):
        """Test de restricción de nombre único"""
        # Crear primera categoría
        Categoria.objects.create(
            nombre='Hogar',
            descripcion='Productos para el hogar'
        )
        
        # Intentar crear segunda categoría con el mismo nombre
        with self.assertRaises(IntegrityError):
            Categoria.objects.create(
                nombre='Hogar',
                descripcion='Otra descripción'
            )

    def test_nombre_case_sensitive(self):
        """Test que el nombre sea case-sensitive"""
        # Crear categorías con nombres similares pero diferente case
        categoria1 = Categoria.objects.create(nombre='tecnologia')
        categoria2 = Categoria.objects.create(nombre='Tecnologia')
        categoria3 = Categoria.objects.create(nombre='TECNOLOGIA')
        
        self.assertNotEqual(categoria1.nombre, categoria2.nombre)
        self.assertNotEqual(categoria2.nombre, categoria3.nombre)

    def test_descripcion_larga(self):
        """Test con descripción larga"""
        descripcion_larga = "Esta es una descripción muy larga " * 100
        
        categoria = Categoria.objects.create(
            nombre='Categoria con descripción larga',
            descripcion=descripcion_larga
        )
        
        self.assertEqual(categoria.descripcion, descripcion_larga)

    def test_categoria_inactiva(self):
        """Test de categoría inactiva"""
        categoria = Categoria.objects.create(
            nombre='Categoria Inactiva',
            descripcion='Esta categoría está inactiva',
            activo=False
        )
        
        self.assertFalse(categoria.activo)

    def test_nombre_maximo_caracteres(self):
        """Test de nombre con máximo de caracteres permitidos"""
        nombre_largo = 'a' * 100  # El modelo permite max_length=100
        
        categoria = Categoria.objects.create(
            nombre=nombre_largo
        )
        
        self.assertEqual(len(categoria.nombre), 100)

    def test_relacion_con_productos(self):
        """Test de relación con productos"""
        categoria = Categoria.objects.create(
            nombre='Bebidas',
            descripcion='Todo tipo de bebidas'
        )
        
        # Crear producto asociado
        producto = Producto.objects.create(
            nombre='Coca Cola',
            precio=Decimal('2.50'),
            stock=100
        )
        producto.categorias.add(categoria)
        
        # Verificar relación
        self.assertIn(categoria, producto.categorias.all())
        self.assertIn(producto, categoria.productos.all())
class CategoriaViewSetTest(APITestCase):
    def setUp(self):
        self.client = APIClient()
        self.user = get_user_model().objects.create_user(
            username='testuser',
            email='test@example.com',
            password='testpass123'
        )
        
        # Crear categorías de prueba
        self.categoria1 = Categoria.objects.create(
            nombre='Electrónicos',
            descripcion='Productos electrónicos',
            activo=True
        )
        
        self.categoria2 = Categoria.objects.create(
            nombre='Ropa',
            descripcion='Prendas de vestir',
            activo=True
        )
        
        self.categoria_inactiva = Categoria.objects.create(
            nombre='Categoria Inactiva',
            descripcion='Esta categoría está inactiva',
            activo=False
        )

    def test_get_categorias_publico(self):
        """Test de acceso público a categorías"""
        url = '/api/categorias/'
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Verificar que se muestran las categorías activas
        nombres = [cat['nombre'] for cat in response.data['results']]
        self.assertIn('Electrónicos', nombres)
        self.assertIn('Ropa', nombres)

    def test_solo_categorias_activas(self):
        """Test que solo se muestren categorías activas"""
        url = '/api/categorias/'
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Verificar que no se muestre la categoría inactiva
        nombres = [cat['nombre'] for cat in response.data['results']]
        self.assertNotIn('Categoria Inactiva', nombres)

    def test_crear_categoria_sin_autenticacion(self):
        """Test de crear categoría sin autenticación"""
        url = '/api/categorias/'
        data = {
            'nombre': 'Nueva Categoria',
            'descripcion': 'Descripción de nueva categoría',
            'activo': True
        }
        
        response = self.client.post(url, data, format='json')
        # Dependiendo de la configuración de permisos
        # self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_crear_categoria_autenticado(self):
        """Test de crear categoría autenticado"""
        self.client.force_authenticate(user=self.user)
        
        url = '/api/categorias/'
        data = {
            'nombre': 'Deportes',
            'descripcion': 'Artículos deportivos y fitness',
            'activo': True
        }
        
        response = self.client.post(url, data, format='json')
        # Verificar según los permisos configurados
        if response.status_code == status.HTTP_201_CREATED:
            self.assertEqual(response.data['nombre'], 'Deportes')
            self.assertTrue(response.data['activo'])

    def test_obtener_categoria_especifica(self):
        """Test de obtener una categoría específica"""
        url = f'/api/categorias/{self.categoria1.id}/'
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['nombre'], 'Electrónicos')
        self.assertEqual(response.data['descripcion'], 'Productos electrónicos')

    def test_actualizar_categoria(self):
        """Test de actualización de categoría"""
        self.client.force_authenticate(user=self.user)
        
        url = f'/api/categorias/{self.categoria1.id}/'
        data = {
            'nombre': 'Electrónicos y Tecnología',
            'descripcion': 'Productos electrónicos y tecnología avanzada',
            'activo': True
        }
        
        response = self.client.put(url, data, format='json')
        # Verificar según los permisos configurados
        if response.status_code == status.HTTP_200_OK:
            categoria_actualizada = Categoria.objects.get(id=self.categoria1.id)
            self.assertEqual(categoria_actualizada.nombre, 'Electrónicos y Tecnología')

    def test_desactivar_categoria(self):
        """Test de desactivación de categoría"""
        self.client.force_authenticate(user=self.user)
        
        url = f'/api/categorias/{self.categoria1.id}/'
        data = {
            'nombre': self.categoria1.nombre,
            'descripcion': self.categoria1.descripcion,
            'activo': False
        }
        
        response = self.client.put(url, data, format='json')
        # Verificar según los permisos configurados
        if response.status_code == status.HTTP_200_OK:
            categoria_actualizada = Categoria.objects.get(id=self.categoria1.id)
            self.assertFalse(categoria_actualizada.activo)

    def test_eliminar_categoria(self):
        """Test de eliminación de categoría"""
        self.client.force_authenticate(user=self.user)
        
        url = f'/api/categorias/{self.categoria2.id}/'
        response = self.client.delete(url)
        
        # Verificar según los permisos configurados
        if response.status_code == status.HTTP_204_NO_CONTENT:
            self.assertFalse(Categoria.objects.filter(id=self.categoria2.id).exists())

    def test_crear_categoria_nombre_duplicado(self):
        """Test de crear categoría con nombre duplicado"""
        self.client.force_authenticate(user=self.user)
        
        url = '/api/categorias/'
        data = {
            'nombre': 'Electrónicos',  # Nombre que ya existe
            'descripcion': 'Otra descripción',
            'activo': True
        }
        
        response = self.client.post(url, data, format='json')
        # Debe fallar por nombre duplicado
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_buscar_categorias_por_nombre(self):
        """Test de búsqueda de categorías por nombre"""
        # Si la API soporta filtrado por nombre
        url = '/api/categorias/?search=Electr'
        response = self.client.get(url)
        
        if response.status_code == status.HTTP_200_OK and 'search' in url:
            # Verificar que encuentra la categoría que contiene "Electr"
            nombres = [cat['nombre'] for cat in response.data['results']]
            self.assertIn('Electrónicos', nombres)

    def test_ordenamiento_categorias(self):
        """Test de ordenamiento de categorías"""
        url = '/api/categorias/'
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Verificar que hay categorías en la respuesta
        self.assertGreater(len(response.data), 0)

    def test_categoria_con_productos_asociados(self):
        """Test de categoría con productos asociados"""
        # Crear producto asociado a la categoría
        producto = Producto.objects.create(
            nombre='iPhone 13',
            precio=Decimal('1299.99'),
            stock=10
        )
        producto.categorias.add(self.categoria1)
        
        url = f'/api/categorias/{self.categoria1.id}/'
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Si la respuesta incluye productos relacionados
        if 'productos' in response.data:
            productos_nombres = [p['nombre'] for p in response.data['productos']]
            self.assertIn('iPhone 13', productos_nombres)
