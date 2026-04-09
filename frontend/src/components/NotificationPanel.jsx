import React, { useState, useEffect, useRef } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useWebSocket } from '../hooks/useWebSocket';
import notificationService from '../services/notificationService';
import {
  markAsRead,
  removeNotification,
  markMultipleAsRead,
} from '../redux/notificationSlice';
import './NotificationPanel.css';

export const NotificationPanel = () => {
  const dispatch = useDispatch();
  const { notifications, unreadCount, wsConnected } = useSelector(
    state => state.notifications
  );
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [bellShake, setBellShake] = useState(false);
  const prevUnreadCount = useRef(unreadCount);

  useWebSocket();

  // Shake bell animation when new notification arrives
  useEffect(() => {
    if (unreadCount > prevUnreadCount.current) {
      setBellShake(true);
      const timer = setTimeout(() => setBellShake(false), 1000);
      return () => clearTimeout(timer);
    }
    prevUnreadCount.current = unreadCount;
  }, [unreadCount]);

  const handleMarkAsRead = async (id) => {
    try {
      await notificationService.markAsRead(id, true);
      dispatch(markAsRead(id));
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      setIsLoading(true);
      await notificationService.markAllAsRead();
      dispatch(markMultipleAsRead());
    } catch (error) {
      console.error('Error marking all as read:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteNotification = async (id) => {
    try {
      await notificationService.deleteNotification(id);
      dispatch(removeNotification(id));
    } catch (error) {
      console.error('Error deleting notification:', error);
    }
  };

  const formatTime = (timestamp) => {
    try {
      const date = new Date(timestamp);
      const now = new Date();
      const diffMs = now - date;
      const diffMin = Math.floor(diffMs / 60000);
      const diffHour = Math.floor(diffMs / 3600000);

      if (diffMin < 1) return 'Şimdi';
      if (diffMin < 60) return `${diffMin} dk önce`;
      if (diffHour < 24) return `${diffHour} sa önce`;
      return date.toLocaleDateString('tr-TR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
    } catch {
      return 'Şimdi';
    }
  };

  const getChannelBadge = (channel) => {
    const badges = {
      email: { label: '📧', color: '#4CAF50' },
      sms: { label: '📱', color: '#2196F3' },
      whatsapp: { label: '💬', color: '#25D366' },
      voice: { label: '☎️', color: '#FF9800' },
      panel: { label: '🔔', color: '#9C27B0' },
    };
    return badges[channel] || { label: '🔔', color: '#9C27B0' };
  };

  const getStatusBadge = (status) => {
    const badges = {
      pending: { label: 'Bekliyor', color: '#FFC107' },
      sent: { label: 'Gönderildi', color: '#4CAF50' },
      failed: { label: 'Başarısız', color: '#F44336' },
      retrying: { label: 'Yeniden', color: '#FF9800' },
      acknowledged: { label: 'Onaylandı', color: '#2196F3' },
    };
    return badges[status] || { label: status, color: '#757575' };
  };

  return (
    <div className="notification-panel">
      {/* Notification Bell Icon */}
      <div
        className={`notification-bell ${bellShake ? 'bell-shake' : ''}`}
        onClick={() => setIsOpen(!isOpen)}
      >
        <span className="bell-icon">🔔</span>
        {unreadCount > 0 && (
          <span className="notification-badge">{unreadCount > 99 ? '99+' : unreadCount}</span>
        )}
        <div className={`connection-indicator ${wsConnected ? 'connected' : 'disconnected'}`}>
          {wsConnected ? '🟢' : '🔴'}
        </div>
      </div>

      {/* Notification Dropdown */}
      {isOpen && (
        <div className="notification-dropdown">
          <div className="notification-header">
            <h3>Bildirimler</h3>
            <div className="header-actions">
              {unreadCount > 0 && (
                <button
                  className="mark-all-btn"
                  onClick={handleMarkAllAsRead}
                  disabled={isLoading}
                >
                  {isLoading ? 'İşleniyor...' : 'Tümünü oku'}
                </button>
              )}
              <button
                className="close-btn"
                onClick={() => setIsOpen(false)}
              >
                ✕
              </button>
            </div>
          </div>

          <div className="notification-status">
            <span className={`status-indicator ${wsConnected ? 'connected' : 'disconnected'}`}>
              {wsConnected ? '🟢 Canlı' : '🔴 Çevrimdışı'}
            </span>
            <span className="unread-count">{unreadCount} okunmamış</span>
          </div>

          <div className="notification-list">
            {notifications.length === 0 ? (
              <div className="empty-state">
                <p>Henüz bildirim yok</p>
              </div>
            ) : (
              notifications.map(notif => (
                <div
                  key={notif.id}
                  className={`notification-item ${notif.is_read ? 'read' : 'unread'}`}
                >
                  <div className="notification-content">
                    <div className="notification-top">
                      <div className="notification-badges">
                        <span
                          className="channel-badge"
                          title={notif.channel}
                        >
                          {getChannelBadge(notif.channel).label}
                        </span>
                        <span
                          className="status-badge"
                          style={{
                            backgroundColor: getStatusBadge(notif.status).color,
                          }}
                        >
                          {getStatusBadge(notif.status).label}
                        </span>
                      </div>
                      <span className="notification-time">
                        {formatTime(notif.created_at)}
                      </span>
                    </div>

                    <p className="notification-message">
                      {notif.message || 'Sipariş bildirimi'}
                    </p>

                    {notif.order_id && (
                      <div className="notification-meta">
                        <small>Sipariş #{notif.order_id}</small>
                      </div>
                    )}
                  </div>

                  <div className="notification-actions">
                    {!notif.is_read && (
                      <button
                        className="action-btn read-btn"
                        onClick={() => handleMarkAsRead(notif.id)}
                        title="Okundu olarak işaretle"
                      >
                        ✓
                      </button>
                    )}
                    <button
                      className="action-btn delete-btn"
                      onClick={() => handleDeleteNotification(notif.id)}
                      title="Sil"
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="notification-footer">
            <small>{notifications.length} bildirim gösteriliyor</small>
          </div>
        </div>
      )}
    </div>
  );
};
