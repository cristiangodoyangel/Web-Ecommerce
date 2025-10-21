from django.test import TestCase
from django.contrib.auth import get_user_model
from decimal import Decimal
from ordenes.models import Orden, OrdenProducto
from productos.models import Producto
from categorias.models import Categoria

User = get_user_model()

class OrdenModelTest(TestCase):
    def setUp(self):
        """Configuración inicial para las pruebas"""
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
    
    def test_crear_orden_usuario_autenticado(self):
        """Probar creación de orden para usuario autenticado"""
        orden = Orden.objects.create(
            usuario=self.user,
            estado='pendiente',
            total=Decimal('100000')
        )
        
        self.assertEqual(orden.usuario, self.user)
        self.assertEqual(orden.estado, 'pendiente')
        self.assertEqual(orden.total, Decimal('100000'))
        self.assertIsNone(orden.session_key)
        self.assertIsNone(orden.email_invitado)
        
    def test_crear_orden_invitado(self):
        """Probar creación de orden para invitado"""
        orden = Orden.objects.create(
            session_key='test_session_123',
            email_invitado='invitado@test.com',
            nombre_invitado='Invitado Prueba',
            telefono_invitado='+56912345678',
            direccion_invitado='Calle Falsa 123',
            estado='pendiente',
            total=Decimal('50000')
        )
        
        self.assertIsNone(orden.usuario)
        self.assertEqual(orden.session_key, 'test_session_123')
        self.assertEqual(orden.email_invitado, 'invitado@test.com')
        self.assertEqual(orden.nombre_invitado, 'Invitado Prueba')
        
    def test_orden_producto_relacion(self):
        """Probar relación entre Orden y OrdenProducto"""
        orden = Orden.objects.create(
            usuario=self.user,
            estado='pendiente',
            total=Decimal('50000')
        )
        
        orden_producto = OrdenProducto.objects.create(
            orden=orden,
            producto_id=self.producto.id,
            nombre_producto=self.producto.nombre,
            precio_producto=self.producto.precio,
            cantidad=2,
            subtotal=Decimal('100000')
        )
        
        self.assertEqual(orden.productos.count(), 1)
        self.assertEqual(orden_producto.orden, orden)
        self.assertEqual(orden_producto.cantidad, 2)
        
    def test_str_methods(self):
        """Probar métodos __str__ de los modelos"""
        orden_usuario = Orden.objects.create(
            usuario=self.user,
            estado='pendiente',
            total=Decimal('50000')
        )
        
        orden_invitado = Orden.objects.create(
            session_key='test_session',
            email_invitado='test@test.com',
            estado='pendiente',
            total=Decimal('50000')
        )
        
        self.assertIn(self.user.username, str(orden_usuario))
        self.assertIn('Invitado', str(orden_invitado))