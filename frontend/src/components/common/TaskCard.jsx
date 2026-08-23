import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { formatCurrency, formatDate } from '../../utils/format';

const statusColors = {
  ACTIVE: 'bg-primary-50 text-primary-700',
  COMPLETED: 'bg-green-50 text-green-600',
  CANCELLED: 'bg-red-50 text-red-600',
  ARCHIVED: 'bg-gray-100 text-gray-500',
  DRAFT: 'bg-amber-50 text-amber-600',
};

const TaskCard = ({ task }) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const progress = task.totalDays ? Math.round((task.completedDays / task.totalDays) * 100) : 0;
  const remaining = Math.max(task.totalDays - task.completedDays - task.missedDays, 0);

  return (
    <button onClick={() => navigate(`/tasks/${task._id}`)} className="card p-5 text-left w-full">
      <div className="flex items-start justify-between mb-2">
        <div>
          <p className="font-bold text-gray-800">{task.masterNameSnapshot}</p>
          <p className="text-xs text-gray-400">{task.taskName}</p>
        </div>
        <span className={`badge ${statusColors[task.status]}`}>{task.status}</span>
      </div>

      <p className="text-xs text-gray-400 mb-3">{formatDate(task.startDate)} → {formatDate(task.endDate)}</p>

      <div className="mb-3">
        <div className="flex justify-between text-xs mb-1">
          <span className="text-gray-500">{t('tasks.progress')}</span>
          <span className="font-semibold text-gray-700">{progress}%</span>
        </div>
        <div className="h-2 rounded-full bg-purple-50 overflow-hidden">
          <div className="h-full bg-primary-600 rounded-full" style={{ width: `${progress}%` }} />
        </div>
      </div>

      <div className="grid grid-cols-4 gap-2 text-center text-xs mb-3">
        <div><p className="font-bold text-green-600">{task.completedDays}</p><p className="text-gray-400">{t('tasks.completed')}</p></div>
        <div><p className="font-bold text-red-500">{task.missedDays}</p><p className="text-gray-400">{t('tasks.missed')}</p></div>
        <div><p className="font-bold text-amber-500">{remaining}</p><p className="text-gray-400">{t('tasks.remaining')}</p></div>
        <div><p className="font-bold text-gray-700">{task.totalDays}</p><p className="text-gray-400">{t('tasks.totalDays')}</p></div>
      </div>

      <div className="flex justify-between text-sm pt-3 border-t border-purple-50">
        <div><p className="text-gray-400 text-xs">{t('tasks.totalEarned')}</p><p className="font-bold text-gray-800">{formatCurrency(task.totalAmount)}</p></div>
        <div><p className="text-gray-400 text-xs">{t('tasks.paid')}</p><p className="font-bold text-green-600">{formatCurrency(task.totalPaid)}</p></div>
        <div><p className="text-gray-400 text-xs">{t('tasks.pending')}</p><p className="font-bold text-amber-600">{formatCurrency(task.pendingAmount)}</p></div>
      </div>
    </button>
  );
};

export default TaskCard;
