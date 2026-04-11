import { useEffect, useRef, useCallback } from 'react';
import { useDispatch } from 'react-redux';
import {
  addNotification,
  setUnreadCount,
  setWSConnected,
} from '../redux/notificationSlice';

// ─── Persistent AudioContext (survives re-renders) ───
let audioCtx = null;

function ensureAudioContext() {
  if (!audioCtx || audioCtx.state === 'closed') {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    audioCtx = new AC();
  }
  // Resume if browser suspended it (autoplay policy)
  if (audioCtx.state === 'suspended') {
    audioCtx.resume().catch(() => {});
  }
  return audioCtx;
}

// Unlock AudioContext on very first user interaction (required by browsers)
function unlockAudio() {
  ensureAudioContext();
  document.removeEventListener('click', unlockAudio, true);
  document.removeEventListener('keydown', unlockAudio, true);
  document.removeEventListener('touchstart', unlockAudio, true);
}
if (typeof document !== 'undefined') {
  document.addEventListener('click', unlockAudio, true);
  document.addEventListener('keydown', unlockAudio, true);
  document.addEventListener('touchstart', unlockAudio, true);
}

/**
 * Play a distinctive "new order" alert sound.
 * Three ascending tones followed by a repeat after a short pause.
 */
function playNewOrderSound() {
  try {
    const ctx = ensureAudioContext();
    if (!ctx) return;
    const t = ctx.currentTime;

    const playTone = (freq, start, dur, vol = 0.35) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, start);
      gain.gain.setValueAtTime(vol, start);
      gain.gain.exponentialRampToValueAtTime(0.001, start + dur);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(start);
      osc.stop(start + dur);
    };

    // First phrase – three ascending notes
    playTone(880, t, 0.15, 0.4);
    playTone(1108, t + 0.16, 0.15, 0.4);
    playTone(1320, t + 0.32, 0.25, 0.45);

    // Second phrase – repeat (draws more attention)
    playTone(880, t + 0.7, 0.15, 0.4);
    playTone(1108, t + 0.86, 0.15, 0.4);
    playTone(1320, t + 1.02, 0.25, 0.45);
  } catch (e) {
    console.warn('Could not play notification sound:', e);
  }
}

export const useWebSocket = () => {
  const dispatch = useDispatch();
  const ws = useRef(null);
  const reconnectAttempts = useRef(0);
  const maxReconnectAttempts = 10;
  const pingInterval = useRef(null);

  const playNotificationSound = useCallback(() => {
    playNewOrderSound();
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
                  requireInteraction: true,
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
