import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Flower2, Mail, Lock, User, Briefcase } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

const Register = () => {
  const { t } = useTranslation();
  const { register } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [form, setForm] = useState({ name: '', email: '', password: '', confirmPassword: '', businessName: 'Pooja Flower' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (form.password !== form.confirmPassword) {
      setError(t('auth.passwordsMismatch'));
      return;
    }
    setLoading(true);
    try {
      await register(form);
      showToast(t('auth.registerSuccess'));
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || t('common.somethingWrong'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 via-white to-pink-50 px-4 py-10">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-primary-600 flex items-center justify-center shadow-cardHover mb-3">
            <Flower2 className="text-white" size={30} />
          </div>
          <h1 className="text-2xl font-extrabold text-primary-800">{t('appName')}</h1>
        </div>

        <div className="card p-8">
          <h2 className="text-xl font-bold text-gray-800 mb-1">{t('auth.registerTitle')}</h2>
          <p className="text-sm text-gray-400 mb-6">{t('auth.registerSubtitle')}</p>

          {error && <div className="bg-red-50 text-red-600 text-sm px-4 py-2.5 rounded-xl mb-4">{error}</div>}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="label">{t('auth.name')}</label>
              <div className="relative">
                <User className="absolute left-3.5 top-3 text-gray-400" size={18} />
                <input required className="input-field pl-11" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
              </div>
            </div>
            <div>
              <label className="label">{t('auth.businessName')}</label>
              <div className="relative">
                <Briefcase className="absolute left-3.5 top-3 text-gray-400" size={18} />
                <input className="input-field pl-11" value={form.businessName} onChange={(e) => setForm({ ...form, businessName: e.target.value })} />
              </div>
            </div>
            <div>
              <label className="label">{t('auth.email')}</label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-3 text-gray-400" size={18} />
                <input type="email" required className="input-field pl-11" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
              </div>
            </div>
            <div>
              <label className="label">{t('auth.password')}</label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-3 text-gray-400" size={18} />
                <input type="password" required minLength={6} className="input-field pl-11" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
              </div>
            </div>
            <div>
              <label className="label">{t('auth.confirmPassword')}</label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-3 text-gray-400" size={18} />
                <input type="password" required className="input-field pl-11" value={form.confirmPassword} onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })} />
              </div>
            </div>
            <button type="submit" disabled={loading} className="btn-primary w-full">
              {loading ? t('common.loading') : t('auth.signUp')}
            </button>
          </form>

          <p className="text-center text-sm text-gray-500 mt-6">
            {t('auth.haveAccount')}{' '}
            <Link to="/login" className="text-primary-600 font-semibold">{t('auth.signIn')}</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;
