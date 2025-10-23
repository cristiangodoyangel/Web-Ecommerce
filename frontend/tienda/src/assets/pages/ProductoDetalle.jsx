import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Heart, ShoppingCart, ArrowLeft, Star, Plus, Minus } from 'lucide-react';
import { useCarrito } from '../../context/CarritoContext.jsx';
import { useDeseos } from '../../context/DeseosContext.jsx';
import API_BASE_URL from '../../config';

export default function ProductoDetalle() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [isAddingToCart, setIsAddingToCart] = useState(false);
  const [isTogglingWishlist, setIsTogglingWishlist] = useState(false);
  const [oferta, setOferta] = useState(null);

  const { agregarProducto } = useCarrito();
  const { toggleProducto, items: deseosItems } = useDeseos();

  // Verificar si el producto está en la wishlist
  const isWishlisted = deseosItems.some(item => item.producto.id === parseInt(id));

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        // Obtener producto
        const productResponse = await fetch(`${API_BASE_URL}/productos/${id}/`);
        if (productResponse.ok) {
          const productData = await productResponse.json();
          setProduct(productData);
          
          // Verificar si hay ofertas activas para este producto
          try {
            const ofertasResponse = await fetch(`${API_BASE_URL}/ofertas/`);
            if (ofertasResponse.ok) {
              const ofertasData = await ofertasResponse.json();
              const ofertaActiva = ofertasData.find(o => 
                o.producto.id === productData.id && 
                o.activo && 
                new Date(o.fecha_fin) > new Date()
              );
              if (ofertaActiva) {
                setOferta(ofertaActiva);
              }
            }
          } catch (ofertaError) {
                      }
        } else {
          navigate('/productos'); // Redirigir si no se encuentra el producto
        }
      } catch (error) {
        navigate('/productos');
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchProduct();
    }
  }, [id, navigate]);

  const formatPrice = (price) => {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP',
      minimumFractionDigits: 0,
    }).format(price);
  };

 const handleAddToCart = async () => {
  setIsAddingToCart(true);
  try {
    await agregarProducto(product.id, quantity); // Funciona para autenticados E invitados
  } catch (error) {
    // Error handling
  } finally {
    setIsAddingToCart(false);
  }
};

  const handleWishlistToggle = async () => {
    const token = localStorage.getItem('access_token');
    if (!token) {
      return;
    }

    setIsTogglingWishlist(true);
    try {
      await toggleProducto(product.id);
    } catch (error) {
      // Error handling silencioso
    } finally {
      setIsTogglingWishlist(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center" style={{ color: '#8c000f' }}>
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto mb-4"></div>
          <div className="text-lg">Cargando producto...</div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center" style={{ color: '#8c000f' }}>
          <div className="text-lg">Producto no encontrado</div>
          <Button 
            onClick={() => navigate('/productos')}
            className="mt-4"
            style={{ backgroundColor: '#8c000f', color: '#fff' }}
          >
            Volver a productos
          </Button>
        </div>
      </div>
    );
  };

  const hasStock = product.stock && product.stock > 0;
  const isActive = product.activo !== false;

  return (
    <div className="bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-8 mb-0">

        <div className="flex flex-col gap-8 bg-white rounded-lg shadow-lg p-6">
          {/* Imagen del producto */}
          <div className="relative max-w-md mx-auto">
            <img
              src={product.imagen}
              alt={product.nombre}
              className="w-full h-80 sm:h-96 object-cover rounded-lg"
              onError={(e) => {
                e.target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjQwMCIgdmlld0JveD0iMCAwIDQwMCA0MDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSI0MDAiIGhlaWdodD0iNDAwIiBmaWxsPSIjZjNmNGY2Ii8+CjxwYXRoIGQ9Ik0yMDAgMzAwQzI1NS4yMjggMzAwIDMwMCAyNTUuMjI4IDMwMCAyMDBDMzAwIDE0NC43NzIgMjU1LjIyOCAxMDAgMjAwIDEwMEMxNDQuNzcyIDEwMCAxMDAgMTQ0Ljc3MiAxMDAgMjAwQzEwMCAyNTUuMjI4IDE0NC43NzIgMzAwIDIwMCAzMDBaIiBmaWxsPSIjZTFlNWU5Ii8+Cjwvc3ZnPgo=';
              }}
            />
            {/* Badge de oferta */}
            {oferta && (
              <div 
                className="absolute top-4 left-4 px-3 py-1 rounded-full text-white text-sm font-bold"
                style={{ backgroundColor: '#f83258' }}
              >
                -{oferta.porcentaje_descuento}% OFF
              </div>
            )}
            {/* Botón de wishlist en la imagen */}
            <Button
              size="sm"
              variant="ghost"
              className="absolute top-4 right-4 h-10 w-10 p-0 rounded-full bg-white/90 hover:bg-white border border-red-200"
              onClick={handleWishlistToggle}
              disabled={isTogglingWishlist}
              style={{ opacity: isTogglingWishlist ? 0.6 : 1 }}
            >
              <Heart
                className="h-5 w-5"
                style={{
                  fill: isWishlisted ? '#8c000f' : 'none',
                  color: isWishlisted ? '#8c000f' : '#f83258',
                }}
              />
            </Button>
          </div>

          {/* Información del producto */}
          <div className="space-y-6 max-w-lg mx-auto">
            <div>
              <p className="display text-sm font-medium uppercase tracking-wide mb-2 text-center" style={{ color: '#f83258' }}>
                {product.categoria}
              </p>
              <h1 className="display text-2xl sm:text-3xl font-bold mb-4 text-center" style={{ color: '#8c000f' }}>
                {product.nombre}
              </h1>
              
              {/* Precio */}
              <div className="flex flex-col sm:flex-row justify-center items-center gap-2 sm:gap-4 mb-6">
                {oferta ? (
                  <>
                    <span className="display text-2xl sm:text-3xl font-bold" style={{ color: '#f83258' }}>
                      {formatPrice(oferta.precio_con_descuento)}
                    </span>
                    <span className="display text-lg sm:text-xl line-through text-gray-500">
                      {formatPrice(product.precio)}
                    </span>
                    <span className="display text-xs sm:text-sm font-medium px-2 py-1 rounded" style={{ backgroundColor: '#f83258', color: 'white' }}>
                      Ahorra {formatPrice(product.precio - oferta.precio_con_descuento)}
                    </span>
                  </>
                ) : (
                  <span className="display text-2xl sm:text-3xl font-bold" style={{ color: '#8c000f' }}>
                    {formatPrice(product.precio)}
                  </span>
                )}
              </div>

              {/* Stock */}
              <div className="mb-6 text-center">
                <span 
                  className="text-sm font-medium"
                  style={{ color: hasStock ? '#1f7c0cff' : '#f83258' }}
                >
                  {hasStock ? `Disponible` : 'Sin stock'}
                </span>
              </div>
            </div>

            {/* Descripción */}
            <div>
              <h3 className="text-lg font-semibold mb-2" style={{ color: '#8c000f' }}>
                Descripción
              </h3>
              <p style={{ color: '#666' }}>
                {product.descripcion}
              </p>
            </div>

            {/* Cantidad y botones */}
            {hasStock && isActive && (
              <div className="space-y-4">
                <div className="flex flex-col items-center gap-3">
                  <label className="display text-sm font-medium" style={{ color: '#8c000f' }}>
                    Cantidad:
                  </label>
                  <div className="display flex items-center border-2 rounded-lg overflow-hidden bg-white shadow-sm">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      disabled={quantity <= 1}
                      className="h-16 w-16 p-0 rounded-none hover:bg-gray-100 border-r flex items-center justify-center text-gray-600 hover:text-gray-900"
                    >
                      <Minus className="h-8 w-8" />
                    </Button>
                    <span className="px-8 py-3 min-w-[80px] text-center font-bold text-xl text-gray-800">
                      {quantity}
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setQuantity(Math.min(product.stock, quantity + 1))}
                      disabled={quantity >= product.stock}
                      className="h-16 w-16 p-0 rounded-none hover:bg-gray-100 border-l flex items-center justify-center text-gray-600 hover:text-gray-900"
                    >
                      <Plus className="h-8 w-8" />
                    </Button>
                  </div>
                </div>

                <div className="display flex flex-col sm:flex-row gap-4">
                  <Button
                    className="flex-1 w-full"
                    style={{ 
                      backgroundColor: '#8c000f', 
                      color: '#fff',
                      opacity: isAddingToCart ? 0.6 : 1
                    }}
                    onClick={handleAddToCart}
                    disabled={isAddingToCart}
                  >
                    <ShoppingCart className="h-4 w-4 mr-2" />
                    {isAddingToCart ? 'Agregando...' : 'Agregar al Carrito'}
                  </Button>
                  
                  <Button
                    variant="outline"
                    className="w-full sm:w-auto"
                    onClick={handleWishlistToggle}
                    disabled={isTogglingWishlist}
                    style={{
                      borderColor: '#f83258',
                      color: isWishlisted ? '#8c000f' : '#f83258',
                      opacity: isTogglingWishlist ? 0.6 : 1
                    }}
                  >
                    <Heart
                      className="h-4 w-4"
                      style={{
                        fill: isWishlisted ? '#8c000f' : 'none',
                        color: isWishlisted ? '#8c000f' : '#f83258'
                      }}
                    />
                    {isTogglingWishlist 
                      ? '...' 
                      : isWishlisted 
                        ? 'En Deseados' 
                        : 'Agregar a Deseados'
                    }
                  </Button>
                </div>
              </div>
            )}

            {(!hasStock || !isActive) && (
              <div className="p-4 rounded-lg" style={{ backgroundColor: '#f6dae7' }}>
                <p style={{ color: '#8c000f' }}>
                  {!isActive ? 'Producto no disponible' : 'Producto sin stock'}
                </p>
                {/* Botón de wishlist aún disponible cuando no hay stock */}
                {!hasStock && isActive && (
                  <Button
                    variant="outline"
                    className="mt-3"
                    onClick={handleWishlistToggle}
                    disabled={isTogglingWishlist}
                    style={{
                      borderColor: '#f83258',
                      color: isWishlisted ? '#8c000f' : '#f83258',
                      opacity: isTogglingWishlist ? 0.6 : 1
                    }}
                  >
                    <Heart
                      className="h-4 w-4 mr-2"
                      style={{
                        fill: isWishlisted ? '#8c000f' : 'none',
                        color: isWishlisted ? '#8c000f' : '#f83258'
                      }}
                    />
                    {isTogglingWishlist 
                      ? 'Procesando...' 
                      : isWishlisted 
                        ? 'Eliminar de Deseados' 
                        : 'Agregar a Deseados'
                    }
                  </Button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Botón de volver */}
        <Button
          variant="ghost"
          onClick={() => navigate(-1)}
          className="mb-6 flex items-center gap-4 mt-8"
          style={{ color: '#8c000f' }}
        >
          <ArrowLeft className="h-4 w-4" />
          Volver
        </Button>

      </div>
    </div>
  );
}