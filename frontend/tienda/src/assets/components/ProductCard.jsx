import { useState, useEffect } from 'react';
import { Card, CardContent } from './ui/card.jsx';
import { Button } from './ui/button.jsx';
import { Heart, ShoppingCart, Eye, Star, Tag } from 'lucide-react';
import { useCarrito } from '../../context/CarritoContext.jsx';
import { useDeseos } from '../../context/DeseosContext.jsx';
import AuthModal from './AuthModal.jsx';
import WishlistButton from './WishlistButton.jsx';

const ProductCard = ({ product }) => {
  const [isHovered, setIsHovered] = useState(false);
  const [isAddingToCart, setIsAddingToCart] = useState(false);
  const [isTogglingWishlist, setIsTogglingWishlist] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authModalMessage, setAuthModalMessage] = useState('');
  const [isMobile, setIsMobile] = useState(false);

  const { agregarProducto, isAuthenticated } = useCarrito();
  const { toggleProducto, items: deseosItems } = useDeseos();

  // Detectar si estamos en móvil o tablet
  const [isTablet, setIsTablet] = useState(false);

  useEffect(() => {
    const checkDeviceSize = () => {
      const width = window.innerWidth;
      setIsMobile(width <= 640);
      setIsTablet(width > 640 && width <= 1024);
    };
    
    checkDeviceSize();
    window.addEventListener('resize', checkDeviceSize);
    
    return () => window.removeEventListener('resize', checkDeviceSize);
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
    
    // La wishlist SÍ requiere autenticación
    const token = localStorage.getItem('access_token');
    if (!token) {
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
    
    setIsAddingToCart(true);
    try {
      const result = await agregarProducto(product.id, 1);
      if (result.success) {
              } else {
                if (result.error?.detail) {
          alert(result.error.detail);
        }
      }
    } catch (error) {
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
            : '0 2px px 0 rgba(140, 0, 15, 0.10)',
          height: isMobile ? 'auto' : isTablet ? '520px' : '600px', 
          width: '100%',
          minHeight: isMobile ? '400px' : isTablet ? '520px' : '600px'
        }}
      >
        {/* Badge de oferta */}
        {isOnSale && (
          <div className="display absolute top-2 left-2 z-20">
            <div 
              className="rounded-full text-white font-bold flex items-center gap-1 shadow-lg"
              style={{ 
                backgroundColor: '#f83258',
                padding: isMobile ? '4px 8px' : '6px 12px',
                fontSize: isMobile ? '10px' : '12px'
              }}
            >
              <Tag className={isMobile ? "h-2 w-2" : "h-3 w-3"} />
              🔥 -{product.porcentaje_descuento || Math.round(((originalPrice - displayPrice) / originalPrice) * 100)}%
            </div>
          </div>
        )}

        <CardContent className="p-0 flex flex-col h-full">
          {/* Imagen - altura responsive */}
          <div className="relative overflow-hidden" style={{ height: isMobile ? '200px' : isTablet ? '240px' : '300px' }}>
            <img
              src={product.imagen || '/placeholder-product.jpg'}
              alt={product.nombre || 'Producto'}
              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
              onError={(e) => {
                e.target.src = '/placeholder-product.jpg';
              }}
            />
            {/* Overlay con botones - solo en hover para desktop, OCULTO en mobile */}
            <div
              className={`absolute inset-0 bg-black/40 transition-opacity duration-300 ${
                !isMobile && isHovered ? 'opacity-100' : 'opacity-0'
              } ${isMobile ? 'hidden' : ''}`}
            >
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
                      ? 'Agregar al Carrito' 
                      : 'Agotado'
                  }
                </Button>
              </div>
            </div>

            {/* Botón de wishlist - NUEVO COMPONENTE */}
            <div className="absolute top-2 right-2 sm:top-3 sm:right-3 z-10">
              <WishlistButton 
                isWishlisted={isWishlisted}
                isToggling={isTogglingWishlist}
                onClick={handleWishlistToggle}
                disabled={isTogglingWishlist}
                isMobile={isMobile}
              />
            </div>
          </div>

          {/* Contenido - flex-1 para ocupar el espacio restante */}
          <div className="flex flex-col flex-1" style={{ 
            minHeight: isMobile ? '100px' : isTablet ? '120px' : '150px',
            padding: isMobile ? '12px' : isTablet ? '14px' : '20px'
          }}>
            {/* Categoría - altura fija */}
            <div className="text-xs font-medium uppercase tracking-wide mb-1" style={{ 
              color: '#8c000f', 
              height: '14px', 
              fontSize: isMobile ? '10px' : isTablet ? '11px' : '12px' 
            }}>
              {product.categoria}
            </div>
            
            {/* Título - altura fija con overflow - CORREGIDO */}
            <h3 
              className="display font-semibold group-hover:underline transition-colors mb-2" 
              style={{ 
                color: '#8c000f',
                height: isMobile ? 'auto' : isTablet ? '54px' : '72px',
                minHeight: isMobile ? '36px' : isTablet ? '54px' : '72px',
                display: '-webkit-box',
                WebkitLineClamp: isMobile ? 2 : isTablet ? 2 : 3,
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden',
                lineHeight: '1.3',
                fontSize: isMobile ? '14px' : isTablet ? '15px' : '16px'
              }}
            >
              {isMobile ? truncateToWords(product.nombre, 3) : isTablet ? truncateToWords(product.nombre, 4) : product.nombre}
            </h3>
            
            {/* Descripción - altura fija con overflow */}
            {!isMobile && (
              <p 
                className="display mb-3" 
                style={{ 
                  color: '#f83258',
                  minHeight: isTablet ? '36px' : '40px',
                  maxHeight: isTablet ? '40px' : '50px',
                  display: '-webkit-box',
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: 'vertical',
                  overflow: 'hidden',
                  lineHeight: '1.4',
                  fontSize: isTablet ? '12px' : '14px'
                }}
              >
                {truncateToWords(product.descripcion, isTablet ? 8 : 10)}
              </p>
            )}
            
            {/* Spacer para empujar el contenido inferior hacia abajo */}
            <div className="flex-1"></div>
               {/* Spacer para empujar el contenido inferior hacia abajo */}
            <div className="flex-1"></div>
               {/* Spacer para empujar el contenido inferior hacia abajo */}
            <div className="flex-1"></div>
            
            {/* Stock - altura fija */}
            <div className="display flex items-center justify-center mb-1" style={{ 
              height: isMobile ? '16px' : isTablet ? '18px' : '20px' 
            }}>
              <div className="text-xs" style={{ 
                color: hasStock ? '#066803ff' : '#f83258', 
                fontSize: isMobile ? '10px' : isTablet ? '11px' : '12px' 
              }}>
                {hasStock ? `Disponible` : 'Sin stock'}
              </div>
            </div>

            {/* Precios - altura adaptable */}
            <div className="display flex flex-col items-center justify-center gap-1 mb-3" style={{ 
              minHeight: isMobile ? '40px' : isTablet ? '44px' : '50px' 
            }}>
              <span 
                className="font-bold text-center leading-tight" 
                style={{ 
                  color: isOnSale ? '#f83258' : '#8c000f',
                  fontSize: isMobile ? '16px' : isTablet ? '17px' : '18px'
                }}
              >
                {formatPrice(displayPrice)}
              </span>
              {isOnSale && originalPrice && (
                <span className="line-through text-gray-500 text-center" style={{ 
                  fontSize: isMobile ? '11px' : isTablet ? '12px' : '14px' 
                }}>
                  {formatPrice(originalPrice)}
                </span>
              )}
            </div>

            {/* Botón móvil/tablet - altura fija */}
            <div className="lg:hidden" style={{ height: isMobile ? '36px' : '40px' }}>
              <Button
                className="w-full h-full"
                style={{
                  background: hasStock && isActive ? '#8c000f' : '#f83258',
                  color: '#fff',
                  opacity: isAddingToCart ? 0.6 : 1,
                  padding: isMobile ? '6px 12px' : '8px 14px',
                  fontSize: isMobile ? '13px' : '14px'
                }}
                onClick={handleAddToCart}
                disabled={!hasStock || !isActive || isAddingToCart}
              >
                <ShoppingCart className={isMobile ? "h-3 w-3 mr-1" : "h-4 w-4 mr-2"} style={{ color: '#fff' }} />
                {isAddingToCart 
                  ? 'Agregando...' 
                  : hasStock && isActive 
                    ? 'Agregar' 
                    : 'Agotado'
                }
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Modal de Autenticación - SOLO para wishlist */}
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        message={authModalMessage}
      />
    </>
  );
};

export default ProductCard;