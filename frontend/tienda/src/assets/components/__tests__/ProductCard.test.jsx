import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { CarritoProvider } from '../../context/CarritoContext';
import ProductCard from '../ProductCard';

// Mock del servicio
jest.mock('../../services/carritoService', () => ({
  carritoService: {
    agregar: jest.fn(),
  }
}));

const ProductCardWrapper = ({ children }) => (
  <BrowserRouter>
    <CarritoProvider>
      {children}
    </CarritoProvider>
  </BrowserRouter>
);

describe('ProductCard', () => {
  const mockProducto = {
    id: 1,
    nombre: 'Perfume Test',
    precio: 50000,
    imagen: '/test-image.jpg',
    stock: 10,
    activo: true,
    categorias: [{ id: 1, nombre: 'Perfumes' }]
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renderiza información del producto correctamente', () => {
    render(
      <ProductCardWrapper>
        <ProductCard producto={mockProducto} />
      </ProductCardWrapper>
    );

    expect(screen.getByText('Perfume Test')).toBeInTheDocument();
    expect(screen.getByText(/50\.000/)).toBeInTheDocument();
    expect(screen.getByText('Stock: 10')).toBeInTheDocument();
  });

  test('muestra mensaje de agotado cuando stock es 0', () => {
    const productoAgotado = { ...mockProducto, stock: 0 };
    
    render(
      <ProductCardWrapper>
        <ProductCard producto={productoAgotado} />
      </ProductCardWrapper>
    );

    expect(screen.getByText('Agotado')).toBeInTheDocument();
  });

  test('botón de agregar al carrito funciona', async () => {
    const { carritoService } = require('../../services/carritoService');
    carritoService.agregar.mockResolvedValue({ success: true });

    render(
      <ProductCardWrapper>
        <ProductCard producto={mockProducto} />
      </ProductCardWrapper>
    );

    const botonAgregar = screen.getByText('Agregar al Carrito');
    fireEvent.click(botonAgregar);

    await waitFor(() => {
      expect(carritoService.agregar).toHaveBeenCalledWith({
        producto: mockProducto.id,
        cantidad: 1
      });
    });
  });

  test('navegación a detalle del producto', () => {
    render(
      <ProductCardWrapper>
        <ProductCard producto={mockProducto} />
      </ProductCardWrapper>
    );

    const enlaceDetalle = screen.getByRole('link');
    expect(enlaceDetalle).toHaveAttribute('href', '/producto/1');
  });
});