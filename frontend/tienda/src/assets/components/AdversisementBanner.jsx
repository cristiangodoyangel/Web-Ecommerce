import React, { useState } from 'react';

const AdvertisementBanner = ({ 
  imagePath = "/descuentos.png", // Imagen desde public/
  alt = "Ofertas y descuentos especiales",
  link = "/TodasOfertas",
  className = ""
}) => {
  const [imageError, setImageError] = useState(false);

  const handleClick = () => {
    if (link.startsWith('http')) {
      window.open(link, '_blank');
    } else {
      window.location.href = link;
    }
  };

  const handleImageError = () => {
    setImageError(true);
  };

  // Banner promocional elegante como fallback
  const fallbackBanner = () => (
    <div 
      className="w-mid h-64 md:h-80 flex items-center justify-center text-white cursor-pointer group"
      style={{
        background: 'linear-gradient(135deg, #c8d418ff 0%, #000000ff 100%)'
      }}
      onClick={handleClick}
    >
      <div className="text-center px-8 transform group-hover:scale-105 transition-transform duration-300">
        <div className="inline-block p-6 bg-white/20 backdrop-blur-sm rounded-full mb-6">
          <svg className="w-20 h-20" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
          </svg>
        </div>
        <h2 className="text-4xl md:text-6xl font-bold mb-4 bg-gradient-to-r from-white to-pink-200 bg-clip-text text-transparent">
          ¡OFERTAS ESPECIALES!
        </h2>
        <p className="text-xl md:text-2xl mb-8 opacity-90">
          Descuentos increíbles en productos seleccionados
        </p>
        <div className="inline-flex items-center justify-center px-8 py-4 bg-white text-red-600 rounded-xl font-bold text-lg hover:bg-pink-50 transition-all duration-300 shadow-lg hover:shadow-xl">
          <span className="mr-2">🔥</span>
          Ver Todas las Ofertas
          <span className="ml-2">→</span>
        </div>
      </div>
    </div>
  );

  return (
    <section className={`py-8 ${className}`}>
      <div className="relative overflow-hidden rounded-xl shadow-lg cursor-pointer group">
        {imageError ? (
          fallbackBanner()
        ) : (
          <>
            <img
              src={imagePath}
              alt={alt}
              className="w-full h-64 md:h-80 object-cover transition-transform duration-300 group-hover:scale-105"
              onClick={handleClick}
              onError={handleImageError}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-300" />

            <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-all duration-300">
              <div className="bg-white/95 backdrop-blur-sm px-6 py-3 rounded-full shadow-lg" onClick={handleClick}>
                <span className="text-red-600 font-bold text-lg">🔥 Ver Ofertas Especiales →</span>
              </div>
            </div>
          </>
        )}
      </div>
    </section>
  );
};

export default AdvertisementBanner;