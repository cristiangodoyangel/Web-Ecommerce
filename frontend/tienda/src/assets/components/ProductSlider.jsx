import React, { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from './ui/button.jsx';
import ProductCard from './ProductCard.jsx';

const ProductSlider = ({ products, title, maxVisible = 4, maxTotal = 8 }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  
  // Limitar los productos al máximo total
  const limitedProducts = products.slice(0, maxTotal);
  
  // Calcular cuántos slides podemos mostrar
  const totalSlides = Math.ceil(limitedProducts.length / maxVisible);
  
  const nextSlide = () => {
    if (currentIndex < totalSlides - 1) {
      setCurrentIndex(currentIndex + 1);
    }
  };
  
  const prevSlide = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  if (limitedProducts.length === 0) {
    return (
      <section className="py-8">
        <h2 className="text-2xl font-semibold text-center mb-6" style={{ color: '#f83258' }}>
          {title}
        </h2>
        <div className="text-center py-8" style={{ color: '#8c000f' }}>
          No hay productos disponibles.
        </div>
      </section>
    );
  }

  // Calcular el ancho de cada card basado en maxVisible
  const cardWidth = `calc(${100 / maxVisible}% - ${(maxVisible - 1) * 1.5 / maxVisible}rem)`;

  return (
    <section className="py-8">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-semibold" style={{ color: '#f83258' }}>
          {title}
        </h2>
        
        {totalSlides > 1 && (
          <div className="flex gap-2 hidden sm:flex">
            <Button
              variant="outline"
              size="sm"
              onClick={prevSlide}
              disabled={currentIndex === 0}
              className="p-2 hover:bg-pink-50 transition-colors"
              style={{
                borderColor: currentIndex === 0 ? '#ccc' : '#f83258',
                color: currentIndex === 0 ? '#ccc' : '#f83258'
              }}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={nextSlide}
              disabled={currentIndex === totalSlides - 1}
              className="p-2 hover:bg-pink-50 transition-colors"
              style={{
                borderColor: currentIndex === totalSlides - 1 ? '#ccc' : '#f83258',
                color: currentIndex === totalSlides - 1 ? '#ccc' : '#f83258'
              }}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>

      <div className="relative overflow-hidden mobile-slider-container">
        <div 
          className="flex transition-transform duration-500 ease-in-out mobile-slider-content"
          style={{
            transform: `translateX(-${currentIndex * 100}%)`,
            gap: '1.5rem'
          }}
        >
          {limitedProducts.map((product, index) => (
            <div 
              key={product.id}
              className="flex-shrink-0 mobile-product-item"
              style={{
                width: cardWidth,
                maxWidth: '280px'
              }}
            >
              <ProductCard product={product} />
            </div>
          ))}
        </div>
      </div>

      {totalSlides > 1 && (
        <div className="flex justify-center mt-6 gap-2 hidden sm:flex">
          {Array.from({ length: totalSlides }).map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentIndex(index)}
              className={`w-3 h-3 rounded-full transition-all duration-300 hover:scale-110 ${
                index === currentIndex 
                  ? 'bg-red-500 scale-110' 
                  : 'bg-gray-300 hover:bg-gray-400'
              }`}
              style={{
                backgroundColor: index === currentIndex ? '#f83258' : '#d1d5db'
              }}
              aria-label={`Ir a la página ${index + 1}`}
            />
          ))}
        </div>
      )}
    </section>
  );
};

export default ProductSlider;