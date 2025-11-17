from django.test import TestCase
from django.contrib.auth import get_user_model
from django.contrib.sessions.models import Session
from ordenes.models import Orden

User = get_user_model()

class OrdenModelTest(TestCase):
    def setUp(self):
        """Configurar datos de prueba"""

        self.usuario = User.objects.create_user(
            username='testuser',
            email='usuario@test.com',
            first_name='Juan',
            last_name='Pérez',
            direccion='Calle Usuario 123, Ciudad Usuario'
        )
        
    def test_orden_usuario_logueado(self):
        """Test orden para usuario logueado - usa datos del perfil"""
        orden = Orden.objects.create(
            usuario=self.usuario,
            total=150.00,
            estado='pendiente'
        )
        

        self.assertIsNone(orden.email_invitado)
        self.assertIsNone(orden.nombre_invitado)
        self.assertIsNone(orden.direccion_invitado)
        

        self.assertEqual(orden.email_contacto, 'usuario@test.com')
        self.assertEqual(orden.nombre_completo, 'Juan Pérez')
        self.assertEqual(orden.direccion_envio, 'Calle Usuario 123, Ciudad Usuario')
        

        self.assertEqual(str(orden), f"Orden #{orden.id} - testuser")
        
    def test_orden_usuario_invitado(self):
        """Test orden para usuario invitado - usa datos del popup"""
        orden = Orden.objects.create(
            usuario=None,  
            session_key='session123',
            email_invitado='invitado@test.com',
            nombre_invitado='María García',
            telefono_invitado='+56912345678',
            direccion_invitado='Calle Invitado 456, Ciudad Invitado',
            total=89.99,
            estado='pendiente'
        )
        

        self.assertEqual(orden.email_invitado, 'invitado@test.com')
        self.assertEqual(orden.nombre_invitado, 'María García')
        self.assertEqual(orden.direccion_invitado, 'Calle Invitado 456, Ciudad Invitado')
        

        self.assertEqual(orden.email_contacto, 'invitado@test.com')
        self.assertEqual(orden.nombre_completo, 'María García')
        self.assertEqual(orden.direccion_envio, 'Calle Invitado 456, Ciudad Invitado')
        

        self.assertEqual(str(orden), f"Orden #{orden.id} - Invitado (invitado@test.com)")
        
    def test_orden_usuario_sin_nombres(self):
        """Test usuario logueado sin first_name/last_name - usar username"""
        usuario_sin_nombres = User.objects.create_user(
            username='usernombrefalso',
            email='usuario2@test.com',
            direccion='Calle Sin Nombres 789'
        )
        
        orden = Orden.objects.create(
            usuario=usuario_sin_nombres,
            total=75.50
        )
        

        self.assertEqual(orden.nombre_completo, 'usernombrefalso')
        
    def test_propiedades_campos_vacios_invitado(self):
        """Test propiedades cuando los campos de invitado están vacíos"""
        orden = Orden.objects.create(
            usuario=None,
            session_key='empty_session',

            total=25.00
        )
        

        self.assertIsNone(orden.email_contacto)
        self.assertIsNone(orden.nombre_completo)
        self.assertIsNone(orden.direccion_envio)
