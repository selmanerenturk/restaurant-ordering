import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  notifications: [],
  unreadCount: 0,
  loading: false,
  error: null,
  wsConnected: false,
  preferences: {
    admin_email: '',
    admin_phone: '',
    admin_whatsapp: '',
    enable_email: true,
    enable_sms: false,
    enable_whatsapp: false,
    enable_voice: false,
    notify_on_new_order: true,
    notify_on_status_change: true,
    notify_on_delivery_completed: true,
    enable_quiet_hours: true,
    quiet_hours_start: '22:00',
    quiet_hours_end: '08:00',
  },
};

const notificationSlice = createSlice({
  name: 'notifications',
  initialState,
  reducers: {
    setNotifications: (state, action) => {
      state.notifications = action.payload;
    },
    addNotification: (state, action) => {
      // Avoid duplicates
      const exists = state.notifications.some(n => n.id === action.payload.id);
      if (!exists) {
        state.notifications.unshift(action.payload);
        if (!action.payload.is_read) {
          state.unreadCount += 1;
        }
      }
    },
    setUnreadCount: (state, action) => {
      state.unreadCount = action.payload;
    },
    markAsRead: (state, action) => {
      const notification = state.notifications.find(n => n.id === action.payload);
      if (notification && !notification.is_read) {
        notification.is_read = true;
        state.unreadCount = Math.max(0, state.unreadCount - 1);
      }
    },
    markMultipleAsRead: (state, action) => {
      // Mark all as read
      state.notifications.forEach(n => {
        if (!n.is_read) {
          n.is_read = true;
        }
      });
      state.unreadCount = 0;
    },
    removeNotification: (state, action) => {
      const notification = state.notifications.find(n => n.id === action.payload);
      if (notification && !notification.is_read) {
        state.unreadCount = Math.max(0, state.unreadCount - 1);
      }
      state.notifications = state.notifications.filter(n => n.id !== action.payload);
    },
    setWSConnected: (state, action) => {
      state.wsConnected = action.payload;
    },
    setLoading: (state, action) => {
      state.loading = action.payload;
    },
    setError: (state, action) => {
      state.error = action.payload;
    },
    setPreferences: (state, action) => {
      state.preferences = action.payload;
    },
    clearNotifications: (state) => {
      state.notifications = [];
      state.unreadCount = 0;
    },
  },
});

export default notificationSlice.reducer;
export const {
  setNotifications,
  addNotification,
  setUnreadCount,
  markAsRead,
  markMultipleAsRead,
  removeNotification,
  setWSConnected,
  setLoading,
  setError,
  setPreferences,
  clearNotifications,
} = notificationSlice.actions;

