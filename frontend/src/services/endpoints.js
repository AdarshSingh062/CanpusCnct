import api from './api';

// Thin wrappers around every backend route the frontend uses.
// Keeping these here (rather than scattering api.get calls through components)
// means the UI never needs to know exact URL shapes.

export const authApi = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  logout: () => api.post('/auth/logout'),
  me: () => api.get('/auth/me'),
  forgotPassword: (email) => api.post('/auth/forgot-password', { email }),
  resetPassword: (token, password) => api.put(`/auth/reset-password/${token}`, { password }),
  updateProfile: (data) => api.put('/auth/profile', data),
};

export const dashboardApi = {
  get: () => api.get('/dashboard'),
};

export const postsApi = {
  list: (params) => api.get('/posts', { params }),
  create: (formData) => api.post('/posts', formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
  update: (id, data) => api.put(`/posts/${id}`, data),
  remove: (id) => api.delete(`/posts/${id}`),
  like: (id) => api.post(`/posts/${id}/like`),
  comment: (id, text) => api.post(`/posts/${id}/comments`, { text }),
  comments: (id) => api.get(`/posts/${id}/comments`),
  share: (id) => api.post(`/posts/${id}/share`),
  report: (id, reason) => api.post(`/posts/${id}/report`, { reason }),
};

export const complaintsApi = {
  list: (params) => api.get('/complaints', { params }),
  get: (id) => api.get(`/complaints/${id}`),
  create: (formData) => api.post('/complaints', formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
  updateStatus: (id, data) => api.put(`/complaints/${id}/status`, data),
  overridePriority: (id, priority) => api.put(`/complaints/${id}/priority`, { priority }),
  comment: (id, text) => api.post(`/complaints/${id}/comments`, { text }),
};

export const eventsApi = {
  list: (params) => api.get('/events', { params }),
  get: (id) => api.get(`/events/${id}`),
  create: (formData) => api.post('/events', formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
  cancel: (id) => api.delete(`/events/${id}`),
  register: (id) => api.post(`/events/${id}/register`),
  cancelRegistration: (id) => api.delete(`/events/${id}/register`),
  registrations: (id) => api.get(`/events/${id}/registrations`),
};

export const clubsApi = {
  list: (params) => api.get('/clubs', { params }),
  get: (id) => api.get(`/clubs/${id}`),
  create: (formData) => api.post('/clubs', formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
  join: (id) => api.post(`/clubs/${id}/join`),
  decideMembership: (id, memberId, decision) => api.put(`/clubs/${id}/members/${memberId}`, { decision }),
  announce: (id, data) => api.post(`/clubs/${id}/announcements`, data),
};

export const lostFoundApi = {
  list: (params) => api.get('/lost-found', { params }),
  get: (id) => api.get(`/lost-found/${id}`),
  create: (formData) => api.post('/lost-found', formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
  markFound: (id) => api.put(`/lost-found/${id}/mark-found`),
  claim: (id) => api.put(`/lost-found/${id}/claim`),
  resolve: (id) => api.put(`/lost-found/${id}/resolve`),
};

export const resourcesApi = {
  list: (params) => api.get('/resources', { params }),
  get: (id) => api.get(`/resources/${id}`),
  upload: (formData) => api.post('/resources', formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
  download: (id) => api.get(`/resources/${id}/download`),
  rate: (id, value) => api.post(`/resources/${id}/rate`, { value }),
  bookmark: (id) => api.post(`/resources/${id}/bookmark`),
};

export const marketplaceApi = {
  list: (params) => api.get('/marketplace', { params }),
  get: (id) => api.get(`/marketplace/${id}`),
  create: (formData) => api.post('/marketplace', formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
  update: (id, data) => api.put(`/marketplace/${id}`, data),
  remove: (id) => api.delete(`/marketplace/${id}`),
  contact: (id) => api.post(`/marketplace/${id}/contact`),
};

export const opportunitiesApi = {
  list: (params) => api.get('/opportunities', { params }),
  get: (id) => api.get(`/opportunities/${id}`),
  create: (data) => api.post('/opportunities', data),
  bookmark: (id) => api.post(`/opportunities/${id}/bookmark`),
  saved: () => api.get('/opportunities/saved/me'),
};

export const chatApi = {
  conversations: () => api.get('/chat/conversations'),
  startConversation: (userId) => api.post('/chat/conversations', { userId }),
  messages: (conversationId, params) => api.get(`/chat/conversations/${conversationId}/messages`, { params }),
};

export const notificationsApi = {
  list: (params) => api.get('/notifications', { params }),
  markRead: (id) => api.put(`/notifications/${id}/read`),
  markAllRead: () => api.put('/notifications/read-all'),
};

export const adminApi = {
  overview: () => api.get('/admin/analytics/overview'),
  userGrowth: () => api.get('/admin/analytics/user-growth'),
  complaintTrends: () => api.get('/admin/analytics/complaint-trends'),
  eventStats: () => api.get('/admin/analytics/event-stats'),
  popularCategories: () => api.get('/admin/analytics/popular-categories'),
  lostFoundStats: () => api.get('/admin/analytics/lost-found-stats'),
  marketplaceStats: () => api.get('/admin/analytics/marketplace-stats'),
  reports: (params) => api.get('/admin/reports', { params }),
  resolveReport: (id, data) => api.put(`/admin/reports/${id}`, data),
  activityLog: (params) => api.get('/admin/activity-log', { params }),
};

export const usersApi = {
  list: (params) => api.get('/users', { params }),
  get: (id) => api.get(`/users/${id}`),
  update: (id, data) => api.put(`/users/${id}`, data),
  suspend: (id, suspend, reason) => api.put(`/users/${id}/suspend`, { suspend, reason }),
};

export const searchApi = {
  global: (q, types) => api.get('/search', { params: { q, types } }),
};
