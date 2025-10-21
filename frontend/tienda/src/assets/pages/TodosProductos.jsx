import React, { useState, useEffect } from 'react';
import { ArrowLeft, Filter, Grid3X3, List, Search } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card, CardContent } from '../components/ui/card';
import { Input } from '../components/ui/input';
import ProductCard from '../components/ProductCard';

const TodosProductos = () => {
  const [productos, setProductos] = useState([]);
  const [productosPorCategoria, setProductosPorCategoria] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sortBy, setSortBy] = useState('nombre');
  const [viewMode, setViewMode] = useState('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredProductos, setFilteredProductos] = useState({});

  useEffect(() => {
    const fetchProductos = async () => {
      setLoading(true);
      try {
        const response = await fetch('https://lifesexshop.cl/api/productos/');
        if (response.ok) {
          const data = await response.json();
          setProductos(data);
          
          // Organizar productos por sus categorías reales
          const productosAgrupados = {};
          
          data.forEach(producto => {
            let categoriasProducto = [];
            
            // Obtener categorías del producto
            if (producto.categorias && Array.isArray(producto.categorias)) {
              categoriasProducto = producto.categorias.map(cat => cat.nombre);
            } else if (producto.categoria) {
              categoriasProducto = [producto.categoria];
            } else {
              categoriasProducto = ['Sin Categoría'];
            }
            
            // Agregar el producto a cada una de sus categorías
            categoriasProducto.forEach(categoria => {
              if (!productosAgrupados[categoria]) {
                productosAgrupados[categoria] = [];
              }
              productosAgrupados[categoria].push(producto);
            });
          });
          
          // Ordenar las categorías alfabéticamente
          const categoriasOrdenadas = Object.keys(productosAgrupados).sort();
          const productosOrdenados = {};
          categoriasOrdenadas.forEach(categoria => {
            productosOrdenados[categoria] = productosAgrupados[categoria];
          });
          
          setProductosPorCategoria(productosOrdenados);
          setFilteredProductos(productosOrdenados);
        } else {
          setError('Error al cargar los productos');
        }
      } catch (error) {
        setError('Error de conexión al cargar los productos');
      } finally {
        setLoading(false);
      }
    };

    fetchProductos();
  }, []);

  // Filtrar productos por búsqueda
  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredProductos(productosPorCategoria);
    } else {
      const filtered = {};
      Object.keys(productosPorCategoria).forEach(categoria => {
        const productosCategoria = productosPorCategoria[categoria].filter(producto =>
          producto.nombre.toLowerCase().includes(searchQuery.toLowerCase()) ||
          producto.descripcion.toLowerCase().includes(searchQuery.toLowerCase())
        );
        if (productosCategoria.length > 0) {
          filtered[categoria] = productosCategoria;
        }
      });
      setFilteredProductos(filtered);
    }
  }, [searchQuery, productosPorCategoria]);

  // Ordenar productos
  const sortProducts = (products) => {
    return [...products].sort((a, b) => {
      switch (sortBy) {
        case 'precio_asc':
          return a.precio - b.precio;
        case 'precio_desc':
          return b.precio - a.precio;
        case 'nombre':
          return a.nombre.localeCompare(b.nombre);
        case 'stock':
          return b.stock - a.stock;
        default:
          return 0;
      }
    });
  };

  const handleBackClick = () => {
    window.history.back();
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP',
      minimumFractionDigits: 0,
    }).format(price);
  };

  const totalProductos = Object.values(filteredProductos).reduce(
    (total, productos) => total + productos.length, 0
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto mb-4"></div>
          <p className="text-gray-600 text-sm sm:text-base">Cargando todos los productos...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4">Error al cargar productos</h2>
          <p className="text-gray-600 mb-6 text-sm sm:text-base">{error}</p>
          <Button 
            onClick={() => window.location.href = '/'} 
            className="text-white px-6 sm:px-8 py-3 w-full sm:w-auto"
            style={{ backgroundColor: '#8c000f' }}
          >
            Volver al inicio
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="display max-w-7xl mx-auto px-4 py-8">
        {/* Botón Volver */}
        <Button
          variant="ghost"
          onClick={handleBackClick}
          className="mb-6 flex items-center gap-2"
          style={{ color: '#8c000f' }}
        >
          <ArrowLeft className="h-4 w-4" />
          Volver
        </Button>

        {/* Header de la página */}
        <div className="mb-8">
          <div className="flex flex-col gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold mb-2" style={{ color: '#8c000f' }}>
                Todos los Productos
              </h1>
              <p className="text-sm sm:text-base text-gray-600">
                {totalProductos === 0 
                  ? 'No hay productos disponibles' 
                  : `${totalProductos} ${totalProductos === 1 ? 'producto encontrado' : 'productos encontrados'}`
                }
              </p>
            </div>

            {/* Controles de vista y ordenamiento */}
            {totalProductos > 0 && (
              <div className="flex flex-col gap-3">
                {/* Selector de ordenamiento */}
                <div className="flex items-center gap-2">
                  <Filter className="h-4 w-4 flex-shrink-0" style={{ color: '#8c000f' }} />
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="flex-1 border rounded-lg px-3 py-2 text-sm"
                    style={{ borderColor: '#f83258' }}
                  >
                    <option value="nombre">Nombre A-Z</option>
                    <option value="precio_asc">Precio: Menor a Mayor</option>
                    <option value="precio_desc">Precio: Mayor a Menor</option>
                    <option value="stock">Stock Disponible</option>
                  </select>
                </div>

                {/* Selector de vista */}
                <div className="flex justify-center">
                  <div className="flex items-center border rounded-lg" style={{ borderColor: '#f83258' }}>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setViewMode('grid')}
                      className="px- py-2"
                      style={{
                        backgroundColor: viewMode === 'grid' ? '#f83258' : 'transparent',
                        color: viewMode === 'grid' ? 'white' : '#8c000f'
                      }}
                    >
                      <Grid3X3 className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setViewMode('list')}
                      className="px-4 py-2"
                      style={{
                        backgroundColor: viewMode === 'list' ? '#f83258' : 'transparent',
                        color: viewMode === 'list' ? 'white' : '#8c000f'
                      }}
                    >
                      <List className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Contenido de productos por categoría */}
        {totalProductos === 0 ? (
          <div className="text-center py-16">
            <div className="text-6xl mb-6">🛍️</div>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              {searchQuery ? `No se encontraron productos para "${searchQuery}"` : 'No hay productos disponibles'}
            </h2>
            <p className="text-gray-600 mb-8 max-w-md mx-auto">
              {searchQuery 
                ? 'Intenta con otros términos de búsqueda o explora nuestras categorías.' 
                : 'Pronto tendremos productos disponibles para ti.'
              }
            </p>
            {searchQuery && (
              <Button
                onClick={() => setSearchQuery('')}
                className="text-white px-8 py-3 mr-4"
                style={{ backgroundColor: '#f83258' }}
              >
                Limpiar Búsqueda
              </Button>
            )}
            <Button
              onClick={() => window.location.href = '/'}
              className="text-white px-8 py-3"
              style={{ backgroundColor: '#8c000f' }}
            >
              Volver al Inicio
            </Button>
          </div>
        ) : (
          <div className="space-y-12">
            {Object.keys(filteredProductos).map(categoria => {
              const productosCategoria = sortProducts(filteredProductos[categoria]);
              
              if (productosCategoria.length === 0) return null;

              return (
                <div key={categoria} className="space-y-6">
                  {/* Título de categoría */}
                  <div className="border-b-2 pb-4" style={{ borderColor: '#f83258' }}>
                    <h2 className="text-2xl font-bold flex items-center gap-3" style={{ color: '#8c000f' }}>
                      {categoria}
                      <span className="text-base font-normal text-gray-600">
                        ({productosCategoria.length} {productosCategoria.length === 1 ? 'producto' : 'productos'})
                      </span>
                    </h2>
                  </div>

                  {/* Productos de la categoría - Solo mejorar el responsive del grid */}
                  <div className={
                    viewMode === 'grid' 
                      ? 'grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6'
                      : 'space-y-5'
                  }>
                    {productosCategoria.map((producto) => (
                      viewMode === 'grid' ? (
                        // Wrapper para hacer ProductCard más ancho solo en esta página
                        <div key={producto.id} className="w-full max-w-md mx-auto">
                          <ProductCard product={producto} />
                        </div>
                      ) : (
                        <Card key={producto.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                          <CardContent className="p-0">
                            <div className="flex items-center gap-4 p-4">
                              <img
                                src={producto.imagen}
                                alt={producto.nombre}
                                className="w-24 h-24 object-cover rounded-lg cursor-pointer"
                                onClick={() => window.location.href = `/producto/${producto.id}`}
                                onError={(e) => {
                                  e.target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDIwMCAyMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIyMDAiIGhlaWdodD0iMjAwIiBmaWxsPSIjZjNmNGY2Ii8+CjxwYXRoIGQ9Ik0xMDAgMTUwQzEyOC44NjcgMTUwIDE1MCAxMjguODY3IDE1MCAxMDBDMTUwIDcxLjEzMyAxMjguODY3IDUwIDEwMCA1MEM3MS4xMzMgNTAgNTAgNzEuMTMzIDUwIDEwMEM1MCAxMjguODY3IDcxLjEzMyAxNTAgMTAwIDE1MFoiIGZpbGw9IiNlMWU1ZTkiLz4KPC9zdmc+';
                                }}
                              />
                              <div className="flex-1">
                                <h3 
                                  className="font-semibold text-lg mb-1 cursor-pointer hover:underline" 
                                  style={{ color: '#8c000f' }}
                                  onClick={() => window.location.href = `/producto/${producto.id}`}
                                >
                                  {producto.nombre}
                                </h3>
                                <p className="text-sm text-gray-600 mb-2 line-clamp-2">
                                  {producto.descripcion}
                                </p>
                                <div className="flex items-center justify-between">
                                  <span className="text-xl font-bold" style={{ color: '#8c000f' }}>
                                    {formatPrice(producto.precio)}
                                  </span>
                                  <div className="flex items-center gap-2">
                                    <span className={`text-xs ${producto.stock > 0 ? 'text-green-600' : 'text-red-600'}`}>
                                      {producto.stock > 0 ? `Stock: ${producto.stock}` : 'Sin stock'}
                                    </span>
                                    <Button
                                      onClick={() => window.location.href = `/producto/${producto.id}`}
                                      className="text-white px-4 py-2"
                                      style={{ backgroundColor: '#8c000f' }}
                                    >
                                      Ver Detalles
                                    </Button>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      )
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default TodosProductos;