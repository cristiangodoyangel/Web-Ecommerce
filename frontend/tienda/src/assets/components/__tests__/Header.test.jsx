import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import Header from '../Header';
import { CarritoProvider } from '../../context/CarritoContext';

// Mock de servicios
jest.mock('../../services/carritoService');
jest.mock('../../services/deseosService');

const HeaderWrapper = ({ children }) => (
  <BrowserRouter>
    <CarritoProvider>
      {children}
    </CarritoProvider>
  </BrowserRouter>
);

describe('Header', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
  });

  test('renderiza correctamente sin usuario autenticado', () => {
    render(
      <HeaderWrapper>
        <Header />
      </HeaderWrapper>
    );

    expect(screen.getByText('Iniciar Sesión')).toBeInTheDocument();
    expect(screen.getByText('Registrarse')).toBeInTheDocument();
  });

  test('renderiza correctamente con usuario autenticado', () => {
    // Simular usuario autenticado
    localStorage.setItem('access_token', 'fake-token');
    localStorage.setItem('username', 'testuser');

    render(
      <HeaderWrapper>
        <Header />
      </HeaderWrapper>
    );

    expect(screen.getByText('testuser')).toBeInTheDocument();
    expect(screen.queryByText('Iniciar Sesión')).not.toBeInTheDocument();
  });

  test('muestra menú de usuario al hacer clic', () => {
    localStorage.setItem('access_token', 'fake-token');
    localStorage.setItem('username', 'testuser');

    render(
      <HeaderWrapper>
        <Header />
      </HeaderWrapper>
    );

    const userButton = screen.getByText('testuser');
    fireEvent.click(userButton);

    expect(screen.getByText('Historial de Compras')).toBeInTheDocument();
    expect(screen.getByText('Lista de Deseados')).toBeInTheDocument();
    expect(screen.getByText('Cerrar Sesión')).toBeInTheDocument();
  });

  test('función de cerrar sesión', () => {
    localStorage.setItem('access_token', 'fake-token');
    localStorage.setItem('username', 'testuser');

    render(
      <HeaderWrapper>
        <Header />
      </HeaderWrapper>
    );

    // Abrir menú de usuario
    const userButton = screen.getByText('testuser');
    fireEvent.click(userButton);

    // Hacer clic en cerrar sesión
    const logoutButton = screen.getByText('Cerrar Sesión');
    fireEvent.click(logoutButton);

    // Verificar que se limpiaron los datos del localStorage
    expect(localStorage.removeItem).toHaveBeenCalledWith('access_token');
    expect(localStorage.removeItem).toHaveBeenCalledWith('refresh_token');
    expect(localStorage.removeItem).toHaveBeenCalledWith('username');
  });

  test('búsqueda de productos', () => {
    render(
      <HeaderWrapper>
        <Header />
      </HeaderWrapper>
    );

    const searchInput = screen.getByPlaceholderText(/busca productos/i);
    fireEvent.change(searchInput, { target: { value: 'perfume' } });
    fireEvent.keyPress(searchInput, { key: 'Enter', code: 'Enter' });

    // Verificar que se actualiza el estado de búsqueda
    expect(searchInput.value).toBe('perfume');
  });
});