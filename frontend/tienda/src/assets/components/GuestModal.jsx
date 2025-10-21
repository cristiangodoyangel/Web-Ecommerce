import { useState, useEffect } from 'react';
import { Card, CardContent } from './ui/card.jsx';
import { Button } from './ui/button.jsx';
import { Heart, ShoppingCart, Eye, Star, Tag } from 'lucide-react';
import { useCarrito } from '../../context/CarritoContext.jsx';
import { useDeseos } from '../../context/DeseosContext.jsx';
import AuthModal from './AuthModal.jsx';
import GuestDataModal from './GuestDataModal.jsx';

const ProductCard = ({ product }) => {
  const [isHovered, setIsHovered] = useState(false);
  const [isAddingToCart, setIsAddingToCart] = useState(false);
  const [isTogglingWishlist, setIsTogglingWishlist] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authModalMessage, setAuthModalMessage] = useState('');
  const [showGuestModal, setShowGuestModal] = useState(false);
  const [pendingProductId, setPendingProductId] = useState(null);
  const [isMobile, setIsMobile] = useState(false);

  const { agregarProducto, isAuthenticated, agregarProductoInvitado } = useCarrito();
  const { toggleProducto, items: deseosItems } = useDeseos();

  // Detectar si estamos en móvil
  useEffect(() => {
    const checkIsMobile = () => {
      setIsMobile(window.innerWidth <= 740);
    };
    
    checkIsMobile();
    window.addEventListener('resize', checkIsMobile);
    
    return () => window.removeEventListener('resize', checkIsMobile);
  }, []);

  // Función para truncar título a 4 palabras
  const truncateToWords = (text, wordCount = 4) => {
    if (!text) return '';
    const words = text.split(' ');
    return words.length > wordCount 
      ? words.slice(0, wordCount).join(' ') + '...'
      : text;
  };

  if (!product) {
    return <div>Producto no disponible</div>;
  }

  // Verificar si el producto está en la wishlist
  const isWishlisted = deseosItems.some(item => 
    (item.producto && item.producto.id === product.id) || item.id === product.id
  );

  // Determinar si el producto está en oferta
  const isOnSale = product.en_oferta || product.precio_oferta;
  const displayPrice = isOnSale ? product.precio_oferta : product.precio;
  const originalPrice = isOnSale ? (product.precio_original || product.precio) : null;

  const formatPrice = (price) => {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP',
      minimumFractionDigits: 0,
    }).format(price);
  };

  const showAuthMessage = (message) => {
    setAuthModalMessage(message);
    setShowAuthModal(true);
  };

  const handleWishlistToggle = async (e) => {
    e.stopPropagation();
    
    // La lista de deseos SOLO funciona para usuarios autenticados
    if (!isAuthenticated) {
      showAuthMessage('Debes iniciar sesión para agregar productos a tu lista de deseos');
      return;
    }

    setIsTogglingWishlist(true);
    try {
      const result = await toggleProducto(product.id);
      if (!result.success) {
              }
    } catch (error) {
          } finally {
      setIsTogglingWishlist(false);
    }
  };

  const handleAddToCart = async (e) => {
    e.stopPropagation();
    
    if (isAuthenticated) {
      // Usuario autenticado - agregar directamente
      setIsAddingToCart(true);
      try {
        const result = await agregarProducto(product.id, 1);
        if (result.success) {
                  } else {
                    alert(result.error || 'Error al agregar el producto al carrito');
        }
      } catch (error) {
                alert('Error al agregar el producto al carrito');
      } finally {
        setIsAddingToCart(false);
      }
    } else {
      // Usuario invitado - mostrar modal para datos
      setPendingProductId(product.id);
      setShowGuestModal(true);
    }
  };

  const handleGuestDataSubmit = async (guestData) => {
    setIsAddingToCart(true);
    try {
      // Aquí agregamos la funcionalidad para invitados
      const result = await agregarProductoInvitado(pendingProductId, 1, guestData);
      if (result.success) {
                setShowGuestModal(false);
        setPendingProductId(null);
      } else {
                alert(result.error || 'Error al agregar el producto al carrito');
      }
    } catch (error) {
            alert('Error al agregar el producto al carrito');
    } finally {
      setIsAddingToCart(false);
    }
  };

  const handleQuickView = (e) => {
    e.stopPropagation();
      };

  // Función para navegar al producto
  const handleProductClick = () => {
    window.location.href = `/producto/${product.id}`;
  };

  // Verificar stock usando el campo correcto del modelo Django
  const hasStock = product.stock && product.stock > 0;
  const isActive = product.activo !== false; 

  return (
    <>
      <Card
        className="group relative overflow-hidden border-0 shadow-md transition-all duration-300 cursor-pointer flex flex-col"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onClick={handleProductClick}
        style={{
          background: '#ffffff',
          boxShadow: isHovered
            ? '0 8px 32px 0 rgba(248, 50, 88, 0.25)'
            : '0 2px 8px 0 rgba(140, 0, 15, 0.10)',
          height: '500px', 
          width: '100%'
        }}
      >
        {/* Badge de oferta */}
        {isOnSale && (
          <div className="display absolute top-2 left-2 z-20">
            <div 
              className="px-2 py-1 rounded-full text-white text-xs font-bold flex items-center gap-1 shadow-lg"
              style={{ backgroundColor: '#f83258' }}
            >
              <Tag className="h-3 w-3" />
              🔥 -{product.porcentaje_descuento || Math.round(((originalPrice - displayPrice) / originalPrice) * 100)}%
            </div>
          </div>
        )}

        <CardContent className="p-0 flex flex-col h-full">
          {/* Imagen - altura fija */}
          <div className="relative overflow-hidden" style={{ height: '250px' }}>
            <img
              src={product.imagen || '/placeholder-product.jpg'}
              alt={product.nombre || 'Producto'}
              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
              onError={(e) => {
                e.target.src = '/placeholder-product.jpg';
              }}
            />
            <div
              className={`absolute inset-0 bg-black/40 transition-opacity duration-300 ${isHovered ? 'opacity-100' : 'opacity-0'}`}
            >
              <div className="absolute top-4 right-4 flex flex-col gap-2">
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-8 w-8 p-0 rounded-full"
                  style={{
                    background: '#fff',
                    color: isWishlisted ? '#8c000f' : '#f83258',
                    border: '1px solid #f83258',
                    opacity: isTogglingWishlist ? 0.6 : 1,
                  }}
                  onClick={handleWishlistToggle}
                  disabled={isTogglingWishlist}
                >
                  <Heart
                    className="h-4 w-4"
                    style={{
                      fill: isWishlisted ? '#8c000f' : 'none',
                      color: isWishlisted ? '#8c000f' : '#f83258',
                    }}
                  />
                </Button>
              </div>
              
              <div className="absolute bottom-4 left-4 right-4">
                <Button
                  className="w-full"
                  style={{
                    background: hasStock && isActive ? '#8c000f' : '#f83258',
                    color: '#fff',
                    opacity: isAddingToCart ? 0.6 : 1,
                  }}
                  onClick={handleAddToCart}
                  disabled={!hasStock || !isActive || isAddingToCart}
                >
                  <ShoppingCart className="h-4 w-4 mr-2" style={{ color: '#fff' }} />
                  {isAddingToCart 
                    ? 'Agregando...' 
                    : hasStock && isActive 
                      ? (isAuthenticated ? 'Agregar al Carrito' : 'Comprar como Invitado')
                      : 'Agotado'
                  }
                </Button>
              </div>
            </div>
          </div>

          {/* Contenido - flex-1 para ocupar el espacio restante */}
          <div className="p-4 flex flex-col flex-1" style={{ minHeight: '170px' }}>
            {/* Categoría - altura fija */}
            <div className="text-xs font-medium uppercase tracking-wide mb-2" style={{ color: '#8c000f', height: '16px' }}>
              {product.categoria}
            </div>
            
            {/* Título - altura fija con overflow - CORREGIDO */}
            <h3 
              className="display font-semibold group-hover:underline transition-colors mb-2" 
              style={{ 
                color: '#8c000f',
                height: '48px',
                display: '-webkit-box',
                WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden',
                lineHeight: '1.2'
              }}
            >
              {isMobile ? truncateToWords(product.nombre, 2) : product.nombre}
            </h3>
            
            {/* Descripción - altura fija con overflow */}
            <p 
              className="display text-sm mb-3" 
              style={{ 
                color: '#f83258',
                height: '40px',
                display: '-webkit-box',
                WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                lineHeight: '1.2'
              }}
            >
              {product.descripcion}
            </p>
            
            {/* Spacer para empujar el contenido inferior hacia abajo */}
            <div className="flex-1"></div>
            
            {/* Stock - altura fija */}
            <div className="display flex items-center justify-center mb-3" style={{ height: '20px' }}>
              <div className="text-xs" style={{ color: hasStock ? '#066803ff' : '#f83258' }}>
                {hasStock ? `Disponible` : 'Sin stock'}
              </div>
            </div>

            {/* Precios - altura fija */}
            <div className="display flex items-center justify-center gap-2 mb-6" style={{ height: '32px' }}>
              <span className="text-lg font-bold" style={{ color: isOnSale ? '#f83258' : '#8c000f' }}>
                {formatPrice(displayPrice)}
              </span>
              {isOnSale && originalPrice && (
                <span className="text-sm line-through text-gray-500">
                  {formatPrice(originalPrice)}
                </span>
              )}
              {isOnSale && (
                <span className="text-xs font-semibold text-green-600 bg-green-100 px-2 py-1 rounded">
                  ¡Oferta!
                </span>
              )}
            </div>

            {/* Botón móvil - altura fija */}
            <div className="md:hidden" style={{ height: '40px' }}>
              <Button
                className="w-full h-full"
                style={{
                  background: hasStock && isActive ? '#8c000f' : '#f83258',
                  color: '#fff',
                  opacity: isAddingToCart ? 0.6 : 1,
                }}
                onClick={handleAddToCart}
                disabled={!hasStock || !isActive || isAddingToCart}
              >
                <ShoppingCart className="h-4 w-4 mr-2" style={{ color: '#fff' }} />
                {isAddingToCart 
                  ? 'Agregando...' 
                  : hasStock && isActive 
                    ? (isAuthenticated ? 'Agregar' : 'Comprar')
                    : 'Agotado'
                }
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Modal de Autenticación */}
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        message={authModalMessage}
      />

      {/* Modal de Datos de Invitado */}
      <GuestDataModal
        isOpen={showGuestModal}
        onClose={() => {
          setShowGuestModal(false);
          setPendingProductId(null);
        }}
        onSubmit={handleGuestDataSubmit}
        isProcessing={isAddingToCart}
      />
    </>
  );
};

export default ProductCard;