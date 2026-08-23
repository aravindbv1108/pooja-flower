import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FileBarChart, Download } from 'lucide-react';
import { reportApi, taskApi } from '../api/services';
import { formatCurrency, formatNumber } from '../utils/format';
import Loader from '../components/common/Loader';

const Reports = () => {
  const { t } = useTranslation();
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [monthly, setMonthly] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadMonthly = async () => {
    const res = await reportApi.monthly({ year, month });
    setMonthly(res.data.data);
  };

  useEffect(() => {
    setLoading(true);
    Promise.all([loadMonthly(), taskApi.list({ limit: 100 }).then((r) => setTasks(r.data.data))]).finally(() => setLoading(false));
    // eslint-disable-next-line
  }, [year, month]);

  const exportCsv = () => {
    const header = ['Task', 'Master', 'Total Days', 'Completed', 'Quantity', 'Earned', 'Paid', 'Pending', 'Status'];
    const rows = tasks.map((t2) => [
      t2.taskName, t2.masterNameSnapshot, t2.totalDays, t2.completedDays, t2.totalQuantity, t2.totalAmount, t2.totalPaid, t2.pendingAmount, t2.paymentStatus,
    ]);
    const csv = [header, ...rows].map((r) => r.map((v) => `"${v}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'pooja-flower-report.csv'; a.click();
    URL.revokeObjectURL(url);
  };

  if (loading) return <Loader />;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-bold text-gray-800">{t('reports.title')}</h2>
        <button onClick={exportCsv} className="btn-secondary flex items-center gap-2 text-sm">
          <Download size={16} /> Export CSV
        </button>
      </div>

      <div className="card p-5">
        <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2"><FileBarChart size={18} /> {t('reports.monthlyReport')}</h3>
        <div className="flex gap-3 mb-4">
          <select className="input-field w-auto" value={month} onChange={(e) => setMonth(Number(e.target.value))}>
            {Array.from({ length: 12 }, (_, i) => (
              <option key={i + 1} value={i + 1}>{new Date(0, i).toLocaleString('en', { month: 'long' })}</option>
            ))}
          </select>
          <select className="input-field w-auto" value={year} onChange={(e) => setYear(Number(e.target.value))}>
            {[now.getFullYear() - 1, now.getFullYear(), now.getFullYear() + 1].map((y) => <option key={y} value={y}>{y}</option>)}
          </select>
        </div>
        <div className="grid grid-cols-3 gap-4">
          <div><p className="text-xs text-gray-400">{t('masters.totalQuantity')}</p><p className="text-lg font-bold">{formatNumber(monthly?.totalQuantity)}</p></div>
          <div><p className="text-xs text-gray-400">{t('tasks.totalEarned')}</p><p className="text-lg font-bold">{formatCurrency(monthly?.totalEarned)}</p></div>
          <div><p className="text-xs text-gray-400">{t('tasks.paid')}</p><p className="text-lg font-bold text-green-600">{formatCurrency(monthly?.totalPaid)}</p></div>
        </div>
      </div>

      <div className="card overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-gray-400 border-b border-purple-50">
              <th className="py-3 px-4">{t('reports.task')}</th>
              <th className="py-3 px-4">{t('tasks.master')}</th>
              <th className="py-3 px-4">{t('tasks.totalDays')}</th>
              <th className="py-3 px-4">{t('tasks.completed')}</th>
              <th className="py-3 px-4">{t('masters.totalQuantity')}</th>
              <th className="py-3 px-4">{t('tasks.totalEarned')}</th>
              <th className="py-3 px-4">{t('tasks.paid')}</th>
              <th className="py-3 px-4">{t('tasks.pending')}</th>
            </tr>
          </thead>
          <tbody>
            {tasks.map((t2) => (
              <tr key={t2._id} className="border-b border-purple-50/60">
                <td className="py-2.5 px-4">{t2.taskName}</td>
                <td className="py-2.5 px-4">{t2.masterNameSnapshot}</td>
                <td className="py-2.5 px-4">{t2.totalDays}</td>
                <td className="py-2.5 px-4">{t2.completedDays}</td>
                <td className="py-2.5 px-4">{formatNumber(t2.totalQuantity)}</td>
                <td className="py-2.5 px-4">{formatCurrency(t2.totalAmount)}</td>
                <td className="py-2.5 px-4 text-green-600">{formatCurrency(t2.totalPaid)}</td>
                <td className="py-2.5 px-4 text-amber-600">{formatCurrency(t2.pendingAmount)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Reports;
