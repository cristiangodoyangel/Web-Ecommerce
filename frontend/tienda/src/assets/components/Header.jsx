import { useState, useEffect, useRef } from 'react';
import { Search, ShoppingBag, Menu, X, User, Heart, Home } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Badge } from './ui/badge';
import logo from '../img/logo.png';
import { useCarrito } from '../../context/CarritoContext';
import { useDeseos } from '../../context/DeseosContext';
import API_BASE_URL from '../../config';

// Categorías con slugs simplificados
const categories = [
  { name: 'Para Ella', slug: 'ella' },
  { name: 'Para Él', slug: 'el' },
  { name: 'Parejas', slug: 'parejas' },
  { name: 'Cosmética Erótica', slug: 'cosmetica' },
  { name: 'Lencería', slug: 'lenceria' },
  { name: 'Accesorios', slug: 'accesorios' },
  { name: 'Línea Premium', slug: 'linea-premium' }
];

export function Header({ onSearchResults }) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [userName, setUserName] = useState('');
  const [isSubMenuOpen, setIsSubMenuOpen] = useState(false);
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showSearchResults, setShowSearchResults] = useState(false);

  const { resumen: carritoResumen } = useCarrito();
  const { resumen: deseosResumen } = useDeseos();
  
  const subMenuRef = useRef(null);
  const searchRef = useRef(null);
  const searchTimeout = useRef(null);

  // Función para verificar si el token está expirado
  const isTokenExpired = (token) => {
    if (!token) return true;
    
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const currentTime = Date.now() / 1000;
      return payload.exp < currentTime;
    } catch (error) {
      return true;
    }
  };

  // Función para validar y limpiar token expirado
  const validateToken = () => {
    const token = localStorage.getItem('access_token');
    if (token && isTokenExpired(token)) {
      // Token expirado, limpiar almacenamiento
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      setUserName('');
      return null;
    }
    return token;
  };

  // Función para obtener datos del usuario
  const fetchUserData = async (userId, token) => {
    try {
      const response = await fetch(`${API_BASE_URL}/usuarios/${userId}/`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const userData = await response.json();
        const displayName = userData.username || 
                           userData.first_name || 
                           (userData.first_name && userData.last_name ? `${userData.first_name} ${userData.last_name}` : null) ||
                           `Usuario ${userId}`;
        setUserName(displayName);
      } else if (response.status === 401) {
        // Token expirado o inválido
        validateToken();
      } else {
                setUserName(`Usuario ${userId}`);
      }
    } catch (error) {
            setUserName(`Usuario ${userId}`);
    }
  };

  // Función para buscar productos en el backend
  const searchProducts = async (query) => {
    if (!query.trim()) {
      setSearchResults([]);
      setShowSearchResults(false);
      return;
    }

    setIsSearching(true);
    try {
      // Buscar usando el parámetro search del backend con Django Filter
      const response = await fetch(
  `${API_BASE_URL}/productos/?search=${encodeURIComponent(query)}`,
        {
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );
      
      if (response.ok) {
        const products = await response.json();
        setSearchResults(products.slice(0, 8)); // Limitar a 8 resultados para el dropdown
        setShowSearchResults(true);
        
        // Si hay una función callback para manejar resultados completos
        if (onSearchResults) {
          onSearchResults(products, query);
        }
      } else {
                setSearchResults([]);
        setShowSearchResults(true);
      }
    } catch (error) {
            setSearchResults([]);
      setShowSearchResults(true);
    } finally {
      setIsSearching(false);
    }
  };

  // Debounce para la búsqueda
  const handleSearchChange = (e) => {
    const query = e.target.value;
    setSearchQuery(query);

    // Limpiar timeout anterior
    if (searchTimeout.current) {
      clearTimeout(searchTimeout.current);
    }

    // Establecer nuevo timeout
    searchTimeout.current = setTimeout(() => {
      searchProducts(query);
    }, 300); // Esperar 300ms después de que el usuario deje de escribir
  };

  // Manejar envío del formulario de búsqueda
  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      searchProducts(searchQuery);
      setShowSearchResults(false);
      // Aquí podrías redirigir a una página de resultados
      // window.location.href = `/buscar?q=${encodeURIComponent(searchQuery)}`;
    }
  };

  // Manejar clic en un resultado de búsqueda
  const handleSearchResultClick = (product) => {
    setShowSearchResults(false);
    setSearchQuery('');
    // Navegar al producto específico
    window.location.href = `/producto/${product.id}`;
  };

  // Verificar si el usuario está logueado
  useEffect(() => {
    const token = validateToken(); // Usar la función de validación
    
    if (token) {
      try {
        const decodedToken = JSON.parse(atob(token.split('.')[1]));
        
        if (decodedToken.username) {
          setUserName(decodedToken.username);
        } else if (decodedToken.user_id) {
          fetchUserData(decodedToken.user_id, token);
        } else {
                  }
        
      } catch (error) {
                validateToken(); // Limpiar si hay error en la decodificación
      }
    }
  }, []);

  // Verificar token periódicamente
  useEffect(() => {
    const interval = setInterval(() => {
      const token = validateToken();
      if (!token && userName) {
        // Token expiró, limpiar estado del usuario
        setUserName('');
      }
    }, 30000); // Verificar cada 30 segundos

    return () => clearInterval(interval);
  }, [userName]);

  // Cerrar submenú al hacer click afuera
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (subMenuRef.current && !subMenuRef.current.contains(event.target)) {
        setIsSubMenuOpen(false);
      }
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setShowSearchResults(false);
      }
    };

    if (isSubMenuOpen || showSearchResults) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isSubMenuOpen, showSearchResults]);

  // Limpiar timeout al desmontar
  useEffect(() => {
    return () => {
      if (searchTimeout.current) {
        clearTimeout(searchTimeout.current);
      }
    };
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    setUserName('');
    window.location.href = '/login';
  };

  const toggleSubMenu = () => {
    setIsSubMenuOpen(!isSubMenuOpen);
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP',
      minimumFractionDigits: 0,
    }).format(price);
  };

  // Función para manejar clic en logo (ir a inicio)
  const handleLogoClick = () => {
    window.location.href = '/';
  };

  return (
    <header className="sticky top-0 z-50 bg-white border-b shadow">
      {/* Barra de anuncio superior */}
      <div className="display py-2 px-4 text-center text-white" style={{ background: 'linear-gradient(to right, #8c000f, #f83258)' }}>
        <p> Envío gratis en compras sobre $50.000 </p>
      </div>

      {/* Header principal */}
      <div className="max-w-7xl mx-auto px-2 sm:px-4">
        <div className="flex items-center justify-between h-14 sm:h-16 gap-2 sm:gap-4">
          {/* Logo */}
          <div className="flex items-center flex-shrink-0 pl-0 sm:pl-8">
            <img 
              src={logo} 
              alt="Logo Life" 
              className="h-12 sm:h-16 w-auto object-contain cursor-pointer" 
              onClick={handleLogoClick}
            />
          </div>

          {/* Barra de búsqueda */}
          <div className="hidden md:flex flex-1 max-w-2xl mx-8" ref={searchRef}>
            <form onSubmit={handleSearchSubmit} className="relative w-full">
              <Search className="display absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4" style={{ color: '#f6dae7' }} />
              <Input
                type="search"
                placeholder="Busca productos, categorías..."
                value={searchQuery}
                onChange={handleSearchChange}
                className="display pl-10 pr-4 h-12 border-2 rounded-full"
                style={{
                  borderColor: '#f83258',
                  backgroundColor: '#fff',
                  color: '#8c000f'
                }}
              />
              
              {/* Dropdown de resultados de búsqueda */}
              {showSearchResults && (
                <div className="display absolute top-full left-0 right-0 mt-2 bg-white border rounded-md shadow-lg z-50 max-h-96 overflow-y-auto">
                  {isSearching ? (
                    <div className="display p-4 text-center" style={{ color: '#8c000f' }}>
                      Buscando productos...
                    </div>
                  ) : searchResults.length > 0 ? (
                    <>
                      {searchResults.map((product) => (
                        <div
                          key={product.id}
                          className="flex items-center p-3 hover:bg-gray-50 cursor-pointer border-b last:border-b-0"
                          onClick={() => handleSearchResultClick(product)}
                        >
                          <img
                            src={product.imagen}
                            alt={product.nombre}
                            className="w-12 h-12 object-cover rounded mr-3"
                            onError={(e) => {
                              e.target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDgiIGhlaWdodD0iNDgiIHZpZXdCb3g9IjAgMCA0OCA0OCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjQ4IiBoZWlnaHQ9IjQ4IiBmaWxsPSIjZjNmNGY2Ii8+CjxwYXRoIGQ9Ik0yNCAzNkMzMC42Mjc0IDM2IDM2IDMwLjYyNzQgMzYgMjRDMzYgMTcuMzcyNiAzMC42Mjc0IDEyIDI0IDEyQzE3LjM3MjYgMTIgMTIgMTcuMzcyNiAxMiAyNEMxMiAzMC42Mjc0IDE3LjM3MjYgMzYgMjQgMzZaIiBmaWxsPSIjZTFlNWU5Ii8+Cjwvc3ZnPgo=';
                            }}
                          />
                          <div className="flex-1">
                            <h4 className="font-medium text-sm" style={{ color: '#8c000f' }}>
                              {product.nombre}
                            </h4>
                            <p className="text-xs" style={{ color: '#fabb47ff' }}>
                              {product.categoria}
                            </p>
                            <p className="text-sm font-semibold" style={{ color: '#8c000f' }}>
                              {formatPrice(product.precio)}
                            </p>
                          </div>
                        </div>
                      ))}
                      <div className="p-3 border-t bg-gray-50">
                        <button
                          type="submit"
                          className="display w-full text-center text-sm font-medium"
                          style={{ color: '#fabb47ff' }}
                        >
                          Ver todos los resultados para "{searchQuery}"
                        </button>
                      </div>
                    </>
                  ) : (
                    <div className="display p-4 text-center" style={{ color: '#8c000f' }}>
                      No se encontraron productos para "{searchQuery}"
                    </div>
                  )}
                </div>
              )}
            </form>
          </div>

          {/* Acciones */}
          <div className="flex items-center gap-2">
            {/* Cuenta de usuario */}
            {userName ? (
              <div className="relative" ref={subMenuRef}>
                <Button
                  variant="ghost"
                  size="sm"
                  className="display hidden md:flex items-center gap-2"
                  style={{ color: '#8c000f' }}
                  onClick={toggleSubMenu}
                >
                  <User className="h-4 w-4" />
                  <span className="hidden lg:inline">{userName}</span>
                </Button>

                {/* Submenú */}
                {isSubMenuOpen && (
                  <div className="display absolute top-full right-0 mt-2 w-48 bg-white border rounded-md shadow-lg z-50">
                    <div className="py-1">
                      <Button 
                        variant="ghost" 
                        className="w-full text-left px-4 py-2 hover:bg-gray-100" 
                        style={{ color: '#8c000f' }}
                        onClick={() => window.location.href = '/historial-compras'}
                      >
                        Historial de Compras
                      </Button>
                      <Button 
                        variant="ghost" 
                        className="w-full text-left px-4 py-2 hover:bg-gray-100" 
                        style={{ color: '#fabb47ff' }}
                        onClick={() => window.location.href = '/deseados'}
                      >
                        Lista de Deseados
                      </Button>
                      <Button 
                        variant="ghost" 
                        className="w-full text-left px-4 py-2 hover:bg-gray-100" 
                        style={{ color: '#fabb47ff' }}
                        onClick={() => window.location.href = '/carrito'}
                      >
                        Carrito de Compra
                      </Button>
                      <Button
                        variant="ghost"
                        className="w-full text-left px-4 py-2 hover:bg-gray-100"
                        style={{ color: '#000000ff' }}
                        onClick={handleLogout}
                      >
                        Cerrar Sesión
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <Button
                variant="ghost"
                size="sm"
                className="display hidden md:flex items-center gap-2"
                style={{ color: '#8c000f' }}
                onClick={() => window.location.href = '/login'}
              >
                <User className="h-4 w-4" />
                <span className="hidden lg:inline">Iniciar Sesión</span>
              </Button>
            )}

            {/* Lista de deseos - ACTUALIZADA */}
            <Button 
              variant="ghost" 
              size="sm" 
              className="relative p-1 sm:p-2"
              onClick={() => window.location.href = '/deseados'}
            >
              <Heart className="h-5 w-5 sm:h-5 sm:w-5" style={{ color: '#f83258' }} />
              {deseosResumen?.total_items > 0 && (
                <Badge
                  variant="secondary"
                  className="display absolute -top-1 -right-1 h-4 w-4 sm:h-5 sm:w-5 flex items-center justify-center p-0 text-white text-[10px] sm:text-xs"
                  style={{ backgroundColor: '#f83258' }}
                >
                  {deseosResumen.total_items}
                </Badge>
              )}
            </Button>

            {/* Carrito de compras - ACTUALIZADO */}
            <Button 
              variant="ghost" 
              size="sm" 
              className="relative p-1 sm:p-2"
              onClick={() => window.location.href = '/carrito'}
            >
              <ShoppingBag className="h-5 w-5 sm:h-5 sm:w-5" style={{ color: '#8c000f' }} />
              {carritoResumen?.total_items > 0 && (
                <Badge
                  variant="secondary"
                  className="display absolute -top-1 -right-1 h-4 w-4 sm:h-5 sm:w-5 flex items-center justify-center p-0 text-white text-[10px] sm:text-xs"
                  style={{ backgroundColor: '#8c000f' }}
                >
                  {carritoResumen.total_items}
                </Badge>
              )}
            </Button>

            {/* Menú móvil */}
            <Button
              variant="ghost"
              size="sm"
              className="md:hidden p-1 sm:p-2"
              style={{ color: '#8c000f' }}
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              {isMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </div>
        </div>

        {/* Búsqueda en móvil - OCULTA */}
        <div className="hidden">
          <form onSubmit={handleSearchSubmit} className="relative">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4"
              style={{ color: '#f6dae7' }}
            />
            <Input
              type="search"
              placeholder="Busca productos..."
              value={searchQuery}
              onChange={handleSearchChange}
              className="pl-10 pr-4 h-10 border-2 rounded-full"
              style={{
                borderColor: '#f83258',
                backgroundColor: '#fff',
                color: '#8c000f'
              }}
            />
          </form>
        </div>

        {/* Navegación de escritorio */}
        <nav className="hidden md:block border-t" style={{ borderColor: '#f6dae7' }}>
          <div className="display flex items-center gap-8 py-3">
            {/* Botón HOME a la izquierda */}
            <Button
              variant="ghost"
              className="flex items-center gap-2 transition-colors ml-8"
              style={{ color: '#8c000f' }}
              onMouseOver={e => {
                e.currentTarget.style.color = '#f83258';
                e.currentTarget.style.backgroundColor = '#f6dae7';
              }}
              onMouseOut={e => {
                e.currentTarget.style.color = '#8c000f';
                e.currentTarget.style.backgroundColor = 'transparent';
              }}
              onClick={handleLogoClick}
            >
              <Home className="h-4 w-4" />
              Inicio
            </Button>
            
            {/* Categorías centradas - Ocultas en móvil, visibles en desktop */}
            <div className="hidden lg:flex items-center justify-center gap-4 xl:gap-6 flex-1 overflow-x-auto">
              {categories.map((category) => (
                <Button
                  key={category.slug}
                  variant="ghost"
                  className="transition-colors whitespace-nowrap text-sm xl:text-base px-2 xl:px-3"
                  style={{ color: '#8c000f' }}
                  onMouseOver={e => {
                    e.currentTarget.style.color = '#f83258';
                    e.currentTarget.style.backgroundColor = '#f6dae7';
                  }}
                  onMouseOut={e => {
                    e.currentTarget.style.color = '#8c000f';
                    e.currentTarget.style.backgroundColor = 'transparent';
                  }}
                  onClick={() => window.location.href = `/categoria/${category.slug}`}
                >
                  {category.name}
                </Button>
              ))}
            </div>
          </div>
        </nav>
      </div>

      {/* Navegación móvil */}
      {isMenuOpen && (
        <nav className="md:hidden border-t py-4" style={{ borderColor: '#f6dae7' }}>
          <div className="display flex flex-col gap-2 px-4">
            {/* Botón HOME en móvil */}
            <Button
              variant="ghost"
              className="justify-start"
              style={{ color: '#8c000f' }}
              onClick={handleLogoClick}
            >
              <Home className="h-4 w-4 mr-2" />
              Inicio
            </Button>
            <Button
              variant="ghost"
              className="justify-start"
              style={{ color: '#8c000f' }}
              onClick={() => window.location.href = '/login'}
            >
              <User className="h-4 w-4 mr-2" />
              Mi Cuenta
            </Button>
            {categories.map((category) => (
              <Button
                key={category.slug}
                variant="ghost"
                className="justify-start"
                style={{ color: '#8c000f' }}
                onMouseOver={e => {
                  e.currentTarget.style.color = '#f83258';
                  e.currentTarget.style.backgroundColor = '#f6dae7';
                }}
                onMouseOut={e => {
                  e.currentTarget.style.color = '#8c000f';
                  e.currentTarget.style.backgroundColor = 'transparent';
                }}
                onClick={() => window.location.href = `/categoria/${category.slug}`}
              >
                {category.name}
              </Button>
            ))}
          </div>
        </nav>
      )}
    </header>
  );
}