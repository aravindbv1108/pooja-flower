import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { ListChecks, Search } from 'lucide-react';
import { taskApi } from '../api/services';
import TaskCard from '../components/common/TaskCard';
import Loader from '../components/common/Loader';
import EmptyState from '../components/common/EmptyState';

const ActiveTasks = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [tasks, setTasks] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    const res = await taskApi.list({ status: 'ACTIVE', search });
    setTasks(res.data.data);
    setLoading(false);
  };

  useEffect(() => {
    const timer = setTimeout(load, 300);
    return () => clearTimeout(timer);
    // eslint-disable-next-line
  }, [search]);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-bold text-gray-800">{t('tasks.activeTasksTitle')}</h2>
        <div className="relative">
          <Search className="absolute left-3.5 top-3 text-gray-400" size={18} />
          <input className="input-field pl-11" placeholder={t('common.search')} value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
      </div>

      {loading ? (
        <Loader />
      ) : tasks.length === 0 ? (
        <EmptyState icon={ListChecks} title={t('tasks.noActiveTasks')} actionLabel={t('tasks.createFirstTask')} onAction={() => navigate('/tasks/create')} />
      ) : (
        <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {tasks.map((task) => <TaskCard key={task._id} task={task} />)}
        </div>
      )}
    </div>
  );
};

export default ActiveTasks;
