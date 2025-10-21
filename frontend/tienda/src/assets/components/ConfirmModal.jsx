import { X, AlertTriangle } from 'lucide-react';
import { Button } from './ui/button';

const ConfirmModal = ({ 
  isOpen, 
  onClose, 
  onConfirm, 
  title = "Confirmar acción",
  message = "¿Estás seguro de que quieres continuar?",
  confirmText = "Confirmar",
  cancelText = "Cancelar",
  type = "warning"
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b">
          <h3 className="display text-lg font-semibold" style={{ color: '#8c000f' }}>
            {title}
          </h3>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="h-8 w-8 p-0 rounded-full hover:bg-gray-100"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="p-6">
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0">
              <AlertTriangle className="h-12 w-12 text-orange-500" />
            </div>
            <div className="flex-1">
              <p className="display text-gray-700 text-base leading-relaxed">
                {message}
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-col-reverse sm:flex-row sm:items-center sm:justify-end gap-3 p-6 border-t bg-gray-50">
          <Button
            variant="outline"
            onClick={onClose}
            className="display px-6 py-2 w-full sm:w-auto"
            style={{ borderColor: '#d1d5db', color: '#6b7280' }}
          >
            {cancelText}
          </Button>
          <Button
            onClick={onConfirm}
            className="display px-6 py-2 w-full sm:w-auto"
            style={{ backgroundColor: '#f83258', color: 'white' }}
          >
            {confirmText}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmModal;