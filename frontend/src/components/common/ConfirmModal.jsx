import { AlertTriangle } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const ConfirmModal = ({ open, title, message, onConfirm, onCancel, danger = true }) => {
  const { t } = useTranslation();
  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={onCancel}>
      <div className="bg-white rounded-xl2 shadow-cardHover max-w-sm w-full p-6" onClick={(e) => e.stopPropagation()}>
        <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-4 ${danger ? 'bg-red-50 text-red-500' : 'bg-primary-50 text-primary-600'}`}>
          <AlertTriangle size={24} />
        </div>
        <h3 className="text-lg font-bold text-gray-800 mb-2">{title}</h3>
        <p className="text-sm text-gray-500 mb-6">{message}</p>
        <div className="flex gap-3">
          <button onClick={onCancel} className="btn-secondary flex-1">{t('common.cancel')}</button>
          <button onClick={onConfirm} className={danger ? 'btn-danger flex-1' : 'btn-primary flex-1'}>{t('common.confirm')}</button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmModal;
