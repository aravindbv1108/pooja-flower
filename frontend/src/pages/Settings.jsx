import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { authApi } from '../api/services';

const Settings = () => {
  const { t } = useTranslation();
  const { user, updateUser } = useAuth();
  const { showToast } = useToast();

  const [form, setForm] = useState({
    businessName: user?.businessName || '',
    phone: user?.phone || '',
    whatsapp: user?.whatsapp || '',
    address: user?.address || '',
    ownerName: user?.ownerName || '',
    signatureLabel: user?.signatureLabel || 'Authorized Signature',
    reportFooter: user?.reportFooter || '',
    defaultLanguage: user?.defaultLanguage || 'en',
  });
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await authApi.updateMe(form);
      updateUser(res.data.user);
      showToast(t('settings.savedSuccess'));
    } catch {
      showToast(t('common.somethingWrong'), 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-2xl">
      <h2 className="text-lg font-bold text-gray-800 mb-5">{t('settings.title')}</h2>
      <form onSubmit={handleSubmit} className="card p-6 space-y-4">
        <div>
          <label className="label">{t('settings.businessName')}</label>
          <input className="input-field" value={form.businessName} onChange={(e) => setForm({ ...form, businessName: e.target.value })} />
        </div>
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="label">{t('settings.phone')}</label>
            <input className="input-field" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
          </div>
          <div>
            <label className="label">{t('settings.whatsapp')}</label>
            <input className="input-field" value={form.whatsapp} onChange={(e) => setForm({ ...form, whatsapp: e.target.value })} />
          </div>
        </div>
        <div>
          <label className="label">{t('settings.address')}</label>
          <textarea className="input-field" rows={2} value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
        </div>
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="label">{t('settings.ownerName')}</label>
            <input className="input-field" value={form.ownerName} onChange={(e) => setForm({ ...form, ownerName: e.target.value })} />
          </div>
          <div>
            <label className="label">{t('settings.signatureLabel')}</label>
            <input className="input-field" value={form.signatureLabel} onChange={(e) => setForm({ ...form, signatureLabel: e.target.value })} />
          </div>
        </div>
        <div>
          <label className="label">{t('settings.reportFooter')}</label>
          <textarea className="input-field" rows={2} value={form.reportFooter} onChange={(e) => setForm({ ...form, reportFooter: e.target.value })} />
        </div>
        <div>
          <label className="label">{t('settings.defaultLanguage')}</label>
          <select className="input-field w-auto" value={form.defaultLanguage} onChange={(e) => setForm({ ...form, defaultLanguage: e.target.value })}>
            <option value="en">English</option>
            <option value="kn">ಕನ್ನಡ</option>
          </select>
        </div>
        <button type="submit" disabled={saving} className="btn-primary">{saving ? t('common.loading') : t('settings.save')}</button>
      </form>
    </div>
  );
};

export default Settings;
