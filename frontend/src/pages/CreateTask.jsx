import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { CalendarDays, Flower2 } from 'lucide-react';
import { masterApi, taskApi } from '../api/services';
import { useToast } from '../context/ToastContext';
import { formatCurrency, toInputDate } from '../utils/format';

const DAY_PRESETS = [7, 10, 15, 30, 60];

const CreateTask = () => {
  const { t } = useTranslation();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [masters, setMasters] = useState([]);
  const [masterId, setMasterId] = useState('');
  const [totalDays, setTotalDays] = useState(15);
  const [customDays, setCustomDays] = useState('');
  const [isCustom, setIsCustom] = useState(false);
  const [startDate, setStartDate] = useState(toInputDate(new Date()));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    masterApi.list({ status: 'Active', limit: 100 }).then((res) => setMasters(res.data.data));
  }, []);

  const selectedMaster = masters.find((m) => m._id === masterId);
  const days = isCustom ? Number(customDays || 0) : totalDays;

  const endDate = (() => {
    if (!startDate || !days) return null;
    const d = new Date(startDate);
    d.setDate(d.getDate() + days - 1);
    return d;
  })();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!masterId) return setError(t('common.required'));
    if (!days || days <= 0) return setError(t('common.required'));
    if (!startDate) return setError(t('common.required'));

    setLoading(true);
    try {
      await taskApi.create({ masterId, totalDays: days, startDate });
      showToast(t('tasks.taskCreatedSuccess'));
      navigate('/tasks');
    } catch (err) {
      setError(err.response?.data?.message || t('common.somethingWrong'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <h2 className="text-lg font-bold text-gray-800 mb-5">{t('tasks.createTitle')}</h2>

      <div className="card p-6 space-y-6">
        {error && <div className="bg-red-50 text-red-600 text-sm px-4 py-2.5 rounded-xl">{error}</div>}

        {/* Master selection */}
        <div>
          <label className="label">{t('tasks.selectMaster')}</label>
          <div className="grid sm:grid-cols-2 gap-3">
            {masters.map((m) => (
              <button
                key={m._id}
                type="button"
                onClick={() => setMasterId(m._id)}
                className={`flex items-center gap-3 p-3.5 rounded-xl border-2 text-left transition-colors ${
                  masterId === m._id ? 'border-primary-500 bg-primary-50' : 'border-gray-100 hover:border-primary-200'
                }`}
              >
                <div className="w-9 h-9 rounded-lg bg-pink-50 text-pink-600 flex items-center justify-center shrink-0">
                  <Flower2 size={18} />
                </div>
                <div>
                  <p className="font-semibold text-sm text-gray-800">{m.name}</p>
                  <p className="text-xs text-gray-500">{formatCurrency(m.price)} / {m.unit === 'Other' ? m.customUnit : t(`units.${m.unit}`)}</p>
                </div>
              </button>
            ))}
            {masters.length === 0 && (
              <p className="text-sm text-gray-400 col-span-2">
                No active masters yet. <a href="/masters" className="text-primary-600 font-semibold">Create one first.</a>
              </p>
            )}
          </div>
        </div>

        {/* Days */}
        <div>
          <label className="label">{t('tasks.totalDays')}</label>
          <div className="flex flex-wrap gap-2">
            {DAY_PRESETS.map((d) => (
              <button
                key={d}
                type="button"
                onClick={() => { setIsCustom(false); setTotalDays(d); }}
                className={`px-4 py-2 rounded-xl text-sm font-semibold border-2 ${
                  !isCustom && totalDays === d ? 'border-primary-500 bg-primary-50 text-primary-700' : 'border-gray-100 text-gray-600'
                }`}
              >
                {d} {t('tasks.day')}s
              </button>
            ))}
            <button
              type="button"
              onClick={() => setIsCustom(true)}
              className={`px-4 py-2 rounded-xl text-sm font-semibold border-2 ${isCustom ? 'border-primary-500 bg-primary-50 text-primary-700' : 'border-gray-100 text-gray-600'}`}
            >
              {t('tasks.customDays')}
            </button>
          </div>
          {isCustom && (
            <input
              type="number" min="1" className="input-field mt-3 max-w-[160px]"
              value={customDays} onChange={(e) => setCustomDays(e.target.value)}
              placeholder="e.g. 21"
            />
          )}
        </div>

        {/* Start date */}
        <div>
          <label className="label">{t('tasks.startDate')}</label>
          <div className="relative max-w-[220px]">
            <CalendarDays className="absolute left-3.5 top-3 text-gray-400" size={18} />
            <input type="date" className="input-field pl-11" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
          </div>
        </div>

        {/* Preview */}
        {selectedMaster && days > 0 && startDate && (
          <div className="bg-purple-50 rounded-xl p-4 text-sm space-y-1">
            <p><span className="text-gray-500">{t('tasks.master')}:</span> <span className="font-semibold">{selectedMaster.name}</span></p>
            <p><span className="text-gray-500">{t('tasks.rate')}:</span> <span className="font-semibold">{formatCurrency(selectedMaster.price)} / {selectedMaster.unit === 'Other' ? selectedMaster.customUnit : t(`units.${selectedMaster.unit}`)}</span></p>
            <p><span className="text-gray-500">{t('tasks.period')}:</span> <span className="font-semibold">{new Date(startDate).toLocaleDateString('en-IN')} → {endDate?.toLocaleDateString('en-IN')}</span></p>
            <p><span className="text-gray-500">{t('tasks.totalDays')}:</span> <span className="font-semibold">{days}</span></p>
          </div>
        )}

        <button onClick={handleSubmit} disabled={loading} className="btn-primary w-full">
          {loading ? t('common.loading') : t('tasks.createTask')}
        </button>
      </div>
    </div>
  );
};

export default CreateTask;
