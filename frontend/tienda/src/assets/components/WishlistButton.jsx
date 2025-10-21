import { Heart } from 'lucide-react';
import './WishlistButton.css';

const WishlistButton = ({ 
  isWishlisted, 
  isToggling, 
  onClick, 
  disabled,
  isMobile = false 
}) => {
  return (
    <button
      className={`simple-heart-btn ${isWishlisted ? 'active' : ''} ${isMobile ? 'mobile' : 'desktop'}`}
      onClick={onClick}
      disabled={disabled || isToggling}
      type="button"
      aria-label={isWishlisted ? "Eliminar de favoritos" : "Agregar a favoritos"}
    >
      <Heart 
        className="simple-heart-icon"
        strokeWidth={2}
        fill={isWishlisted ? '#8c000f' : 'none'}
      />
    </button>
  );
};

export default WishlistButton;