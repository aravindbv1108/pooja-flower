import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { Wallet } from 'lucide-react';
import { taskApi } from '../api/services';
import Loader from '../components/common/Loader';
import EmptyState from '../components/common/EmptyState';
import { formatCurrency, formatDate } from '../utils/format';

const statusColors = { Paid: 'bg-green-50 text-green-600', 'Partially Paid': 'bg-amber-50 text-amber-600', Pending: 'bg-red-50 text-red-500' };

const Payments = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    taskApi.list({ limit: 100 }).then((res) => {
      setTasks(res.data.data);
      setLoading(false);
    });
  }, []);

  if (loading) return <Loader />;

  const totals = tasks.reduce(
    (acc, t) => ({
      earned: acc.earned + t.totalAmount,
      paid: acc.paid + t.totalPaid,
      pending: acc.pending + t.pendingAmount,
    }),
    { earned: 0, paid: 0, pending: 0 }
  );

  return (
    <div className="space-y-5">
      <h2 className="text-lg font-bold text-gray-800">{t('payments.title')}</h2>

      <div className="grid grid-cols-3 gap-4">
        <div className="card p-4"><p className="text-xs text-gray-400">{t('tasks.totalEarned')}</p><p className="text-lg font-bold">{formatCurrency(totals.earned)}</p></div>
        <div className="card p-4"><p className="text-xs text-gray-400">{t('tasks.paid')}</p><p className="text-lg font-bold text-green-600">{formatCurrency(totals.paid)}</p></div>
        <div className="card p-4"><p className="text-xs text-gray-400">{t('tasks.pending')}</p><p className="text-lg font-bold text-amber-600">{formatCurrency(totals.pending)}</p></div>
      </div>

      {tasks.length === 0 ? (
        <EmptyState icon={Wallet} title={t('tasks.noActiveTasks')} />
      ) : (
        <div className="card overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-gray-400 border-b border-purple-50">
                <th className="py-3 px-4">{t('tasks.master')}</th>
                <th className="py-3 px-4">{t('tasks.period')}</th>
                <th className="py-3 px-4">{t('tasks.totalEarned')}</th>
                <th className="py-3 px-4">{t('tasks.paid')}</th>
                <th className="py-3 px-4">{t('tasks.pending')}</th>
                <th className="py-3 px-4">{t('reports.paymentStatus')}</th>
              </tr>
            </thead>
            <tbody>
              {tasks.map((t2) => (
                <tr key={t2._id} className="border-b border-purple-50/60 cursor-pointer hover:bg-purple-50/40" onClick={() => navigate(`/tasks/${t2._id}`)}>
                  <td className="py-3 px-4 font-medium">{t2.masterNameSnapshot}</td>
                  <td className="py-3 px-4 text-gray-500">{formatDate(t2.startDate)} - {formatDate(t2.endDate)}</td>
                  <td className="py-3 px-4">{formatCurrency(t2.totalAmount)}</td>
                  <td className="py-3 px-4 text-green-600">{formatCurrency(t2.totalPaid)}</td>
                  <td className="py-3 px-4 text-amber-600">{formatCurrency(t2.pendingAmount)}</td>
                  <td className="py-3 px-4"><span className={`badge ${statusColors[t2.paymentStatus]}`}>{t2.paymentStatus}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default Payments;
