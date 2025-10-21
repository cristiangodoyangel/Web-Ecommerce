import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import EstadoPago from '../assets/pages/EstadoPago';

// Mock del servicio de MercadoPago
const mockMercadoPagoService = {
  verificarPago: jest.fn()
};

jest.mock('../services/mercadoPagoService', () => ({
  mercadoPagoService: mockMercadoPagoService
}));

// Mock de react-router-dom
const mockNavigate = jest.fn();
const mockSearchParams = new URLSearchParams();

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useSearchParams: () => [mockSearchParams],
  useNavigate: () => mockNavigate
}));

const renderEstadoPago = (searchParams = {}) => {
  // Set up search params
  mockSearchParams.clear();
  Object.entries(searchParams).forEach(([key, value]) => {
    mockSearchParams.set(key, value);
  });

  return render(
    <BrowserRouter>
      <EstadoPago />
    </BrowserRouter>
  );
};

describe('EstadoPago Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockSearchParams.clear();
  });

  test('shows verification state initially', () => {
    renderEstadoPago();
    
    expect(screen.getByText('Verificando pago...')).toBeInTheDocument();
    expect(screen.getByText('Estamos verificando el estado de tu pago')).toBeInTheDocument();
  });

  test('shows successful payment state', async () => {
    const mockPagoData = {
      success: true,
      status: 'approved',
      id: '12345',
      transaction_amount: 25000,
      payment_method_id: 'visa',
      external_reference: 'order_123'
    };

    mockMercadoPagoService.verificarPago.mockResolvedValue(mockPagoData);

    renderEstadoPago({
      payment_id: '12345',
      status: 'approved',
      collection_status: 'approved'
    });

    await waitFor(() => {
      expect(screen.getByText('¡Pago exitoso!')).toBeInTheDocument();
      expect(screen.getByText('Tu pago ha sido procesado correctamente')).toBeInTheDocument();
    });

    expect(mockMercadoPagoService.verificarPago).toHaveBeenCalledWith('12345');
  });

  test('shows rejected payment state', async () => {
    const mockPagoData = {
      success: true,
      status: 'rejected',
      id: '12345',
      status_detail: 'cc_rejected_insufficient_amount'
    };

    mockMercadoPagoService.verificarPago.mockResolvedValue(mockPagoData);

    renderEstadoPago({
      payment_id: '12345',
      status: 'rejected',
      collection_status: 'rejected'
    });

    await waitFor(() => {
      expect(screen.getByText('Pago rechazado')).toBeInTheDocument();
      expect(screen.getByText('Tu pago no pudo ser procesado')).toBeInTheDocument();
    });
  });

  test('shows pending payment state', async () => {
    const mockPagoData = {
      success: true,
      status: 'pending',
      id: '12345',
      status_detail: 'pending_waiting_payment'
    };

    mockMercadoPagoService.verificarPago.mockResolvedValue(mockPagoData);

    renderEstadoPago({
      payment_id: '12345',
      status: 'pending',
      collection_status: 'pending'
    });

    await waitFor(() => {
      expect(screen.getByText('Pago pendiente')).toBeInTheDocument();
      expect(screen.getByText('Tu pago está siendo procesado')).toBeInTheDocument();
    });
  });

  test('handles payment verification error', async () => {
    mockMercadoPagoService.verificarPago.mockResolvedValue({
      success: false,
      error: 'Payment not found'
    });

    renderEstadoPago({
      payment_id: '12345'
    });

    await waitFor(() => {
      expect(screen.getByText('Error en la verificación')).toBeInTheDocument();
      expect(screen.getByText('Payment not found')).toBeInTheDocument();
    });
  });

  test('handles network error during verification', async () => {
    mockMercadoPagoService.verificarPago.mockRejectedValue(
      new Error('Network error')
    );

    renderEstadoPago({
      payment_id: '12345'
    });

    await waitFor(() => {
      expect(screen.getByText('Error en la verificación')).toBeInTheDocument();
      expect(screen.getByText('Error de conexión al verificar el pago')).toBeInTheDocument();
    });
  });

  test('handles missing payment_id', async () => {
    renderEstadoPago({
      status: 'approved'
    });

    await waitFor(() => {
      expect(screen.getByText('Error en la verificación')).toBeInTheDocument();
      expect(screen.getByText('No se encontraron datos de pago válidos')).toBeInTheDocument();
    });
  });

  test('navigates to home when successful', async () => {
    const mockPagoData = {
      success: true,
      status: 'approved',
      id: '12345'
    };

    mockMercadoPagoService.verificarPago.mockResolvedValue(mockPagoData);

    renderEstadoPago({
      payment_id: '12345',
      status: 'approved'
    });

    await waitFor(() => {
      expect(screen.getByText('Ir al inicio')).toBeInTheDocument();
    });

    const homeButton = screen.getByText('Ir al inicio');
    fireEvent.click(homeButton);

    expect(mockNavigate).toHaveBeenCalledWith('/');
  });

  test('navigates to orders when successful', async () => {
    const mockPagoData = {
      success: true,
      status: 'approved',
      id: '12345'
    };

    mockMercadoPagoService.verificarPago.mockResolvedValue(mockPagoData);

    renderEstadoPago({
      payment_id: '12345',
      status: 'approved'
    });

    await waitFor(() => {
      expect(screen.getByText('Ver mis pedidos')).toBeInTheDocument();
    });

    const ordersButton = screen.getByText('Ver mis pedidos');
    fireEvent.click(ordersButton);

    expect(mockNavigate).toHaveBeenCalledWith('/historial-ordenes');
  });

  test('navigates to cart when payment fails', async () => {
    const mockPagoData = {
      success: true,
      status: 'rejected',
      id: '12345'
    };

    mockMercadoPagoService.verificarPago.mockResolvedValue(mockPagoData);

    renderEstadoPago({
      payment_id: '12345',
      status: 'rejected'
    });

    await waitFor(() => {
      expect(screen.getByText('Volver al carrito')).toBeInTheDocument();
    });

    const cartButton = screen.getByText('Volver al carrito');
    fireEvent.click(cartButton);

    expect(mockNavigate).toHaveBeenCalledWith('/carrito');
  });

  test('handles retry payment', async () => {
    const mockPagoData = {
      success: true,
      status: 'rejected',
      id: '12345'
    };

    mockMercadoPagoService.verificarPago.mockResolvedValue(mockPagoData);

    renderEstadoPago({
      payment_id: '12345',
      status: 'rejected'
    });

    await waitFor(() => {
      expect(screen.getByText('Intentar nuevamente')).toBeInTheDocument();
    });

    const retryButton = screen.getByText('Intentar nuevamente');
    fireEvent.click(retryButton);

    expect(mockNavigate).toHaveBeenCalledWith('/carrito');
  });

  test('shows payment details when available', async () => {
    const mockPagoData = {
      success: true,
      status: 'approved',
      id: '12345',
      transaction_amount: 25000,
      payment_method_id: 'visa',
      external_reference: 'order_123',
      date_approved: '2023-01-01T12:00:00Z'
    };

    mockMercadoPagoService.verificarPago.mockResolvedValue(mockPagoData);

    renderEstadoPago({
      payment_id: '12345',
      status: 'approved'
    });

    await waitFor(() => {
      expect(screen.getByText('Detalles del pago')).toBeInTheDocument();
      expect(screen.getByText('ID de transacción:')).toBeInTheDocument();
      expect(screen.getByText('12345')).toBeInTheDocument();
      expect(screen.getByText('Método de pago:')).toBeInTheDocument();
      expect(screen.getByText('visa')).toBeInTheDocument();
    });
  });

  test('formats payment amount correctly', async () => {
    const mockPagoData = {
      success: true,
      status: 'approved',
      id: '12345',
      transaction_amount: 25000,
      currency_id: 'CLP'
    };

    mockMercadoPagoService.verificarPago.mockResolvedValue(mockPagoData);

    renderEstadoPago({
      payment_id: '12345',
      status: 'approved'
    });

    await waitFor(() => {
      expect(screen.getByText('Monto:')).toBeInTheDocument();
      expect(screen.getByText('$25.000')).toBeInTheDocument();
    });
  });

  test('handles unknown payment status', async () => {
    const mockPagoData = {
      success: true,
      status: 'in_process',
      id: '12345'
    };

    mockMercadoPagoService.verificarPago.mockResolvedValue(mockPagoData);

    renderEstadoPago({
      payment_id: '12345',
      status: 'in_process'
    });

    await waitFor(() => {
      expect(screen.getByText('Estado desconocido')).toBeInTheDocument();
      expect(screen.getByText('No pudimos determinar el estado de tu pago')).toBeInTheDocument();
    });
  });

  test('shows appropriate icons for each state', async () => {
    // Test successful state icon
    const mockPagoData = {
      success: true,
      status: 'approved',
      id: '12345'
    };

    mockMercadoPagoService.verificarPago.mockResolvedValue(mockPagoData);

    renderEstadoPago({
      payment_id: '12345',
      status: 'approved'
    });

    await waitFor(() => {
      // Check for success icon (Check component)
      expect(screen.getByTestId('check-icon')).toBeInTheDocument();
    });
  });

  test('handles contact support action', async () => {
    const mockPagoData = {
      success: true,
      status: 'rejected',
      id: '12345'
    };

    mockMercadoPagoService.verificarPago.mockResolvedValue(mockPagoData);

    renderEstadoPago({
      payment_id: '12345',
      status: 'rejected'
    });

    await waitFor(() => {
      expect(screen.getByText('Contactar soporte')).toBeInTheDocument();
    });

    const supportButton = screen.getByText('Contactar soporte');
    fireEvent.click(supportButton);

    // Should navigate to support or open email client
    expect(mockNavigate).toHaveBeenCalledWith('/contacto');
  });
});