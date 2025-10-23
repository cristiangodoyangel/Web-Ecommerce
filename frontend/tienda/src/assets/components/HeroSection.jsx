import { useState, useEffect } from "react";
import { Button } from './ui/button.jsx';
import { Badge } from './ui/badge.jsx';
import { ImageWithFallback } from './figma/ImageWithFallback';
import blkImge from '../img/banner/black.png';
import pnkImg from '../img/banner/pink.png';
import blImg from '../img/banner/blue.png';
import { Sparkles, ChevronLeft, ChevronRight, Pause, Play } from 'lucide-react';

const slides = [
  {
    badge: <span style={{ color: "var(--color-life-principal)" }}>
        "Nueva Colección 2025"
      </span>,
    title: (
      <>
        <span className="block" style={{ color: "var(--color-life-red)" }}>Descubre tu</span>
        <span className="block" style={{ color: "var(--color-life-sec)" }}>Fragancia Perfecta</span>
      </>
    ),
    description: (
      <span className="display" style={{ color: "var(--color-life-principal)" }}>
        Perfumes de lujo y fragancias exclusivas para cada ocasión especial
      </span>
    ),
    image: blkImge
  },
  {
    badge: <span style={{ color: "var(--color-life-principal)" }}>
        "Especial Parejas"
      </span>,
    title: (
      <>
        <span className="playfair-display" style={{ color: "var(--color-life-red)" }}>Aromas que</span>
        <span className="block" style={{ color: "var(--color-life-sec)" }}>Enamoran</span>
      </>
    ),
    description: (
      <span className="display" style={{ color: "var(--color-life-principal)" }}>
        Sets de perfumes para compartir. Encuentra la fragancia que os una como pareja
      </span>
    ),
    image: pnkImg
  },
  {
    badge: <span style={{ color: "var(--color-life-principal)" }}>
        "Envíos Premium"
      </span>,
    title: (
      <>
        <span className="block" style={{ color: "var(--color-life-red)" }}>Entrega</span>
        <span className="block" style={{ color: "var(--color-life-sec)" }}>Rápida y Segura</span>
      </>
    ),
    description: (
      <span className="display" style={{ color: "var(--color-life-principal)" }}>
        Envíos express en embalaje de lujo. Tu fragancia llegará en perfectas condiciones.
      </span>
    ),
    image: blImg
  }
];

export function HeroSection() {
  const [current, setCurrent] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);

  const nextSlide = () => setCurrent((current + 1) % slides.length);
  const prevSlide = () => setCurrent((current - 1 + slides.length) % slides.length);
  const goToSlide = (index) => setCurrent(index);

  // Auto-play funcionalidad
  useEffect(() => {
    if (!isAutoPlaying) return;

    const interval = setInterval(() => {
      nextSlide();
    }, 5000); 

    return () => clearInterval(interval);
  }, [current, isAutoPlaying]);

  // Pausar auto-play al hacer hover
  const handleMouseEnter = () => setIsAutoPlaying(false);
  const handleMouseLeave = () => setIsAutoPlaying(true);

  return (
    <section 
      className="relative overflow-hidden"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* Main hero carousel */}
      <div
        className="relative min-h-[400px] sm:min-h-[450px] md:min-h-[500px] lg:min-h-[550px] flex items-center py-6 sm:py-8 md:py-10 transition-all duration-500 ease-in-out"
        style={{
          background: 'var(--color-life-ter)'
        }}
      >
        <div className="container mx-auto px-4 sm:px-6 md:px-8 relative z-10">
          <div className="grid lg:grid-cols-2 gap-6 md:gap-8 items-center">
            {/* Content */}
            <div className="text-white space-y-3 sm:space-y-4 md:space-y-6 flex flex-col items-center lg:items-start text-center lg:text-left">
              <Badge className="bg-white/20 text-white border-0 px-3 py-1.5 sm:px-4 sm:py-2 flex items-center w-fit animate-fade-in text-xs sm:text-sm">
                <Sparkles className="h-3 w-3 sm:h-4 sm:w-4 mr-1.5 sm:mr-2" />
                {slides[current].badge}
              </Badge>
              
              <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold leading-tight animate-slide-up">
                {slides[current].title}
              </h1>
              
              <p className="text-base sm:text-lg md:text-xl lg:text-2xl text-white/90 max-w-lg animate-slide-up">
                {slides[current].description}
              </p>

              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 pt-2 sm:pt-4 pl-0 lg:pl-8 xl:pl-16 w-full sm:w-auto items-center lg:items-start">
                <Button
                  variant="outline"
                  size="lg"
                  className="display text-white bg-[var(--color-life-principal)] border-[var(--color-life-principal)] hover:bg-transparent hover:text-[var(--color-life-principal)] hover:border-[var(--color-life-principal)] px-4 sm:px-6 md:px-8 py-2 sm:py-2.5 md:py-3 text-sm sm:text-base md:text-lg transition-all duration-300 w-full sm:w-auto"
                  onClick={() => window.location.href = '/TodosProductos'}
                >
                  Explorar Productos
                </Button>
                <Button
                  variant="outline"
                  size="lg"
                  className="display text-white bg-[var(--color-life-principal)] border-white hover:bg-white hover:text-[var(--color-life-principal)] px-4 sm:px-6 md:px-8 py-2 sm:py-2.5 md:py-3 text-sm sm:text-base md:text-lg transition-all duration-300 w-full sm:w-auto"
                  onClick={() => window.location.href = '/TodasOfertas'}
                >
                  Ver Ofertas
                </Button>
              </div>
            </div>
            {/* Hero image */}
            <div className="hidden lg:block relative">
              <div className="relative">
                <ImageWithFallback
                  src={slides[current].image}
                  alt={`Slide ${current + 1}`}
                  className="w-full h-96 object-contain transition-all duration-500 ease-in-out"
                />
              </div>
            </div>
          </div>
        </div>
        {/* Auto-play indicator - oculto en móvil */}
        <div className="hidden sm:block absolute top-2 sm:top-4 md:top-6 right-2 sm:right-4 md:right-8 z-20">
          <Button
            variant="ghost"
            size="sm"
            className="text-white/70 hover:text-white text-xs flex items-center gap-1 sm:gap-2 px-2 sm:px-3"
            onClick={() => setIsAutoPlaying(!isAutoPlaying)}
          >
            {isAutoPlaying ? (
              <>
                <Pause className="h-3 w-3 sm:h-4 sm:w-4" style={{ color: '#f83258' }} />
                <span className="hidden md:inline">Pausar</span>
              </>
            ) : (
              <>
                <Play className="h-3 w-3 sm:h-4 sm:w-4" style={{ color: '#f83258' }} />
                <span className="hidden md:inline">Reproducir</span>
              </>
            )}
          </Button>
        </div>
      </div>
    </section>
  );
}