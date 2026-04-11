import { useEffect, useState, useRef } from 'react';
import { useSelector } from 'react-redux';
import { BsBellFill, BsXLg } from 'react-icons/bs';

/**
 * A floating toast that pops up in the top-right corner when a new order
 * notification arrives.  Auto-dismisses after 8 seconds.
 * Only renders for authenticated sellers.
 */
function OrderToast() {
  const notifications = useSelector((s) => s.notifications.notifications);
  const [visible, setVisible] = useState(false);
  const [toast, setToast] = useState(null);
  const lastIdRef = useRef(null);
  const timerRef = useRef(null);

  useEffect(() => {
    if (notifications.length === 0) return;
    const latest = notifications[0];

    // Only show for NEW, unread notifications that we haven't shown yet
    if (
      latest &&
      !latest.is_read &&
      latest.id !== lastIdRef.current &&
      (latest.channel === 'panel' || latest.play_sound)
    ) {
      lastIdRef.current = latest.id;
      setToast(latest);
      setVisible(true);
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => setVisible(false), 8000);
    }
  }, [notifications]);

  if (!visible || !toast) return null;

  return (
    <div style={styles.container}>
      <div style={styles.toast}>
        <div style={styles.iconCol}>
          <BsBellFill size={22} color="#fff" />
        </div>
        <div style={styles.body}>
          <strong style={styles.title}>🆕 Yeni Sipariş</strong>
          <p style={styles.message}>{toast.message || `Sipariş #${toast.order_id}`}</p>
        </div>
        <button style={styles.close} onClick={() => setVisible(false)}>
          <BsXLg size={14} />
        </button>
      </div>
    </div>
  );
}

const styles = {
  container: {
    position: 'fixed',
    top: 80,
    right: 20,
    zIndex: 10000,
    animation: 'slideInRight 0.35s ease-out',
  },
  toast: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: 12,
    background: '#1a1a2e',
    color: '#fff',
    borderRadius: 12,
    padding: '14px 18px',
    boxShadow: '0 8px 30px rgba(0,0,0,0.35)',
    minWidth: 300,
    maxWidth: 420,
    border: '2px solid #c9a96e',
  },
  iconCol: {
    background: '#c9a96e',
    borderRadius: '50%',
    width: 40,
    height: 40,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  body: {
    flex: 1,
    minWidth: 0,
  },
  title: {
    display: 'block',
    fontSize: 15,
    marginBottom: 2,
  },
  message: {
    margin: 0,
    fontSize: 13,
    opacity: 0.85,
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  close: {
    background: 'none',
    border: 'none',
    color: '#fff',
    opacity: 0.5,
    cursor: 'pointer',
    padding: 4,
    flexShrink: 0,
  },
};

export default OrderToast;

