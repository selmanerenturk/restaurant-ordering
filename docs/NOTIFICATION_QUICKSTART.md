# Notification System - Quick Start Guide

## Overview

This guide will help you get the restaurant ordering notification system up and running in just a few steps.

## What's Included

- ✅ **Email Notifications** - Send order alerts via email
- ✅ **SMS Notifications** - Send alerts via SMS (Twilio)
- ✅ **WhatsApp Notifications** - Send alerts via WhatsApp (Twilio)
- ✅ **Voice Notifications** - Send alerts via voice calls (Twilio)
- ✅ **Real-time Dashboard Updates** - WebSocket-based live notifications
- ✅ **Admin Settings Panel** - Configure preferences via UI
- ✅ **Notification History** - Track all notifications
- ✅ **Quiet Hours** - No notifications during off-hours

---

## Installation Steps

### 1. Update Dependencies

```bash
cd backend
pip install -r requirements.txt
```

### 2. Configure Environment Variables

Create/update your `.env` file in the backend directory:

```bash
# Email (Primary - Always use this)
SHOP_OWNER_EMAIL=your-admin@restaurant.com
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USERNAME=your-email@gmail.com
SMTP_PASSWORD=your-app-password
SMTP_FROM_EMAIL=noreply@restaurant.com

# Twilio (Optional - for SMS/WhatsApp/Voice)
TWILIO_ACCOUNT_SID=your-account-sid
TWILIO_AUTH_TOKEN=your-auth-token
TWILIO_PHONE_NUMBER=+1234567890
TWILIO_WHATSAPP_NUMBER=+1234567890

# Feature Flags
ENABLE_EMAIL_NOTIFICATIONS=True
ENABLE_SMS_NOTIFICATIONS=False
ENABLE_WHATSAPP_NOTIFICATIONS=False
ENABLE_VOICE_NOTIFICATIONS=False
```

### 3. Initialize Database Tables

```bash
# Option 1: Using Python shell
python
>>> from app.db.base import Base
>>> from app.db.session import engine
>>> from app import models  # Import models to register them
>>> Base.metadata.create_all(bind=engine)
>>> exit()

# Option 2: Using existing init script
python -c "from app.db.init_db import init_db; init_db()"
```

### 4. Start Backend Server

```bash
python -m uvicorn app.main:app --reload
```

The API will be available at: `http://localhost:8000`
Swagger docs: `http://localhost:8000/docs`

### 5. Update Frontend (React)

First, update the Redux store to include the notification reducer:

**File: `frontend/src/redux/store.js`**
```javascript
import { configureStore } from '@reduxjs/toolkit';
import notificationReducer from './notificationSlice';
// ...other imports

export const store = configureStore({
  reducer: {
    // ...other reducers
    notifications: notificationReducer,
  },
});
```

### 6. Add NotificationPanel to Header

Add the notification bell to your main layout/header:

**File: `frontend/src/components/Header.jsx` (or similar)**
```javascript
import { NotificationPanel } from './NotificationPanel';

export const Header = () => {
  return (
    <header className="header">
      {/* Your existing header content */}
      
      {/* Add notification panel to the right side */}
      <div style={{ marginLeft: 'auto' }}>
        <NotificationPanel />
      </div>
    </header>
  );
};
```

### 7. Update Admin Dashboard

Add a settings link to the admin dashboard to access notification preferences:

**File: `frontend/src/pages/SellerDashboard.jsx`**
```javascript
import { NotificationSettings } from './NotificationSettings';

// Add a navigation item or route:
<Link to="/admin/notification-settings">Notification Settings ⚙️</Link>
```

---

## Configuration Guide

### Gmail Setup (Email Notifications)

1. Go to https://myaccount.google.com/
2. Enable 2-factor authentication
3. Generate app password: https://support.google.com/accounts/answer/185833
4. Use the generated password in `.env`:
   ```
   SMTP_USERNAME=your-email@gmail.com
   SMTP_PASSWORD=xxxx xxxx xxxx xxxx  (16 characters)
   ```

### Twilio Setup (SMS/WhatsApp/Voice)

1. Sign up at https://www.twilio.com/
2. Verify your phone number
3. Get your Account SID and Auth Token from the console
4. Buy a Twilio phone number (US/International)
5. For WhatsApp: Set up WhatsApp Business Account through Twilio
6. Add credentials to `.env`

---

## Usage

### Via API

#### Get Notifications
```bash
curl -X GET http://localhost:8000/api/v1/notifications/ \
  -H "Authorization: Bearer <your-token>"
```

#### Get Unread Count
```bash
curl -X GET http://localhost:8000/api/v1/notifications/count/unread \
  -H "Authorization: Bearer <your-token>"
```

#### Mark Notification as Read
```bash
curl -X PATCH http://localhost:8000/api/v1/notifications/1/read \
  -H "Authorization: Bearer <your-token>" \
  -H "Content-Type: application/json" \
  -d '{"is_read": true}'
```

#### Get/Update Preferences
```bash
# Get current preferences
curl -X GET http://localhost:8000/api/v1/notifications/preferences/current \
  -H "Authorization: Bearer <your-token>"

# Update preferences
curl -X PATCH http://localhost:8000/api/v1/notifications/preferences/update \
  -H "Authorization: Bearer <your-token>" \
  -H "Content-Type: application/json" \
  -d '{
    "admin_email": "new@email.com",
    "enable_sms": true,
    "quiet_hours_start": "23:00"
  }'
```

#### Send Test Notification
```bash
curl -X POST http://localhost:8000/api/v1/notifications/test-notification \
  -H "Authorization: Bearer <your-token>"
```

### Via Admin Dashboard

1. **View Notifications**: Click the 🔔 bell icon in the header
2. **Manage Preferences**: Go to Notification Settings
3. **Test Configuration**: Click "Send Test Notification"
4. **View History**: See all past notifications

---

## How Notifications Are Triggered

### New Order
When a customer places an order:
1. Order is created in the database
2. Notification preferences are checked
3. Notification records are created for enabled channels
4. Background tasks send notifications asynchronously
5. Admin sees notification in real-time via WebSocket

### Order Status Changed
When admin updates order status:
1. Order status is updated
2. Notification is triggered automatically
3. Admin notification is sent based on preferences

---

## Troubleshooting

### Email notifications not sending

**Check email credentials:**
```bash
# Test SMTP connection
python -c "
import smtplib
server = smtplib.SMTP('smtp.gmail.com', 587)
server.starttls()
server.login('your-email@gmail.com', 'your-app-password')
print('✓ Email configured correctly')
"
```

**Check database:**
```sql
-- View notification attempts
SELECT id, recipient, status, error_message, created_at 
FROM notifications 
ORDER BY created_at DESC 
LIMIT 10;
```

### SMS/WhatsApp not working

**Verify Twilio setup:**
1. Check Account SID and Auth Token are correct
2. Ensure phone numbers include country code: `+90555123456`
3. Verify Twilio account has sufficient balance
4. Check Twilio console for error logs

### WebSocket not connecting

**Check browser console:**
- Open DevTools (F12)
- Check Console tab for WebSocket errors
- Verify WebSocket URL: `ws://localhost:8000/ws/notifications`

**Check backend logs:**
```bash
# Look for WebSocket connection logs
# Should see: "✓ WebSocket connected"
```

### Preferences not saving

1. Verify you're authenticated (valid JWT token)
2. Check admin email is valid
3. Verify phone numbers include country code if SMS enabled
4. Check browser console for API errors

---

## Testing Checklist

- [ ] Backend server starts without errors
- [ ] Database tables created successfully
- [ ] Email credentials configured in `.env`
- [ ] Admin email is valid
- [ ] Frontend starts without errors
- [ ] NotificationPanel component appears in header
- [ ] WebSocket connection shows "🟢 Live"
- [ ] Test notification sends successfully
- [ ] Notification appears in the panel
- [ ] Can mark notification as read
- [ ] Can delete notification
- [ ] Notification Settings page loads
- [ ] Can update preferences
- [ ] Quiet hours work (disable between times)

---

## File Structure

```
backend/
├── app/
│   ├── api/v1/
│   │   ├── endpoints/
│   │   │   ├── notifications.py      ← API endpoints
│   │   │   ├── websocket.py          ← WebSocket endpoint
│   │   │   └── orders.py             ← Updated to trigger notifications
│   │   └── router.py                 ← Updated to include notifications
│   ├── db/
│   │   ├── CRUD/
│   │   │   └── notifications.py      ← Database operations
│   │   └── base.py
│   ├── models/
│   │   ├── notification.py           ← Database models
│   │   └── __init__.py               ← Updated imports
│   ├── schemas/
│   │   └── notification.py           ← API schemas
│   ├── services/
│   │   └── notification_service.py   ← Business logic
│   └── core/
│       └── config.py                 ← Updated settings
├── requirements.txt                  ← Updated dependencies
└── .env.notifications.example        ← Environment template

frontend/
├── src/
│   ├── components/
│   │   ├── NotificationPanel.jsx     ← Bell icon & dropdown
│   │   └── NotificationPanel.css
│   ├── pages/
│   │   ├── NotificationSettings.jsx  ← Settings page
│   │   └── NotificationSettings.css
│   ├── services/
│   │   └── notificationService.js    ← API calls
│   ├── hooks/
│   │   └── useWebSocket.js           ← Real-time connection
│   └── redux/
│       ├── notificationSlice.js      ← State management
│       └── store.js                  ← Updated store
└── docs/
    └── NOTIFICATION_SYSTEM.md        ← Full documentation
```

---

## Next Steps

1. **Test with real orders**: Place test orders and verify notifications
2. **Monitor performance**: Check notification delivery rates
3. **Scale to Twilio**: When ready, enable SMS/WhatsApp/Voice
4. **Add analytics**: Track which channels are most effective
5. **Customize messages**: Edit notification templates in `notification_service.py`
6. **Add more channels**: Telegram, Slack, etc.

---

## Support & Documentation

- **Full Documentation**: See `docs/NOTIFICATION_SYSTEM.md`
- **API Reference**: Access Swagger docs at `http://localhost:8000/docs`
- **Error Logs**: Check `notifications` table in database
- **WebSocket Logs**: Check browser console

---

## Common Customizations

### Change Notification Message

Edit in `backend/app/services/notification_service.py`:

```python
@staticmethod
def prepare_notification_message(order: Order, event_type: str) -> tuple[str, str]:
    if event_type == "new_order":
        subject = f"🍕 NEW ORDER #{order.id} - {order.total} TRY"
        message = f"""
        NEW ORDER RECEIVED! 🎉
        
        Order ID: {order.id}
        Total: {order.total} TRY
        Customer: {order.full_name}
        Phone: {order.phone}
        Address: {order.address_line1}
        
        Log in to dashboard to view details!
        """
```

### Add New Notification Channel

1. Add to `NotificationChannel` enum in `models/notification.py`
2. Add handler in `NotificationService` class
3. Add toggle in settings UI
4. Update notification endpoints

### Enable Rate Limiting

Add to `backend/requirements.txt`:
```
slowapi==0.1.9
```

Then in your endpoints:
```python
from slowapi import Limiter
limiter = Limiter(key_func=get_remote_address)

@router.get("/")
@limiter.limit("100/minute")
def list_notifications(...):
    # implementation
```

---

## Version Info

- **Backend**: FastAPI 0.121.2+
- **Database**: PostgreSQL 12+
- **Frontend**: React 18+
- **WebSocket**: Built-in FastAPI

---

## License

Part of the Restaurant Ordering System

---

**Need help?** Check the troubleshooting section or see the full documentation in `docs/NOTIFICATION_SYSTEM.md`

