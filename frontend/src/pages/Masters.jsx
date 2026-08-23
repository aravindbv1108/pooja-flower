import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Plus, Flower2, Search, Pencil, Trash2, X } from 'lucide-react';
import { masterApi } from '../api/services';
import { useToast } from '../context/ToastContext';
import Loader from '../components/common/Loader';
import EmptyState from '../components/common/EmptyState';
import ConfirmModal from '../components/common/ConfirmModal';
import { formatCurrency, formatNumber, formatDate } from '../utils/format';

const UNIT_OPTIONS = ['Piece', 'KG', 'Meter', 'Bundle', 'Box', 'Packet', 'Dozen', 'Other'];

const emptyForm = { name: '', price: '', unit: 'Piece', customUnit: '', note: '' };

const Masters = () => {
  const { t } = useTranslation();
  const { showToast } = useToast();

  const [masters, setMasters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [sort, setSort] = useState('newest');

  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const [confirmDelete, setConfirmDelete] = useState(null);

  const load = async () => {
    setLoading(true);
    try {
      const res = await masterApi.list({ search, status, sort });
      setMasters(res.data.data);
    } catch {
      showToast(t('common.somethingWrong'), 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); /* eslint-disable-next-line */ }, [status, sort]);
  useEffect(() => {
    const timer = setTimeout(load, 350);
    return () => clearTimeout(timer);
    // eslint-disable-next-line
  }, [search]);

  const openCreate = () => { setEditingId(null); setForm(emptyForm); setError(''); setModalOpen(true); };
  const openEdit = (m) => {
    setEditingId(m._id);
    setForm({ name: m.name, price: m.price, unit: m.unit, customUnit: m.customUnit || '', note: m.note || '' });
    setError('');
    setModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setError('');
    if (!form.name.trim()) return setError(t('common.required'));
    if (!form.price || Number(form.price) <= 0) return setError(t('common.required'));

    setSaving(true);
    try {
      if (editingId) {
        await masterApi.update(editingId, form);
        showToast(t('masters.updatedSuccess'));
      } else {
        await masterApi.create(form);
        showToast(t('masters.createdSuccess'));
      }
      setModalOpen(false);
      load();
    } catch (err) {
      setError(err.response?.data?.message || t('common.somethingWrong'));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    try {
      const res = await masterApi.remove(confirmDelete._id);
      showToast(res.data.message?.includes('archived') ? t('masters.archivedInstead') : t('masters.deletedSuccess'));
      setConfirmDelete(null);
      load();
    } catch {
      showToast(t('common.somethingWrong'), 'error');
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-gray-800">{t('masters.title')}</h2>
          <p className="text-sm text-gray-400">{t('masters.subtitle')}</p>
        </div>
        <button onClick={openCreate} className="btn-primary flex items-center gap-2">
          <Plus size={18} /> {t('masters.createMaster')}
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[220px]">
          <Search className="absolute left-3.5 top-3 text-gray-400" size={18} />
          <input className="input-field pl-11" placeholder={t('masters.search')} value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <select className="input-field w-auto" value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="">{t('common.all')}</option>
          <option value="Active">{t('masters.active')}</option>
          <option value="Inactive">{t('masters.inactive')}</option>
          <option value="Archived">{t('masters.archived')}</option>
        </select>
        <select className="input-field w-auto" value={sort} onChange={(e) => setSort(e.target.value)}>
          <option value="newest">{t('masters.sortNewest')}</option>
          <option value="oldest">{t('masters.sortOldest')}</option>
          <option value="price_high">{t('masters.sortPriceHigh')}</option>
          <option value="price_low">{t('masters.sortPriceLow')}</option>
        </select>
      </div>

      {loading ? (
        <Loader />
      ) : masters.length === 0 ? (
        <EmptyState icon={Flower2} title={t('masters.noMasters')} subtitle={t('masters.noMastersSub')} actionLabel={t('masters.createMaster')} onAction={openCreate} />
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {masters.map((m) => (
            <div key={m._id} className="card p-5">
              <div className="flex items-start justify-between mb-3">
                <div className="w-10 h-10 rounded-xl bg-pink-50 text-pink-600 flex items-center justify-center">
                  <Flower2 size={20} />
                </div>
                <span className={`badge ${m.status === 'Active' ? 'bg-green-50 text-green-600' : m.status === 'Archived' ? 'bg-gray-100 text-gray-500' : 'bg-amber-50 text-amber-600'}`}>
                  {t(`masters.${m.status.toLowerCase()}`)}
                </span>
              </div>
              <h3 className="font-bold text-gray-800">{m.name}</h3>
              <p className="text-primary-700 font-semibold text-sm mt-0.5">
                {formatCurrency(m.price)} / {m.unit === 'Other' ? m.customUnit : t(`units.${m.unit}`)}
              </p>
              {m.note && <p className="text-xs text-gray-400 mt-1 line-clamp-2">{m.note}</p>}

              <div className="grid grid-cols-3 gap-2 mt-4 text-center">
                <div>
                  <p className="text-sm font-bold text-gray-700">{m.totalTasks}</p>
                  <p className="text-[10px] text-gray-400">{t('masters.totalTasks')}</p>
                </div>
                <div>
                  <p className="text-sm font-bold text-gray-700">{formatNumber(m.totalQuantity)}</p>
                  <p className="text-[10px] text-gray-400">{t('masters.totalQuantity')}</p>
                </div>
                <div>
                  <p className="text-sm font-bold text-gray-700">{formatCurrency(m.totalEarnings)}</p>
                  <p className="text-[10px] text-gray-400">{t('masters.totalEarnings')}</p>
                </div>
              </div>

              <div className="flex items-center justify-between mt-4 pt-3 border-t border-purple-50">
                <span className="text-[11px] text-gray-400">{formatDate(m.createdAt)}</span>
                <div className="flex gap-1">
                  <button onClick={() => openEdit(m)} className="p-2 rounded-lg hover:bg-purple-50 text-primary-600"><Pencil size={16} /></button>
                  <button onClick={() => setConfirmDelete(m)} className="p-2 rounded-lg hover:bg-red-50 text-red-500"><Trash2 size={16} /></button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create/Edit modal */}
      {modalOpen && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={() => setModalOpen(false)}>
          <div className="bg-white rounded-xl2 shadow-cardHover max-w-md w-full p-6 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-bold text-gray-800">{editingId ? t('masters.editMaster') : t('masters.createMaster')}</h3>
              <button onClick={() => setModalOpen(false)}><X size={20} className="text-gray-400" /></button>
            </div>

            {error && <div className="bg-red-50 text-red-600 text-sm px-4 py-2.5 rounded-xl mb-4">{error}</div>}

            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="label">{t('masters.name')}</label>
                <input className="input-field" placeholder={t('masters.namePlaceholder')} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">{t('masters.price')}</label>
                  <input type="number" min="0.01" step="0.01" className="input-field" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} />
                </div>
                <div>
                  <label className="label">{t('masters.unit')}</label>
                  <select className="input-field" value={form.unit} onChange={(e) => setForm({ ...form, unit: e.target.value })}>
                    {UNIT_OPTIONS.map((u) => <option key={u} value={u}>{t(`units.${u}`)}</option>)}
                  </select>
                </div>
              </div>
              {form.unit === 'Other' && (
                <div>
                  <label className="label">{t('masters.customUnit')}</label>
                  <input className="input-field" value={form.customUnit} onChange={(e) => setForm({ ...form, customUnit: e.target.value })} />
                </div>
              )}
              <div>
                <label className="label">{t('masters.note')}</label>
                <textarea className="input-field" rows={3} value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setModalOpen(false)} className="btn-secondary flex-1">{t('common.cancel')}</button>
                <button type="submit" disabled={saving} className="btn-primary flex-1">{saving ? t('common.loading') : t('common.save')}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmModal
        open={!!confirmDelete}
        title={t('masters.deleteConfirm')}
        message={confirmDelete?.name}
        onCancel={() => setConfirmDelete(null)}
        onConfirm={handleDelete}
      />
    </div>
  );
};

export default Masters;
