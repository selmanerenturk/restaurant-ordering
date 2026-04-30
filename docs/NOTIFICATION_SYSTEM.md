# Restaurant Ordering System - Notification System Documentation

## Overview

The notification system provides multi-channel alerting to restaurant administrators when orders are placed or status changes occur. It supports:
- **Email notifications** (primary)
- **SMS notifications** via Twilio
- **WhatsApp notifications** via Twilio
- **Voice notifications** (text-to-speech) via Twilio

The system is built with:
- FastAPI backend
- SQLAlchemy ORM for persistence
- Twilio for external communications
- WebSocket for real-time admin dashboard updates
- Background task processing

---

## Architecture

### Components

1. **Database Models** (`app/models/notification.py`)
   - `Notification`: Stores notification records (one per order event per channel)
   - `NotificationPreference`: Stores admin preferences and configuration
   - `NotificationChannel`: Enum for channel types (email, sms, whatsapp, voice)
   - `NotificationStatus`: Enum for delivery status (pending, sent, failed, retrying, acknowledged)

2. **Service Layer** (`app/services/notification_service.py`)
   - `NotificationService`: Handles sending via different channels
   - `NotificationManager`: Orchestrates notification creation and dispatch

3. **API Endpoints** (`app/api/v1/endpoints/notifications.py`)
   - List, view, and manage notifications
   - Update notification preferences
   - Test notifications

4. **CRUD Operations** (`app/db/CRUD/notifications.py`)
   - Database operations for notifications and preferences

5. **WebSocket Support** (`app/api/v1/endpoints/websocket.py`)
   - Real-time notification delivery to admin dashboard

---

## Setup Instructions

### Step 1: Install Dependencies

```bash
cd backend
pip install -r requirements.txt
```

Key new dependencies:
- `twilio==9.3.0` - For SMS/WhatsApp/Voice
- `python-multipart==0.0.6` - For form handling
- `aioredis==2.0.1` - For async operations
- `aiosmtplib==3.0.1` - For async email

### Step 2: Database Migration

The notification models will be automatically created when you run the database initialization:

```bash
python -c "from app.db.init_db import init_db; init_db()"
```

Or if using SQLAlchemy's native approach:
```bash
python
>>> from app.db.base import Base
>>> from app.db.session import engine
>>> Base.metadata.create_all(bind=engine)
```

### Step 3: Configure Environment Variables

Copy the example configuration file:
```bash
cp .env.notifications.example .env
```

Edit `.env` and fill in your settings. See the **Configuration** section below.

### Step 4: Set Notification Preferences

There are two ways to set notification preferences:

**Option A: API Request**
```bash
curl -X PATCH http://localhost:8000/api/v1/notifications/preferences/update \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <your-token>" \
  -d '{
    "admin_email": "admin@restaurant.com",
    "admin_phone": "+90555123456",
    "admin_whatsapp": "+90555123456",
    "enable_email": true,
    "enable_sms": false,
    "enable_whatsapp": false,
    "enable_voice": false,
    "notify_on_new_order": true,
    "notify_on_status_change": true,
    "notify_on_delivery_completed": true,
    "enable_quiet_hours": true,
    "quiet_hours_start": "22:00",
    "quiet_hours_end": "08:00"
  }'
```

**Option B: Database**
You can manually insert into the `notification_preferences` table:
```sql
INSERT INTO notification_preferences (
  admin_email, admin_phone, enable_email, enable_sms, 
  notify_on_new_order, enable_quiet_hours, quiet_hours_start, quiet_hours_end
) VALUES (
  'admin@restaurant.com', '+90555123456', true, false, true, true, '22:00', '08:00'
);
```

### Step 5: Test the Configuration

Send a test notification to verify everything works:
```bash
curl -X POST http://localhost:8000/api/v1/notifications/test-notification \
  -H "Authorization: Bearer <your-token>"
```

---

## Configuration

### Environment Variables

#### Email Configuration
```env
SHOP_OWNER_EMAIL=admin@restaurant.com
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USERNAME=your-email@gmail.com
SMTP_PASSWORD=your-app-password
SMTP_FROM_EMAIL=noreply@restaurant.com
```

**Gmail Setup:**
1. Enable 2-factor authentication
2. Generate an app password: https://support.google.com/accounts/answer/185833
3. Use that app password in `SMTP_PASSWORD`

#### Twilio Configuration (SMS/WhatsApp/Voice)
```env
TWILIO_ACCOUNT_SID=AC...
TWILIO_AUTH_TOKEN=...
TWILIO_PHONE_NUMBER=+1234567890      # For SMS and Voice
TWILIO_WHATSAPP_NUMBER=+1234567890   # For WhatsApp
```

**Twilio Setup:**
1. Create account at https://www.twilio.com/
2. Verify your phone number
3. Find Account SID and Auth Token in console
4. Purchase a Twilio phone number for SMS/Voice
5. Set up WhatsApp with Twilio (requires Twilio WhatsApp Business Account)

#### Feature Flags
```env
ENABLE_EMAIL_NOTIFICATIONS=true
ENABLE_SMS_NOTIFICATIONS=false       # Requires Twilio setup
ENABLE_WHATSAPP_NOTIFICATIONS=false  # Requires Twilio WhatsApp setup
ENABLE_VOICE_NOTIFICATIONS=false     # Requires Twilio setup

# Retry configuration
NOTIFICATION_RETRY_ATTEMPTS=3
NOTIFICATION_RETRY_DELAY_SECONDS=5
```

---

## API Reference

### Notification Endpoints

#### Get All Notifications
```
GET /api/v1/notifications/
Query Parameters:
  - order_id (int, optional): Filter by order
  - status (string, optional): pending, sent, failed, retrying, acknowledged
  - is_read (boolean, optional): Filter by read status
  - skip (int, default=0): Pagination offset
  - limit (int, default=50, max=200): Pagination limit
```

#### Get Unread Count
```
GET /api/v1/notifications/count/unread
Response: {"unread_count": 5}
```

#### Get Notification Details
```
GET /api/v1/notifications/{notification_id}
```

#### Mark Notification as Read
```
PATCH /api/v1/notifications/{notification_id}/read
Body: {"is_read": true}
```

#### Acknowledge Notification
```
PATCH /api/v1/notifications/{notification_id}/acknowledge
Body: {"is_acknowledged": true}
```

#### Mark All as Read
```
POST /api/v1/notifications/mark-all-read
```

#### Delete Notification
```
DELETE /api/v1/notifications/{notification_id}
```

### Preference Endpoints

#### Get Preferences
```
GET /api/v1/notifications/preferences/current
Response:
{
  "id": 1,
  "admin_email": "admin@restaurant.com",
  "admin_phone": "+90555123456",
  "enable_email": true,
  "enable_sms": false,
  "enable_whatsapp": false,
  "enable_voice": false,
  "notify_on_new_order": true,
  "notify_on_status_change": true,
  "notify_on_delivery_completed": true,
  "enable_quiet_hours": true,
  "quiet_hours_start": "22:00",
  "quiet_hours_end": "08:00"
}
```

#### Update Preferences
```
PATCH /api/v1/notifications/preferences/update
Body: (any combination of fields to update)
{
  "admin_email": "newemail@restaurant.com",
  "enable_sms": true,
  "quiet_hours_start": "23:00"
}
```

#### Send Test Notification
```
POST /api/v1/notifications/test-notification
Sends a test notification to the configured admin email
```

### WebSocket Endpoint

#### Connect to Real-Time Notifications
```
WS /ws/notifications

Messages:
- Send "ping" to get unread count
  Response: {"type": "pong", "unread_count": 3}

- Send "get_notifications" to fetch recent notifications
  Response: {
    "type": "notifications",
    "data": [
      {
        "id": 1,
        "order_id": 123,
        "channel": "email",
        "status": "sent",
        "message": "...",
        "created_at": "2024-03-30T10:30:00",
        "is_read": false
      }
    ]
  }
```

---

## How It Works

### 1. New Order Created
```
Customer places order
    ↓
Order created in database
    ↓
NotificationManager.notify_on_order_event() called with "new_order"
    ↓
Checks admin preferences and enabled channels
    ↓
Creates Notification records in DB (one per channel)
    ↓
Background task sends via each channel (with retry logic)
    ↓
Admin receives notifications via email, SMS, WhatsApp, or voice
```

### 2. Order Status Changed
```
Admin updates order status
    ↓
NotificationManager.notify_on_order_event() called with "status_change"
    ↓
Notification sent to admin via configured channels
```

### 3. Quiet Hours
If enabled, notifications won't be sent between specified hours (e.g., 10 PM to 8 AM).

### 4. Retry Logic
- Failed notifications are automatically retried
- Configurable retry attempts and delay
- Detailed error tracking in the database

---

## Database Schema

### Notifications Table
```sql
CREATE TABLE notifications (
    id INTEGER PRIMARY KEY,
    order_id INTEGER FOREIGN KEY,
    channel ENUM (email, sms, whatsapp, voice),
    status ENUM (pending, sent, failed, retrying, acknowledged),
    recipient VARCHAR,
    subject VARCHAR,
    message TEXT,
    sent_at DATETIME,
    created_at DATETIME,
    updated_at DATETIME,
    retry_count INTEGER,
    error_message TEXT,
    is_read BOOLEAN,
    is_acknowledged BOOLEAN,
    twilio_message_sid VARCHAR,
    twilio_call_sid VARCHAR
);
```

### Notification Preferences Table
```sql
CREATE TABLE notification_preferences (
    id INTEGER PRIMARY KEY,
    restaurant_id INTEGER UNIQUE,
    admin_email VARCHAR,
    admin_phone VARCHAR,
    admin_whatsapp VARCHAR,
    enable_email BOOLEAN,
    enable_sms BOOLEAN,
    enable_whatsapp BOOLEAN,
    enable_voice BOOLEAN,
    notify_on_new_order BOOLEAN,
    notify_on_status_change BOOLEAN,
    notify_on_delivery_completed BOOLEAN,
    enable_quiet_hours BOOLEAN,
    quiet_hours_start VARCHAR,
    quiet_hours_end VARCHAR,
    created_at DATETIME,
    updated_at DATETIME
);
```

---

## Frontend Integration (React)

### Redux Setup

Create a notification slice to manage notification state:

```javascript
// redux/notificationSlice.js
import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  notifications: [],
  unreadCount: 0,
  loading: false,
  error: null,
  wsConnected: false,
};

const notificationSlice = createSlice({
  name: 'notifications',
  initialState,
  reducers: {
    setNotifications: (state, action) => {
      state.notifications = action.payload;
    },
    addNotification: (state, action) => {
      state.notifications.unshift(action.payload);
      state.unreadCount += 1;
    },
    setUnreadCount: (state, action) => {
      state.unreadCount = action.payload;
    },
    markAsRead: (state, action) => {
      const notification = state.notifications.find(n => n.id === action.payload);
      if (notification && !notification.is_read) {
        notification.is_read = true;
        state.unreadCount -= 1;
      }
    },
    setWSConnected: (state, action) => {
      state.wsConnected = action.payload;
    },
  },
});

export default notificationSlice.reducer;
export const {
  setNotifications,
  addNotification,
  setUnreadCount,
  markAsRead,
  setWSConnected,
} = notificationSlice.actions;
```

### WebSocket Hook

```javascript
// hooks/useWebSocket.js
import { useEffect, useRef } from 'react';
import { useDispatch } from 'react-redux';
import {
  addNotification,
  setUnreadCount,
  setWSConnected,
} from '../redux/notificationSlice';

export const useWebSocket = () => {
  const dispatch = useDispatch();
  const ws = useRef(null);
  const reconnectAttempts = useRef(0);
  const maxReconnectAttempts = 5;

  useEffect(() => {
    const connectWebSocket = () => {
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      ws.current = new WebSocket(
        `${protocol}//${window.location.host}/ws/notifications`
      );

      ws.current.onopen = () => {
        dispatch(setWSConnected(true));
        reconnectAttempts.current = 0;
        console.log('WebSocket connected');

        // Request initial unread count
        ws.current.send('ping');

        // Send ping every 30 seconds to keep connection alive
        setInterval(() => {
          if (ws.current?.readyState === WebSocket.OPEN) {
            ws.current.send('ping');
          }
        }, 30000);
      };

      ws.current.onmessage = (event) => {
        const data = JSON.parse(event.data);

        if (data.type === 'pong') {
          dispatch(setUnreadCount(data.unread_count));
        } else if (data.type === 'notification') {
          dispatch(addNotification(data));
        } else if (data.type === 'notifications') {
          // Bulk update
          data.data.forEach(notif => {
            dispatch(addNotification(notif));
          });
        }
      };

      ws.current.onerror = (error) => {
        console.error('WebSocket error:', error);
        dispatch(setWSConnected(false));
      };

      ws.current.onclose = () => {
        dispatch(setWSConnected(false));
        
        // Attempt to reconnect
        if (reconnectAttempts.current < maxReconnectAttempts) {
          reconnectAttempts.current += 1;
          const delay = Math.min(1000 * Math.pow(2, reconnectAttempts.current), 30000);
          setTimeout(connectWebSocket, delay);
        }
      };
    };

    connectWebSocket();

    return () => {
      if (ws.current) {
        ws.current.close();
      }
    };
  }, [dispatch]);

  return ws;
};
```

### Notification Component

```javascript
// components/NotificationPanel.jsx
import React, { useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useWebSocket } from '../hooks/useWebSocket';
import notificationService from '../services/notificationService';

export const NotificationPanel = () => {
  const dispatch = useDispatch();
  const { notifications, unreadCount, wsConnected } = useSelector(
    state => state.notifications
  );
  useWebSocket();

  const handleMarkAsRead = async (id) => {
    try {
      await notificationService.markAsRead(id, true);
      dispatch(markAsRead(id));
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  return (
    <div className="notification-panel">
      <div className="notification-header">
        <h3>Notifications ({unreadCount})</h3>
        <div className={`status ${wsConnected ? 'connected' : 'disconnected'}`}>
          {wsConnected ? '🟢 Live' : '🔴 Offline'}
        </div>
      </div>
      
      <div className="notification-list">
        {notifications.map(notif => (
          <div
            key={notif.id}
            className={`notification-item ${notif.is_read ? 'read' : 'unread'}`}
          >
            <div className="notification-content">
              <p className="notification-message">{notif.message}</p>
              <span className="notification-time">
                {new Date(notif.created_at).toLocaleTimeString()}
              </span>
            </div>
            {!notif.is_read && (
              <button onClick={() => handleMarkAsRead(notif.id)}>
                Mark as Read
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
```

### Notification Service

```javascript
// services/notificationService.js
import api from '../config/api';

const notificationService = {
  getNotifications: (params = {}) =>
    api.get('/notifications/', { params }),

  getUnreadCount: () =>
    api.get('/notifications/count/unread'),

  getNotification: (id) =>
    api.get(`/notifications/${id}`),

  markAsRead: (id, isRead) =>
    api.patch(`/notifications/${id}/read`, { is_read: isRead }),

  acknowledgeNotification: (id, isAcknowledged) =>
    api.patch(`/notifications/${id}/acknowledge`, { is_acknowledged: isAcknowledged }),

  markAllAsRead: () =>
    api.post('/notifications/mark-all-read'),

  deleteNotification: (id) =>
    api.delete(`/notifications/${id}`),

  getPreferences: () =>
    api.get('/notifications/preferences/current'),

  updatePreferences: (preferences) =>
    api.patch('/notifications/preferences/update', preferences),

  testNotification: () =>
    api.post('/notifications/test-notification'),
};

export default notificationService;
```

---

## Troubleshooting

### Email notifications not working
1. Check SMTP settings in `.env`
2. Verify Gmail app password (not account password)
3. Check email logs in `notification_preferences` table
4. Test with: `curl -X POST http://localhost:8000/api/v1/notifications/test-notification`

### Twilio SMS/WhatsApp/Voice not working
1. Verify Account SID and Auth Token are correct
2. Ensure phone numbers are in E.164 format: `+[country][number]`
3. Check Twilio console for failed messages
4. Verify Twilio account has sufficient credit
5. For WhatsApp, ensure you've set up WhatsApp Business Account

### WebSocket not connecting
1. Check that WebSocket URL is correct
2. Verify firewall allows WebSocket connections
3. Check browser console for connection errors
4. Ensure FastAPI is running with WebSocket support

### Notifications not being sent
1. Check `notification_preferences` table - ensure at least one preference exists
2. Verify quiet hours settings
3. Check error messages in `notifications` table
4. Enable feature flag: `ENABLE_EMAIL_NOTIFICATIONS=true`

---

## Performance Considerations

1. **Retry Logic**: Failed notifications are queued for retry with exponential backoff
2. **Background Tasks**: Uses FastAPI's BackgroundTasks for async processing
3. **Database Indexing**: Consider indexing on `order_id`, `status`, `created_at`
4. **Quiet Hours**: Prevents notification spam during off-hours
5. **Connection Pooling**: Use `aioredis` for better async performance

---

## Security Considerations

1. **Credentials**: Store Twilio/SMTP credentials in `.env` (never in code)
2. **Authentication**: All notification endpoints require seller authentication
3. **Input Validation**: Phone numbers and emails are validated
4. **Error Handling**: Sensitive errors are logged but not exposed to client
5. **Rate Limiting**: Consider adding rate limits to prevent notification abuse

---

## Future Enhancements

1. **Notification Templates**: Create reusable message templates
2. **Notification Scheduling**: Schedule notifications for specific times
3. **Analytics**: Track delivery rates and admin engagement
4. **Push Notifications**: Add browser/mobile push notifications
5. **Multi-Language**: Support notification templates in multiple languages
6. **Admin Acknowledgments**: Track when admin acknowledges critical orders
7. **Telegram Integration**: Add Telegram bot notifications
8. **Webhook Support**: Send notifications to external systems

---

## Support

For issues or questions about the notification system:
1. Check the troubleshooting section above
2. Review logs in the database
3. Test with the `/test-notification` endpoint
4. Contact the development team with error messages from the database

