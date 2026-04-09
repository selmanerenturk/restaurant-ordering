import React, { useState, useEffect } from 'react';
import { useDispatch } from 'react-redux';
import notificationService from '../services/notificationService';
import { setPreferences } from '../redux/notificationSlice';
import './NotificationSettings.css';

export const NotificationSettings = () => {
  const dispatch = useDispatch();
  const [preferences, setLocalPreferences] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    fetchPreferences();
  }, []);

  const fetchPreferences = async () => {
    try {
      setIsLoading(true);
      const response = await notificationService.getPreferences();
      setLocalPreferences(response.data);
      dispatch(setPreferences(response.data));
      setErrorMessage('');
    } catch (error) {
      console.error('Error fetching preferences:', error);
      setErrorMessage('Failed to load notification preferences');
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (field, value) => {
    setLocalPreferences(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSave = async () => {
    try {
      setIsSaving(true);
      setErrorMessage('');
      await notificationService.updatePreferences(preferences);
      dispatch(setPreferences(preferences));
      setSuccessMessage('Preferences saved successfully!');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (error) {
      console.error('Error saving preferences:', error);
      setErrorMessage('Failed to save preferences. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleTestNotification = async () => {
    try {
      setIsSaving(true);
      await notificationService.testNotification();
      setSuccessMessage('Test notification sent! Check your email.');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (error) {
      console.error('Error sending test notification:', error);
      setErrorMessage('Failed to send test notification');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return <div className="notification-settings-loading">Loading preferences...</div>;
  }

  if (!preferences) {
    return <div className="notification-settings-error">Failed to load preferences</div>;
  }

  return (
    <div className="notification-settings">
      <div className="settings-container">
        <h2>Notification Preferences</h2>

        {successMessage && (
          <div className="alert alert-success">{successMessage}</div>
        )}

        {errorMessage && (
          <div className="alert alert-error">{errorMessage}</div>
        )}

        <div className="settings-section">
          <h3>Contact Information</h3>

          <div className="form-group">
            <label htmlFor="admin_email">Admin Email *</label>
            <input
              id="admin_email"
              type="email"
              value={preferences.admin_email || ''}
              onChange={(e) => handleInputChange('admin_email', e.target.value)}
              placeholder="admin@restaurant.com"
              required
            />
            <small>Where you'll receive email notifications</small>
          </div>

          <div className="form-group">
            <label htmlFor="admin_phone">Phone Number (SMS/Voice)</label>
            <input
              id="admin_phone"
              type="tel"
              value={preferences.admin_phone || ''}
              onChange={(e) => handleInputChange('admin_phone', e.target.value)}
              placeholder="+90 555 1234567"
            />
            <small>For SMS and voice notifications (E.164 format)</small>
          </div>

          <div className="form-group">
            <label htmlFor="admin_whatsapp">WhatsApp Number</label>
            <input
              id="admin_whatsapp"
              type="tel"
              value={preferences.admin_whatsapp || ''}
              onChange={(e) => handleInputChange('admin_whatsapp', e.target.value)}
              placeholder="+90 555 1234567"
            />
            <small>Same as phone or different for WhatsApp notifications</small>
          </div>
        </div>

        <div className="settings-section">
          <h3>Notification Channels</h3>

          <div className="checkbox-group">
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={preferences.enable_email}
                onChange={(e) => handleInputChange('enable_email', e.target.checked)}
              />
              <span>📧 Email Notifications</span>
            </label>
            <small>Receive notifications via email</small>
          </div>

          <div className="checkbox-group">
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={preferences.enable_sms}
                onChange={(e) => handleInputChange('enable_sms', e.target.checked)}
              />
              <span>📱 SMS Notifications</span>
            </label>
            <small>Receive notifications via SMS (requires phone number)</small>
          </div>

          <div className="checkbox-group">
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={preferences.enable_whatsapp}
                onChange={(e) => handleInputChange('enable_whatsapp', e.target.checked)}
              />
              <span>💬 WhatsApp Notifications</span>
            </label>
            <small>Receive notifications via WhatsApp (requires WhatsApp number)</small>
          </div>

          <div className="checkbox-group">
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={preferences.enable_voice}
                onChange={(e) => handleInputChange('enable_voice', e.target.checked)}
              />
              <span>☎️ Voice Notifications</span>
            </label>
            <small>Receive automated voice calls for critical orders</small>
          </div>
        </div>

        <div className="settings-section">
          <h3>Notification Triggers</h3>

          <div className="checkbox-group">
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={preferences.notify_on_new_order}
                onChange={(e) => handleInputChange('notify_on_new_order', e.target.checked)}
              />
              <span>Notify on new orders</span>
            </label>
          </div>

          <div className="checkbox-group">
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={preferences.notify_on_status_change}
                onChange={(e) => handleInputChange('notify_on_status_change', e.target.checked)}
              />
              <span>Notify on order status changes</span>
            </label>
          </div>

          <div className="checkbox-group">
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={preferences.notify_on_delivery_completed}
                onChange={(e) => handleInputChange('notify_on_delivery_completed', e.target.checked)}
              />
              <span>Notify when delivery is completed</span>
            </label>
          </div>
        </div>

        <div className="settings-section">
          <h3>Quiet Hours</h3>
          <p className="section-description">
            Don't send notifications between these hours (24-hour format)
          </p>

          <div className="checkbox-group">
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={preferences.enable_quiet_hours}
                onChange={(e) => handleInputChange('enable_quiet_hours', e.target.checked)}
              />
              <span>Enable quiet hours</span>
            </label>
          </div>

          {preferences.enable_quiet_hours && (
            <div className="time-range-group">
              <div className="form-group">
                <label htmlFor="quiet_hours_start">Start Time</label>
                <input
                  id="quiet_hours_start"
                  type="time"
                  value={preferences.quiet_hours_start || '22:00'}
                  onChange={(e) => handleInputChange('quiet_hours_start', e.target.value)}
                />
              </div>

              <div className="form-group">
                <label htmlFor="quiet_hours_end">End Time</label>
                <input
                  id="quiet_hours_end"
                  type="time"
                  value={preferences.quiet_hours_end || '08:00'}
                  onChange={(e) => handleInputChange('quiet_hours_end', e.target.value)}
                />
              </div>
            </div>
          )}
        </div>

        <div className="settings-actions">
          <button
            className="btn btn-primary"
            onClick={handleSave}
            disabled={isSaving}
          >
            {isSaving ? 'Saving...' : 'Save Preferences'}
          </button>

          <button
            className="btn btn-secondary"
            onClick={handleTestNotification}
            disabled={isSaving}
          >
            {isSaving ? 'Sending...' : 'Send Test Notification'}
          </button>
        </div>

        <div className="settings-info">
          <p>
            💡 <strong>Tip:</strong> Send a test notification to verify your settings are working correctly.
          </p>
        </div>
      </div>
    </div>
  );
};

