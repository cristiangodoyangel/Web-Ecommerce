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
          <div className="mx-auto mb-4 w-16 h-16 rounded-full flex items-center justify-center" style={{ background: '#D0E1F9' }}>
            <Lock className="h-8 w-8" style={{ color: '#283655' }} />
        </div>
        
        {/* Mensaje */}
          <p className="display mb-6" style={{ color: '#4D648D' }}>
          {message || 'Debes iniciar sesión para continuar'}
        </p>
        
        {/* Botones */}
        <div className="flex flex-col gap-3">
            <Button
              onClick={handleLoginRedirect}
              className="w-full text-white font-medium py-2 px-4 rounded-lg transition-all duration-300 hover:opacity-90"
              style={{ backgroundColor: '#283655', color: '#ffffff' }}
            >
              <User className="display h-4 w-4 mr-2" style={{ color: '#D0E1F9' }} />
              Iniciar Sesión
            </Button>
            <Button
              onClick={handleRegisterRedirect}
              variant="outline"
              className="w-full font-medium py-2 px-4 rounded-lg transition-all duration-300"
              style={{ 
                borderColor: '#4D648D',
                color: '#4D648D'
              }}
            >
              Crear Cuenta Nueva
            </Button>
            <button
              onClick={onClose}
              className="text-sm transition-colors mt-2"
              style={{ color: '#283655' }}
            >
              Cancelar
            </button>
        </div>
      </div>
    </Modal>
  );
};

export default AuthModal;