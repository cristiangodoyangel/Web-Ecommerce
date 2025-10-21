import React from 'react';
import { User, Lock } from 'lucide-react';
import { Button } from './ui/button.jsx';
import Modal from './ui/Modal.jsx';

const AuthModal = ({ isOpen, onClose, message }) => {
  const handleLoginRedirect = () => {
    onClose();
    window.location.href = '/login';
  };

  const handleRegisterRedirect = () => {
    onClose();
    window.location.href = '/registro';
  };

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={onClose} 
      title="🔐 Acceso Requerido"
      showCloseButton={true}
    >
      <div className="text-center">
        {/* Icono */}
        <div className="mx-auto mb-4 w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
          <Lock className="h-8 w-8" style={{ color: '#f83258' }} />
        </div>
        
        {/* Mensaje */}
        <p className="text-gray-600 mb-6">
          {message || 'Debes iniciar sesión para continuar'}
        </p>
        
        {/* Botones */}
        <div className="flex flex-col gap-3">
          <Button
            onClick={handleLoginRedirect}
            className="w-full text-white font-medium py-2 px-4 rounded-lg transition-all duration-300 hover:opacity-90"
            style={{ backgroundColor: '#8c000f' }}
          >
            <User className="h-4 w-4 mr-2" />
            Iniciar Sesión
          </Button>
          
          <Button
            onClick={handleRegisterRedirect}
            variant="outline"
            className="w-full font-medium py-2 px-4 rounded-lg transition-all duration-300"
            style={{ 
              borderColor: '#f83258',
              color: '#f83258'
            }}
          >
            Crear Cuenta Nueva
          </Button>
          
          <button
            onClick={onClose}
            className="text-gray-500 text-sm hover:text-gray-700 transition-colors mt-2"
          >
            Cancelar
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default AuthModal;