from django.test import TestCase
from decimal import Decimal
from productos.models import Producto
from categorias.models import Categoria

class ProductoModelTest(TestCase):
    def setUp(self):
        """Configuración inicial para las pruebas"""
        self.categoria = Categoria.objects.create(nombre='Perfumes')
        
    def test_crear_producto(self):
        """Probar creación de producto"""
        producto = Producto.objects.create(
            nombre='Perfume Premium',
            descripcion='Un perfume exquisito',
            precio=Decimal('75000'),
            stock=20,
            activo=True
        )
        producto.categorias.add(self.categoria)
        
        self.assertEqual(producto.nombre, 'Perfume Premium')
        self.assertEqual(producto.precio, Decimal('75000'))
        self.assertEqual(producto.stock, 20)
        self.assertTrue(producto.activo)
        self.assertEqual(producto.categorias.count(), 1)
        
    def test_producto_str(self):
        """Probar método __str__ del producto"""
        producto = Producto.objects.create(
            nombre='Test Perfume',
            precio=Decimal('50000'),
            stock=10
        )
        
        self.assertEqual(str(producto), 'Test Perfume')
        
    def test_producto_stock_cero(self):
        """Probar producto con stock cero"""
        producto = Producto.objects.create(
            nombre='Producto Agotado',
            precio=Decimal('30000'),
            stock=0
        )
        
        self.assertEqual(producto.stock, 0)
        
    def test_producto_inactivo(self):
        """Probar producto inactivo"""
        producto = Producto.objects.create(
            nombre='Producto Descontinuado',
            precio=Decimal('40000'),
            stock=5,
            activo=False
        )
        
        self.assertFalse(producto.activo)