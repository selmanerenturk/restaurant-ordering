import { useEffect, useRef, useCallback } from 'react';
import { useDispatch } from 'react-redux';
import {
  addNotification,
  setUnreadCount,
  setWSConnected,
} from '../redux/notificationSlice';

// Notification sound - create once globally
let notificationAudio = null;

function getNotificationAudio() {
  if (!notificationAudio) {
    notificationAudio = {
      play: () => {
        try {
          const AudioContext = window.AudioContext || window.webkitAudioContext;
          if (!AudioContext) return;

          const ctx = new AudioContext();

          // First tone - pleasant ding
          const osc1 = ctx.createOscillator();
          const gain1 = ctx.createGain();
          osc1.type = 'sine';
          osc1.frequency.setValueAtTime(830, ctx.currentTime);
          osc1.frequency.setValueAtTime(1100, ctx.currentTime + 0.1);
          gain1.gain.setValueAtTime(0.3, ctx.currentTime);
          gain1.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.4);
          osc1.connect(gain1);
          gain1.connect(ctx.destination);
          osc1.start(ctx.currentTime);
          osc1.stop(ctx.currentTime + 0.4);

          // Second tone - confirmation ding
          const osc2 = ctx.createOscillator();
          const gain2 = ctx.createGain();
          osc2.type = 'sine';
          osc2.frequency.setValueAtTime(1100, ctx.currentTime + 0.15);
          osc2.frequency.setValueAtTime(1320, ctx.currentTime + 0.25);
          gain2.gain.setValueAtTime(0, ctx.currentTime);
          gain2.gain.setValueAtTime(0.3, ctx.currentTime + 0.15);
          gain2.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.6);
          osc2.connect(gain2);
          gain2.connect(ctx.destination);
          osc2.start(ctx.currentTime + 0.15);
          osc2.stop(ctx.currentTime + 0.6);

          // Third tone - higher alert
          const osc3 = ctx.createOscillator();
          const gain3 = ctx.createGain();
          osc3.type = 'sine';
          osc3.frequency.setValueAtTime(1320, ctx.currentTime + 0.35);
          gain3.gain.setValueAtTime(0, ctx.currentTime);
          gain3.gain.setValueAtTime(0.25, ctx.currentTime + 0.35);
          gain3.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.8);
          osc3.connect(gain3);
          gain3.connect(ctx.destination);
          osc3.start(ctx.currentTime + 0.35);
          osc3.stop(ctx.currentTime + 0.8);

          setTimeout(() => ctx.close(), 1000);
        } catch (e) {
          console.warn('Could not play notification sound:', e);
        }
      },
    };
  }
  return notificationAudio;
}

export const useWebSocket = () => {
  const dispatch = useDispatch();
  const ws = useRef(null);
  const reconnectAttempts = useRef(0);
  const maxReconnectAttempts = 10;
  const pingInterval = useRef(null);

  const playNotificationSound = useCallback(() => {
    try {
      getNotificationAudio().play();
    } catch (e) {
      console.warn('Could not play notification sound:', e);
    }
  }, []);

  useEffect(() => {
    const connectWebSocket = () => {
      try {
        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const host = window.location.host;
        const wsUrl = `${protocol}//${host}/ws/notifications`;

        console.log('Connecting to WebSocket:', wsUrl);
        ws.current = new WebSocket(wsUrl);

        ws.current.onopen = () => {
          console.log('✓ WebSocket connected');
          dispatch(setWSConnected(true));
          reconnectAttempts.current = 0;

          if (ws.current?.readyState === WebSocket.OPEN) {
            ws.current.send('ping');
          }

          if (pingInterval.current) {
            clearInterval(pingInterval.current);
          }
          pingInterval.current = setInterval(() => {
            if (ws.current?.readyState === WebSocket.OPEN) {
              ws.current.send('ping');
            }
          }, 30000);
        };

        ws.current.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);

            if (data.type === 'pong') {
              dispatch(setUnreadCount(data.unread_count));
            } else if (data.type === 'notification') {
              dispatch(addNotification(data));
              // Play sound for new notifications
              if (data.play_sound !== false) {
                playNotificationSound();
              }
              // Show browser notification if permission granted
              if ('Notification' in window && Notification.permission === 'granted') {
                new Notification('🆕 Yeni Sipariş!', {
                  body: data.message || 'Yeni bir sipariş alındı',
                  icon: '/vite.svg',
                  tag: `order-${data.order_id}`,
                });
              }
            } else if (data.type === 'notifications') {
              if (Array.isArray(data.data)) {
                data.data.forEach((notif) => {
                  dispatch(addNotification(notif));
                });
              }
            }
          } catch (error) {
            console.error('Error parsing WebSocket message:', error);
          }
        };

        ws.current.onerror = (error) => {
          console.error('✗ WebSocket error:', error);
          dispatch(setWSConnected(false));
        };

        ws.current.onclose = () => {
          console.log('✗ WebSocket disconnected');
          dispatch(setWSConnected(false));

          if (pingInterval.current) {
            clearInterval(pingInterval.current);
            pingInterval.current = null;
          }

          if (reconnectAttempts.current < maxReconnectAttempts) {
            reconnectAttempts.current += 1;
            const delay = Math.min(
              1000 * Math.pow(2, reconnectAttempts.current),
              30000
            );
            console.log(
              `Reconnecting in ${delay}ms (attempt ${reconnectAttempts.current}/${maxReconnectAttempts})`
            );
            setTimeout(connectWebSocket, delay);
          } else {
            console.error('Max WebSocket reconnection attempts reached');
          }
        };
      } catch (error) {
        console.error('Error creating WebSocket:', error);
      }
    };

    connectWebSocket();

    // Request browser notification permission
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }

    return () => {
      if (pingInterval.current) {
        clearInterval(pingInterval.current);
        pingInterval.current = null;
      }
      if (ws.current) {
        ws.current.close();
      }
    };
  }, [dispatch, playNotificationSound]);

  return ws;
};
