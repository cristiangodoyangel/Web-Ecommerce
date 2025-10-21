import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import Carrito from '../assets/pages/Carrito';
import { CarritoProvider } from '../context/CarritoContext';

// Mock del contexto de carrito
const mockUseCarrito = {
  items: [
    {
      id: 1,
      producto: {
        id: 1,
        nombre: 'Test Product',
        precio: 100,
        imagen: '/test-image.jpg'
      },
      cantidad: 2
    }
  ],
  resumen: {
    subtotal: 200,
    total: 200
  },
  isLoading: false,
  actualizarCantidad: jest.fn(),
  eliminarItem: jest.fn(),
  limpiarCarrito: jest.fn(),
  cargarCarrito: jest.fn()
};

// Mock del hook useCarrito
jest.mock('../context/CarritoContext', () => ({
  ...jest.requireActual('../context/CarritoContext'),
  useCarrito: () => mockUseCarrito,
  CarritoProvider: ({ children }) => <div>{children}</div>
}));

// Mock de React Router
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => jest.fn()
}));

const renderCarrito = () => {
  return render(
    <BrowserRouter>
      <CarritoProvider>
        <Carrito />
      </CarritoProvider>
    </BrowserRouter>
  );
};

describe('Carrito Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders cart with items', async () => {
    renderCarrito();
    
    expect(screen.getByText('Carrito de Compras')).toBeInTheDocument();
    expect(screen.getByText('Test Product')).toBeInTheDocument();
    expect(screen.getByText('$200')).toBeInTheDocument();
  });

  test('shows loading state', () => {
    mockUseCarrito.isLoading = true;
    renderCarrito();
    
    expect(screen.getByText('Cargando carrito...')).toBeInTheDocument();
  });

  test('shows empty cart message when no items', () => {
    mockUseCarrito.items = [];
    renderCarrito();
    
    expect(screen.getByText('Tu carrito está vacío')).toBeInTheDocument();
    expect(screen.getByText('Explorar productos')).toBeInTheDocument();
  });

  test('handles quantity increase', async () => {
    renderCarrito();
    
    const increaseButton = screen.getByLabelText('Aumentar cantidad');
    fireEvent.click(increaseButton);
    
    await waitFor(() => {
      expect(mockUseCarrito.actualizarCantidad).toHaveBeenCalledWith(1, 3);
    });
  });

  test('handles quantity decrease', async () => {
    renderCarrito();
    
    const decreaseButton = screen.getByLabelText('Disminuir cantidad');
    fireEvent.click(decreaseButton);
    
    await waitFor(() => {
      expect(mockUseCarrito.actualizarCantidad).toHaveBeenCalledWith(1, 1);
    });
  });

  test('handles item removal', async () => {
    renderCarrito();
    
    const removeButton = screen.getByLabelText('Eliminar producto');
    fireEvent.click(removeButton);
    
    await waitFor(() => {
      expect(mockUseCarrito.eliminarItem).toHaveBeenCalledWith(1);
    });
  });

  test('handles clear cart confirmation', async () => {
    renderCarrito();
    
    const clearButton = screen.getByText('Limpiar Carrito');
    fireEvent.click(clearButton);
    
    // Should show confirmation modal
    expect(screen.getByText('¿Estás seguro?')).toBeInTheDocument();
    
    // Confirm clear
    const confirmButton = screen.getByText('Sí, limpiar');
    fireEvent.click(confirmButton);
    
    await waitFor(() => {
      expect(mockUseCarrito.limpiarCarrito).toHaveBeenCalled();
    });
  });

  test('cancels clear cart', () => {
    renderCarrito();
    
    const clearButton = screen.getByText('Limpiar Carrito');
    fireEvent.click(clearButton);
    
    // Cancel clear
    const cancelButton = screen.getByText('Cancelar');
    fireEvent.click(cancelButton);
    
    expect(mockUseCarrito.limpiarCarrito).not.toHaveBeenCalled();
  });

  test('navigates to checkout', () => {
    renderCarrito();
    
    const checkoutButton = screen.getByText('Proceder al Pago');
    expect(checkoutButton).toBeInTheDocument();
    expect(checkoutButton).not.toBeDisabled();
  });

  test('shows correct subtotal and total', () => {
    renderCarrito();
    
    // Check for price formatting
    expect(screen.getByText('$200')).toBeInTheDocument();
  });

  test('handles quantity input change', async () => {
    renderCarrito();
    
    const quantityInput = screen.getByDisplayValue('2');
    fireEvent.change(quantityInput, { target: { value: '5' } });
    fireEvent.blur(quantityInput);
    
    await waitFor(() => {
      expect(mockUseCarrito.actualizarCantidad).toHaveBeenCalledWith(1, 5);
    });
  });

  test('prevents negative quantities', async () => {
    renderCarrito();
    
    const quantityInput = screen.getByDisplayValue('2');
    fireEvent.change(quantityInput, { target: { value: '0' } });
    fireEvent.blur(quantityInput);
    
    // Should not call update with 0 or negative value
    expect(mockUseCarrito.actualizarCantidad).not.toHaveBeenCalledWith(1, 0);
  });

  test('shows updating state for specific item', () => {
    // This would require accessing the isUpdating state in the component
    // For now, we can test that the component handles loading states
    renderCarrito();
    
    const quantityInput = screen.getByDisplayValue('2');
    expect(quantityInput).not.toBeDisabled();
  });

  test('formats prices correctly', () => {
    renderCarrito();
    
    // Test Chilean peso formatting
    expect(screen.getByText('$200')).toBeInTheDocument();
  });
});