from django.test import TestCase
from decimal import Decimal
from django.contrib.auth import get_user_model
from .models import Reseña
from productos.models import Producto, Categoria

User = get_user_model()

class ReseñaModelTest(TestCase):
    def setUp(self):
        """Configurar datos de prueba"""
        # Usuario
        self.user = User.objects.create_user(
            username='testuser',
            email='user@test.com'
        )
        
        # Categoria
        self.categoria = Categoria.objects.create(
            nombre='Test Categoria',
            descripcion='Test descripcion'
        )
        
        # Producto
        self.producto = Producto.objects.create(
            nombre='Test Producto',
            precio=Decimal('100.00'),
            stock=10
        )
        self.producto.categorias.add(self.categoria)

    def test_crear_reseña(self):
        """Test de creación de reseña"""
        reseña = Reseña.objects.create(
            usuario=self.user,
            producto=self.producto,
            calificacion=5,
            comentario='Excelente producto'
        )
        
        self.assertEqual(reseña.usuario, self.user)
        self.assertEqual(reseña.producto, self.producto)
        self.assertEqual(reseña.calificacion, 5)
        self.assertEqual(reseña.comentario, 'Excelente producto')

    def test_str_representation(self):
        """Test string representation de la reseña"""
        reseña = Reseña.objects.create(
            usuario=self.user,
            producto=self.producto,
            calificacion=4,
            comentario='Buen producto'
        )
        
        expected = f"Reseña de {self.user.username} para {self.producto.nombre}"
        self.assertEqual(str(reseña), expected)
