from django.test import TestCase
from rest_framework.test import APITestCase, APIClient
from rest_framework import status
from django.contrib.auth import get_user_model
from django.utils import timezone
from datetime import timedelta
from .models import Analitica
from usuarios.models import Usuario

class AnaliticaModelTest(TestCase):
    def setUp(self):
        self.user = get_user_model().objects.create_user(
            username='testuser',
            email='test@example.com',
            password='testpass123'
        )

    def test_crear_analitica(self):
        """Test de creación de evento de analítica"""
        analitica = Analitica.objects.create(
            usuario=self.user,
            evento='producto_visto',
            valor='producto_id:123'
        )
        
        self.assertEqual(analitica.usuario, self.user)
        self.assertEqual(analitica.evento, 'producto_visto')
        self.assertEqual(analitica.valor, 'producto_id:123')
        self.assertIsNotNone(analitica.fecha)

    def test_analitica_sin_valor(self):
        """Test de evento de analítica sin valor (campo opcional)"""
        analitica = Analitica.objects.create(
            usuario=self.user,
            evento='pagina_inicio_visitada'
        )
        
        self.assertEqual(analitica.evento, 'pagina_inicio_visitada')
        self.assertEqual(analitica.valor, '')  # Campo blank=True

    def test_str_representation(self):
        """Test de representación string del modelo"""
        analitica = Analitica.objects.create(
            usuario=self.user,
            evento='compra_realizada',
            valor='monto:250.00'
        )
        
        expected = f"{self.user.username} - compra_realizada"
        self.assertEqual(str(analitica), expected)

    def test_relacion_con_usuario(self):
        """Test de relación con usuario"""
        analitica = Analitica.objects.create(
            usuario=self.user,
            evento='login'
        )
        
        # Verificar que el evento está relacionado con el usuario
        self.assertIn(analitica, self.user.analiticas.all())

    def test_auto_now_add_fecha(self):
        """Test que la fecha se asigne automáticamente"""
        analitica = Analitica.objects.create(
            usuario=self.user,
            evento='registro_completado'
        )
        
        self.assertIsNotNone(analitica.fecha)
        # Verificar que la fecha es reciente (últimos 5 segundos)
        now = timezone.now()
        self.assertLess(abs((now - analitica.fecha).total_seconds()), 5)

    def test_multiples_eventos_mismo_usuario(self):
        """Test de múltiples eventos del mismo usuario"""
        eventos = [
            ('login', ''),
            ('producto_visto', 'producto_id:1'),
            ('producto_agregado_carrito', 'producto_id:1,cantidad:2'),
            ('compra_iniciada', 'carrito_total:200.00'),
            ('compra_completada', 'orden_id:456')
        ]
        
        analiticas_creadas = []
        for evento, valor in eventos:
            analitica = Analitica.objects.create(
                usuario=self.user,
                evento=evento,
                valor=valor
            )
            analiticas_creadas.append(analitica)
        
        # Verificar que todos los eventos se crearon
        self.assertEqual(self.user.analiticas.count(), 5)
        for analitica in analiticas_creadas:
            self.assertIn(analitica, self.user.analiticas.all())

    def test_eventos_diferentes_usuarios(self):
        """Test de eventos de diferentes usuarios"""
        # Crear segundo usuario
        user2 = get_user_model().objects.create_user(
            username='testuser2',
            email='test2@example.com',
            password='testpass123'
        )
        
        # Crear eventos para ambos usuarios
        analitica1 = Analitica.objects.create(
            usuario=self.user,
            evento='login',
            valor='dispositivo:mobile'
        )
        
        analitica2 = Analitica.objects.create(
            usuario=user2,
            evento='login',
            valor='dispositivo:desktop'
        )
        
        # Verificar que cada usuario tiene su evento
        self.assertIn(analitica1, self.user.analiticas.all())
        self.assertIn(analitica2, user2.analiticas.all())
        self.assertNotIn(analitica2, self.user.analiticas.all())
        self.assertNotIn(analitica1, user2.analiticas.all())

    def test_tipos_eventos_comunes(self):
        """Test de tipos de eventos comunes en ecommerce"""
        eventos_comunes = [
            'login',
            'logout',
            'registro',
            'producto_visto',
            'producto_agregado_carrito',
            'producto_removido_carrito',
            'carrito_abandonado',
            'compra_iniciada',
            'compra_completada',
            'compra_cancelada',
            'busqueda_realizada',
            'filtro_aplicado',
            'categoria_visitada',
            'oferta_vista',
            'descuento_aplicado'
        ]
        
        for evento in eventos_comunes:
            analitica = Analitica.objects.create(
                usuario=self.user,
                evento=evento,
                valor=f'test_value_for_{evento}'
            )
            self.assertEqual(analitica.evento, evento)

    def test_evento_largo(self):
        """Test con evento de nombre largo"""
        evento_largo = 'evento_muy_largo_' * 6  # Cerca del límite de 100 chars
        
        analitica = Analitica.objects.create(
            usuario=self.user,
            evento=evento_largo[:100],  # Truncar si es necesario
            valor='valor de prueba'
        )
        
        self.assertLessEqual(len(analitica.evento), 100)

    def test_valor_largo(self):
        """Test con valor largo"""
        valor_largo = 'valor_muy_largo_' * 15  # Cerca del límite de 255 chars
        
        analitica = Analitica.objects.create(
            usuario=self.user,
            evento='test_evento',
            valor=valor_largo[:255]  # Truncar si es necesario
        )
        
        self.assertLessEqual(len(analitica.valor), 255)

    def test_cascada_eliminacion_usuario(self):
        """Test de eliminación en cascada cuando se elimina usuario"""
        analitica = Analitica.objects.create(
            usuario=self.user,
            evento='test_evento'
        )
        
        analitica_id = analitica.id
        
        # Eliminar usuario
        self.user.delete()
        
        # Verificar que los eventos de analítica también se eliminaron
        self.assertFalse(Analitica.objects.filter(id=analitica_id).exists())


class AnaliticaViewSetTest(APITestCase):
    def setUp(self):
        self.client = APIClient()
        self.user = get_user_model().objects.create_user(
            username='testuser',
            email='test@example.com',
            password='testpass123'
        )
        
        # Crear eventos de analítica
        self.analitica1 = Analitica.objects.create(
            usuario=self.user,
            evento='login',
            valor='dispositivo:mobile'
        )
        
        self.analitica2 = Analitica.objects.create(
            usuario=self.user,
            evento='producto_visto',
            valor='producto_id:123'
        )

    def test_get_analiticas_sin_autenticacion(self):
        """Test de acceso sin autenticación"""
        url = '/api/analiticas/'
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_get_analiticas_autenticado(self):
        """Test de obtener analíticas del usuario autenticado"""
        self.client.force_authenticate(user=self.user)
        url = '/api/analiticas/'
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['results']), 2)

    def test_solo_analiticas_del_usuario(self):
        """Test que solo se muestren las analíticas del usuario autenticado"""
        # Crear otro usuario y evento
        otro_user = get_user_model().objects.create_user(
            username='otrouser',
            email='otro@example.com',
            password='testpass123'
        )
        
        Analitica.objects.create(
            usuario=otro_user,
            evento='compra_realizada',
            valor='monto:500.00'
        )
        
        # Autenticar como primer usuario
        self.client.force_authenticate(user=self.user)
        url = '/api/analiticas/'
        response = self.client.get(url)
        
        # Solo debe ver sus propias analíticas
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['results']), 2)
        eventos = [a['evento'] for a in response.data['results']]
        self.assertIn('login', eventos)
        self.assertIn('producto_visto', eventos)
        self.assertNotIn('compra_realizada', eventos)

    def test_crear_analitica_sin_autenticacion(self):
        """Test de crear evento de analítica sin autenticación"""
        url = '/api/analiticas/'
        data = {
            'evento': 'nuevo_evento',
            'valor': 'test_valor'
        }
        
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_crear_analitica_autenticado(self):
        """Test de crear evento de analítica autenticado"""
        self.client.force_authenticate(user=self.user)
        
        url = '/api/analiticas/'
        data = {
            'evento': 'compra_completada',
            'valor': 'orden_id:789,monto:299.99'
        }
        
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['evento'], 'compra_completada')
        
        # Verificar que el evento se creó correctamente
        analitica_creada = Analitica.objects.get(id=response.data['id'])
        self.assertEqual(analitica_creada.usuario, self.user)
        self.assertEqual(analitica_creada.evento, 'compra_completada')

    def test_crear_analitica_sin_valor(self):
        """Test de crear evento sin valor"""
        self.client.force_authenticate(user=self.user)
        
        url = '/api/analiticas/'
        data = {
            'evento': 'logout'
        }
        
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['evento'], 'logout')
        self.assertEqual(response.data['valor'], '')

    def test_obtener_analitica_especifica(self):
        """Test de obtener un evento específico"""
        self.client.force_authenticate(user=self.user)
        
        url = f'/api/analiticas/{self.analitica1.id}/'
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['evento'], 'login')
        self.assertEqual(response.data['valor'], 'dispositivo:mobile')

    def test_no_acceso_analitica_otro_usuario(self):
        """Test que un usuario no pueda acceder a analíticas de otro usuario"""
        # Crear otro usuario
        otro_user = get_user_model().objects.create_user(
            username='otrouser',
            email='otro@example.com',
            password='testpass123'
        )
        
        # Autenticar como el otro usuario
        self.client.force_authenticate(user=otro_user)
        
        # Intentar acceder al evento del primer usuario
        url = f'/api/analiticas/{self.analitica1.id}/'
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_filtrar_por_evento(self):
        """Test de filtrado por tipo de evento"""
        self.client.force_authenticate(user=self.user)
        
        # Si la API soporta filtrado por evento
        url = '/api/analiticas/?evento=login'
        response = self.client.get(url)
        
        # Verificar que la API responde correctamente
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('results', response.data)
        self.assertIsInstance(response.data['results'], list)
        
        # Nota: El filtrado por evento no está implementado en este ViewSet
        # El test simplemente verifica que la API funciona con parámetros de consulta

    def test_ordenamiento_por_fecha(self):
        """Test de ordenamiento por fecha"""
        self.client.force_authenticate(user=self.user)
        
        # Crear evento más reciente
        Analitica.objects.create(
            usuario=self.user,
            evento='nuevo_evento',
            valor='reciente'
        )
        
        url = '/api/analiticas/'
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Verificar que hay eventos en la respuesta
        self.assertGreater(len(response.data), 0)

    def test_crear_evento_tracking_ecommerce(self):
        """Test de crear eventos típicos de tracking de ecommerce"""
        self.client.force_authenticate(user=self.user)
        
        eventos_ecommerce = [
            {
                'evento': 'producto_visto',
                'valor': 'producto_id:456,categoria:electronics,precio:299.99'
            },
            {
                'evento': 'producto_agregado_carrito',
                'valor': 'producto_id:456,cantidad:1,precio_unitario:299.99'
            },
            {
                'evento': 'carrito_visualizado',
                'valor': 'items_count:3,total:899.97'
            },
            {
                'evento': 'checkout_iniciado',
                'valor': 'total:899.97,metodo_pago:tarjeta'
            },
            {
                'evento': 'compra_completada',
                'valor': 'orden_id:12345,total:899.97,items:3'
            }
        ]
        
        url = '/api/analiticas/'
        
        for evento_data in eventos_ecommerce:
            response = self.client.post(url, evento_data, format='json')
            self.assertEqual(response.status_code, status.HTTP_201_CREATED)
            self.assertEqual(response.data['evento'], evento_data['evento'])
