import { NavLink } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  LayoutDashboard, Flower2, PlusCircle, ListChecks, CheckCircle2,
  Wallet, FileBarChart, Settings, X,
} from 'lucide-react';

const navItems = [
  { to: '/dashboard', icon: LayoutDashboard, key: 'dashboard' },
  { to: '/masters', icon: Flower2, key: 'masters' },
  { to: '/tasks/create', icon: PlusCircle, key: 'createTask' },
  { to: '/tasks', icon: ListChecks, key: 'activeTasks' },
  { to: '/completed-tasks', icon: CheckCircle2, key: 'completedTasks' },
  { to: '/payments', icon: Wallet, key: 'payments' },
  { to: '/reports', icon: FileBarChart, key: 'reports' },
  { to: '/settings', icon: Settings, key: 'settings' },
];

const Sidebar = ({ mobileOpen, onClose }) => {
  const { t } = useTranslation();

  const content = (
    <div className="flex flex-col h-full">
      <div className="px-6 py-6 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-2xl">🌸</span>
          <div>
            <p className="font-extrabold text-primary-800 leading-tight">{t('appName')}</p>
            <p className="text-[11px] text-gray-400 leading-tight">{t('tagline')}</p>
          </div>
        </div>
        <button className="lg:hidden text-gray-400" onClick={onClose}>
          <X size={22} />
        </button>
      </div>

      <nav className="flex-1 px-3 space-y-1 overflow-y-auto">
        {navItems.map(({ to, icon: Icon, key }) => (
          <NavLink
            key={to}
            to={to}
            onClick={onClose}
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-colors duration-150 ${
                isActive ? 'bg-primary-600 text-white shadow-card' : 'text-gray-600 hover:bg-purple-50'
              }`
            }
          >
            <Icon size={19} />
            {t(`nav.${key}`)}
          </NavLink>
        ))}
      </nav>

      <div className="p-4 text-center text-[11px] text-gray-300">🌸 Pooja Flower v1.0</div>
    </div>
  );

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex lg:flex-col w-64 shrink-0 bg-white border-r border-purple-50 h-screen sticky top-0">
        {content}
      </aside>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-black/40" onClick={onClose} />
          <aside className="absolute left-0 top-0 h-full w-72 bg-white shadow-cardHover">{content}</aside>
        </div>
      )}
    </>
  );
};

export default Sidebar;
