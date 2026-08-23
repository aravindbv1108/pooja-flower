import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { X } from 'lucide-react';
import { toInputDate } from '../../utils/format';

const METHODS = ['Cash', 'UPI', 'Bank Transfer', 'Other'];

const PaymentModal = ({ open, onClose, onSubmit, pendingAmount }) => {
  const { t } = useTranslation();
  const [form, setForm] = useState({ amount: '', paymentDate: toInputDate(new Date()), paymentMethod: 'Cash', notes: '' });
  const [allowAdvance, setAllowAdvance] = useState(false);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  if (!open) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!form.amount || Number(form.amount) <= 0) return setError(t('common.required'));

    setSaving(true);
    try {
      await onSubmit({ ...form, amount: Number(form.amount), allowAdvance });
      setForm({ amount: '', paymentDate: toInputDate(new Date()), paymentMethod: 'Cash', notes: '' });
      setAllowAdvance(false);
    } catch (err) {
      setError(err.response?.data?.message || t('common.somethingWrong'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-xl2 shadow-cardHover max-w-md w-full p-6" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-lg font-bold text-gray-800">{t('payments.recordPayment')}</h3>
          <button onClick={onClose}><X size={20} className="text-gray-400" /></button>
        </div>

        {error && <div className="bg-red-50 text-red-600 text-sm px-4 py-2.5 rounded-xl mb-4">{error}</div>}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="label">{t('payments.amountPaid')}</label>
            <input type="number" min="0.01" step="0.01" className="input-field" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} />
            {pendingAmount !== undefined && <p className="text-xs text-gray-400 mt-1">Pending: ₹{pendingAmount}</p>}
          </div>
          <div>
            <label className="label">{t('payments.paymentDate')}</label>
            <input type="date" className="input-field" value={form.paymentDate} onChange={(e) => setForm({ ...form, paymentDate: e.target.value })} />
          </div>
          <div>
            <label className="label">{t('payments.paymentMethod')}</label>
            <select className="input-field" value={form.paymentMethod} onChange={(e) => setForm({ ...form, paymentMethod: e.target.value })}>
              {METHODS.map((m) => <option key={m} value={m}>{m}</option>)}
            </select>
          </div>
          <div>
            <label className="label">{t('payments.notes')}</label>
            <textarea className="input-field" rows={2} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
          </div>
          <label className="flex items-center gap-2 text-xs text-gray-500">
            <input type="checkbox" checked={allowAdvance} onChange={(e) => setAllowAdvance(e.target.checked)} />
            {t('payments.allowAdvance')}
          </label>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn-secondary flex-1">{t('common.cancel')}</button>
            <button type="submit" disabled={saving} className="btn-primary flex-1">{saving ? t('common.loading') : t('payments.save')}</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PaymentModal;
