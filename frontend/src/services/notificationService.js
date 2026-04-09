import api from '../config/api';

const notificationService = {
  // Notification endpoints
  getNotifications: (params = {}) =>
    api.get('/notifications/', { params }),

  getUnreadCount: () =>
    api.get('/notifications/count/unread'),

  getNotification: (id) =>
    api.get(`/notifications/${id}`),

  markAsRead: (id, isRead = true) =>
    api.patch(`/notifications/${id}/read`, { is_read: isRead }),

  acknowledgeNotification: (id, isAcknowledged = true) =>
    api.patch(`/notifications/${id}/acknowledge`, { is_acknowledged: isAcknowledged }),

  markAllAsRead: () =>
    api.post('/notifications/mark-all-read'),

  deleteNotification: (id) =>
    api.delete(`/notifications/${id}`),

  // Preference endpoints
  getPreferences: () =>
    api.get('/notifications/preferences/current'),

  updatePreferences: (preferences) =>
    api.patch('/notifications/preferences/update', preferences),

  // Testing
  testNotification: () =>
    api.post('/notifications/test-notification'),
};

export default notificationService;

