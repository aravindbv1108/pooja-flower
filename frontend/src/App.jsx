import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import ProtectedRoute from './routes/ProtectedRoute';
import DashboardLayout from './components/layout/DashboardLayout';

import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Masters from './pages/Masters';
import CreateTask from './pages/CreateTask';
import ActiveTasks from './pages/ActiveTasks';
import CompletedTasks from './pages/CompletedTasks';
import TaskDetail from './pages/TaskDetail';
import Payments from './pages/Payments';
import Reports from './pages/Reports';
import Settings from './pages/Settings';

const RootRedirect = () => {
  const { user, loading } = useAuth();
  if (loading) return null;
  return <Navigate to={user ? '/dashboard' : '/login'} replace />;
};

function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />

            <Route
              element={
                <ProtectedRoute>
                  <TitledLayoutSwitcher />
                </ProtectedRoute>
              }
            >
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/masters" element={<Masters />} />
              <Route path="/tasks/create" element={<CreateTask />} />
              <Route path="/tasks" element={<ActiveTasks />} />
              <Route path="/tasks/:id" element={<TaskDetail />} />
              <Route path="/completed-tasks" element={<CompletedTasks />} />
              <Route path="/payments" element={<Payments />} />
              <Route path="/reports" element={<Reports />} />
              <Route path="/settings" element={<Settings />} />
            </Route>

            <Route path="/" element={<RootRedirect />} />
            <Route path="*" element={<RootRedirect />} />
          </Routes>
        </BrowserRouter>
      </ToastProvider>
    </AuthProvider>
  );
}

// Picks a page title based on current route for the shared layout header
const TitledLayoutSwitcher = () => {
  const { t } = useTranslation();
  const location = useLocation();
  const titleMap = {
    '/dashboard': 'dashboard.title',
    '/masters': 'masters.title',
    '/tasks/create': 'tasks.createTitle',
    '/tasks': 'tasks.activeTasksTitle',
    '/completed-tasks': 'tasks.completedTasksTitle',
    '/payments': 'payments.title',
    '/reports': 'reports.title',
    '/settings': 'settings.title',
  };
  const key = titleMap[location.pathname] || (location.pathname.startsWith('/tasks/') ? 'tasks.taskDetails' : 'dashboard.title');

  return <DashboardLayout title={t(key)} />;
};

export default App;
