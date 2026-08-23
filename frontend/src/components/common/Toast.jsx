import { useEffect } from 'react';
import { CheckCircle2, XCircle, X } from 'lucide-react';

const Toast = ({ toast, onClose }) => {
  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(onClose, 3200);
    return () => clearTimeout(timer);
  }, [toast, onClose]);

  if (!toast) return null;
  const isError = toast.type === 'error';

  return (
    <div className="fixed top-4 right-4 z-[100] animate-[slideIn_0.2s_ease-out]">
      <div className={`flex items-center gap-3 px-4 py-3 rounded-xl shadow-cardHover border max-w-sm ${isError ? 'bg-red-50 border-red-200 text-red-700' : 'bg-green-50 border-green-200 text-green-700'}`}>
        {isError ? <XCircle size={20} /> : <CheckCircle2 size={20} />}
        <p className="text-sm font-medium flex-1">{toast.message}</p>
        <button onClick={onClose}><X size={16} /></button>
      </div>
    </div>
  );
};

export default Toast;
