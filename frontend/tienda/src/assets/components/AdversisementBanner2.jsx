import React, { useState } from 'react';

const AdvertisementBanner2 = ({ 
  imagePath = "/secreto.png", // Imagen desde public/
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

  return (
    <section className={`py-4 ${className}`}>
      <div className="relative overflow-hidden rounded-xl shadow-lg cursor-pointer group">
        {imageError ? (
          fallbackBanner()
        ) : (
          <>
            <img
              src={imagePath}
              alt={alt}
              className="w-full h-64 md:h-80 object-cover transition-transform duration-300 group-hover:scale-102"
              onClick={handleClick}
              onError={handleImageError}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-300" />

            
          </>
        )}
      </div>
    </section>
  );
};

export default AdvertisementBanner2;