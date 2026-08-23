import api from './axios';

export const authApi = {
  login: (data) => api.post('/auth/login', data),
  register: (data) => api.post('/auth/register', data),
  me: () => api.get('/auth/me'),
  updateMe: (data) => api.put('/auth/me', data),
  forgotPassword: (data) => api.post('/auth/forgot-password', data),
  resetPassword: (data) => api.post('/auth/reset-password', data),
};

export const masterApi = {
  list: (params) => api.get('/masters', { params }),
  get: (id) => api.get(`/masters/${id}`),
  create: (data) => api.post('/masters', data),
  update: (id, data) => api.put(`/masters/${id}`, data),
  remove: (id) => api.delete(`/masters/${id}`),
};

export const taskApi = {
  list: (params) => api.get('/tasks', { params }),
  get: (id) => api.get(`/tasks/${id}`),
  create: (data) => api.post('/tasks', data),
  update: (id, data) => api.put(`/tasks/${id}`, data),
  updateStatus: (id, status) => api.patch(`/tasks/${id}/status`, { status }),
  remove: (id) => api.delete(`/tasks/${id}`),
  days: (taskId) => api.get(`/tasks/${taskId}/days`),
  addDay: (taskId, data) => api.post(`/tasks/${taskId}/days`, data),
  updateDay: (taskId, dayId, data) => api.put(`/tasks/${taskId}/days/${dayId}`, data),
  deleteDay: (taskId, dayId) => api.delete(`/tasks/${taskId}/days/${dayId}`),
  payments: (taskId) => api.get(`/tasks/${taskId}/payments`),
  addPayment: (taskId, data) => api.post(`/tasks/${taskId}/payments`, data),
};

export const paymentApi = {
  update: (id, data) => api.put(`/payments/${id}`, data),
  remove: (id) => api.delete(`/payments/${id}`),
};

export const dashboardApi = {
  stats: () => api.get('/dashboard/stats'),
  earnings: (range) => api.get('/dashboard/earnings', { params: { range } }),
  quantity: () => api.get('/dashboard/quantity'),
  taskStatus: () => api.get('/dashboard/task-status'),
  paymentSummary: () => api.get('/dashboard/payment-summary'),
  recentActivity: () => api.get('/dashboard/recent-activity'),
};

export const reportApi = {
  task: (id) => api.get(`/reports/task/${id}`),
  daily: (params) => api.get('/reports/daily', { params }),
  monthly: (params) => api.get('/reports/monthly', { params }),
};
