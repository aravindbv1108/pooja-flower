import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import {
  ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  PieChart, Pie, Cell, BarChart, Bar,
} from 'recharts';
import {
  Wallet, IndianRupee, Clock, Flower2, ListChecks, CheckCircle2,
  PlayCircle, CalendarX, CalendarCheck, CalendarDays,
} from 'lucide-react';
import StatCard from '../components/common/StatCard';
import Loader, { Skeleton } from '../components/common/Loader';
import EmptyState from '../components/common/EmptyState';
import { dashboardApi } from '../api/services';
import { formatCurrency, formatNumber, formatDateLong } from '../utils/format';

const RANGE_OPTIONS = ['7d', '30d', '3m', '6m', '1y', 'all'];
const PIE_COLORS = ['#8b5cf6', '#f97316', '#ec4899', '#22c55e', '#ef4444'];

const Dashboard = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const [stats, setStats] = useState(null);
  const [earnings, setEarnings] = useState([]);
  const [taskStatus, setTaskStatus] = useState([]);
  const [activity, setActivity] = useState([]);
  const [range, setRange] = useState('30d');
  const [loading, setLoading] = useState(true);

  const loadStats = async () => {
    const res = await dashboardApi.stats();
    setStats(res.data.data);
  };

  const loadEarnings = async (r) => {
    const res = await dashboardApi.earnings(r);
    setEarnings(res.data.data);
  };

  const loadRest = async () => {
    const [statusRes, activityRes] = await Promise.all([
      dashboardApi.taskStatus(),
      dashboardApi.recentActivity(),
    ]);
    setTaskStatus(statusRes.data.data);
    setActivity(activityRes.data.data);
  };

  useEffect(() => {
    setLoading(true);
    Promise.all([loadStats(), loadEarnings(range), loadRest()]).finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    loadEarnings(range);
  }, [range]);

  if (loading) return <Loader label={t('common.loading')} />;

  const s = stats || {};
  const taskProgress = s.totalTasks ? Math.round((s.completedTasks / s.totalTasks) * 100) : 0;
  const paymentProgress = s.totalEarnings ? Math.round((s.totalPaid / s.totalEarnings) * 100) : 0;
  const dayProgress = s.totalWorkingDays ? Math.round((s.completedWorkingDays / s.totalWorkingDays) * 100) : 0;

  return (
    <div className="space-y-6">
      {/* Stat cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-4">
        <StatCard icon={IndianRupee} label={t('dashboard.totalEarnings')} value={formatCurrency(s.totalEarnings)} color="purple" onClick={() => navigate('/reports')} />
        <StatCard icon={Wallet} label={t('dashboard.totalPaid')} value={formatCurrency(s.totalPaid)} color="green" onClick={() => navigate('/payments')} />
        <StatCard icon={Clock} label={t('dashboard.pendingAmount')} value={formatCurrency(s.pendingAmount)} color="amber" onClick={() => navigate('/payments')} />
        <StatCard icon={Flower2} label={t('dashboard.totalQuantity')} value={formatNumber(s.totalQuantity)} color="pink" />
        <StatCard icon={ListChecks} label={t('dashboard.totalTasks')} value={s.totalTasks || 0} color="purple" onClick={() => navigate('/tasks')} />
        <StatCard icon={CheckCircle2} label={t('dashboard.completedTasks')} value={s.completedTasks || 0} color="green" onClick={() => navigate('/completed-tasks')} />
        <StatCard icon={PlayCircle} label={t('dashboard.activeTasks')} value={s.activeTasks || 0} color="purple" onClick={() => navigate('/tasks')} />
        <StatCard icon={CalendarX} label={t('dashboard.missedDays')} value={s.missedDays || 0} color="red" />
        <StatCard icon={CalendarDays} label={t('dashboard.totalWorkingDays')} value={s.totalWorkingDays || 0} color="pink" />
        <StatCard icon={CalendarCheck} label={t('dashboard.completedWorkingDays')} value={s.completedWorkingDays || 0} color="green" />
      </div>

      {/* Progress bars */}
      <div className="grid md:grid-cols-3 gap-4">
        {[
          { label: t('dashboard.taskCompletion'), value: taskProgress, color: 'bg-primary-600' },
          { label: t('dashboard.paymentCollection'), value: paymentProgress, color: 'bg-green-500' },
          { label: t('dashboard.workingDayCompletion'), value: dayProgress, color: 'bg-orange-500' },
        ].map((p) => (
          <div key={p.label} className="card p-5">
            <div className="flex justify-between text-sm mb-2">
              <span className="font-medium text-gray-600">{p.label}</span>
              <span className="font-bold text-gray-800">{p.value}%</span>
            </div>
            <div className="h-2.5 rounded-full bg-purple-50 overflow-hidden">
              <div className={`h-full ${p.color} rounded-full transition-all duration-500`} style={{ width: `${Math.min(p.value, 100)}%` }} />
            </div>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid lg:grid-cols-3 gap-4">
        <div className="card p-5 lg:col-span-2">
          <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
            <h3 className="font-bold text-gray-800">{t('dashboard.earningsChart')}</h3>
            <div className="flex gap-1 flex-wrap">
              {RANGE_OPTIONS.map((r) => (
                <button
                  key={r}
                  onClick={() => setRange(r)}
                  className={`px-2.5 py-1 rounded-full text-xs font-semibold ${range === r ? 'bg-primary-600 text-white' : 'bg-purple-50 text-primary-700'}`}
                >
                  {t(`dashboard.range${r === '7d' ? '7d' : r === '30d' ? '30d' : r === '3m' ? '3m' : r === '6m' ? '6m' : r === '1y' ? '1y' : 'All'}`)}
                </button>
              ))}
            </div>
          </div>
          {earnings.length === 0 ? (
            <EmptyState title={t('dashboard.noActivity')} />
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={earnings}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f3f0ff" />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip formatter={(v) => formatCurrency(v)} />
                <Line type="monotone" dataKey="amount" stroke="#7c3aed" strokeWidth={3} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="card p-5">
          <h3 className="font-bold text-gray-800 mb-4">{t('dashboard.taskStatusChart')}</h3>
          {taskStatus.length === 0 ? (
            <EmptyState title={t('dashboard.noActivity')} />
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie data={taskStatus} dataKey="count" nameKey="status" cx="50%" cy="50%" innerRadius={55} outerRadius={85} paddingAngle={3}>
                  {taskStatus.map((_, i) => (
                    <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      <div className="card p-5">
        <h3 className="font-bold text-gray-800 mb-4">{t('dashboard.quantityChart')}</h3>
        {earnings.length === 0 ? (
          <EmptyState title={t('dashboard.noActivity')} />
        ) : (
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={earnings}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f3f0ff" />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Bar dataKey="quantity" fill="#f97316" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Recent activity */}
      <div className="card p-5">
        <h3 className="font-bold text-gray-800 mb-4">{t('dashboard.recentActivity')}</h3>
        {activity.length === 0 ? (
          <EmptyState title={t('dashboard.noActivity')} />
        ) : (
          <ul className="divide-y divide-purple-50">
            {activity.map((a, i) => (
              <li key={i} className="py-3 flex items-center justify-between gap-4">
                <span className="text-sm text-gray-600">{a.message}</span>
                <span className="text-xs text-gray-400 whitespace-nowrap">{formatDateLong(a.timestamp)}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
