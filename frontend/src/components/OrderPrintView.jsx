import { forwardRef } from 'react';

const DELIVERY_TYPE_LABELS = { delivery: 'Teslimat', pickup: 'Gel Al' };
const PAYMENT_TYPE_LABELS = { cash: 'Nakit', card: 'Kart' };
const STATUS_LABELS = {
  new: 'Yeni', confirmed: 'Onaylandı', preparing: 'Hazırlanıyor',
  ready: 'Hazır', delivered: 'Teslim Edildi', cancelled: 'İptal', returned: 'İade',
};

function fmtDate(dateStr) {
  const d = new Date(dateStr);
  return d.toLocaleDateString('tr-TR', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

function fmtPrice(v) {
  return parseFloat(v).toFixed(2);
}

/**
 * Print-friendly order receipt.
 * Renders inside a hidden container; triggered via window.print().
 * Works on both 80 mm thermal printers and A4.
 */
const OrderPrintView = forwardRef(({ order, restaurantName }, ref) => {
  if (!order) return null;

  const removedOpts = (opts) => (opts || []).filter((o) => o.is_removed);
  const extraOpts  = (opts) => (opts || []).filter((o) => !o.is_removed && parseFloat(o.extra_price_snapshot) > 0);

  return (
    <div ref={ref} className="print-receipt">
      {/* ── Header ── */}
      <div className="receipt-header">
        <h2 className="receipt-shop-name">{restaurantName || 'Restoran'}</h2>
        <p className="receipt-order-id">Sipariş #{order.id}</p>
        <p className="receipt-date">{fmtDate(order.created_at)}</p>
        <p className="receipt-status">{STATUS_LABELS[order.status] || order.status}</p>
      </div>

      <div className="receipt-divider">{'─'.repeat(40)}</div>

      {/* ── Customer ── */}
      <div className="receipt-section">
        <p><strong>{order.full_name}</strong></p>
        <p>{order.phone}</p>
        {order.delivery_type === 'pickup' ? (
          <p><em>Gel Al</em></p>
        ) : (
          <p>
            {order.address_line1}
            {order.address_line2 ? `, ${order.address_line2}` : ''}
            {order.district ? `, ${order.district}` : ''}
            {order.city ? ` / ${order.city}` : ''}
          </p>
        )}
        <p>
          {DELIVERY_TYPE_LABELS[order.delivery_type] || order.delivery_type}
          {' · '}
          {PAYMENT_TYPE_LABELS[order.payment_type] || order.payment_type}
        </p>
        {order.do_not_ring_bell && (
          <p className="receipt-warning">⚠ ZİLE BASMA</p>
        )}
      </div>

      <div className="receipt-divider">{'─'.repeat(40)}</div>

      {/* ── Order Note ── */}
      {order.order_note && (
        <>
          <div className="receipt-section">
            <p className="receipt-note-label">NOT:</p>
            <p className="receipt-note">{order.order_note}</p>
          </div>
          <div className="receipt-divider">{'─'.repeat(40)}</div>
        </>
      )}

      {/* ── Items ── */}
      <table className="receipt-items">
        <thead>
          <tr>
            <th className="receipt-item-name-col">Ürün</th>
            <th className="receipt-item-qty-col">Ad.</th>
            <th className="receipt-item-price-col">Tutar</th>
          </tr>
        </thead>
        <tbody>
          {order.items.map((item) => {
            const removed = removedOpts(item.selected_options);
            const extras  = extraOpts(item.selected_options);
            return (
              <tr key={item.id} className="receipt-item-row">
                <td className="receipt-item-name">
                  {item.product_name_snapshot}
                  {removed.length > 0 && (
                    <span className="receipt-opt-line receipt-opt-removed">
                      {removed.map((o) => `– ${o.item_name_snapshot}`).join(', ')}
                    </span>
                  )}
                  {extras.length > 0 && (
                    <span className="receipt-opt-line receipt-opt-extra">
                      {extras.map((o) => `+ ${o.item_name_snapshot} (+${fmtPrice(o.extra_price_snapshot)}₺)`).join(', ')}
                    </span>
                  )}
                </td>
                <td className="receipt-item-qty">{item.quantity}</td>
                <td className="receipt-item-price">{fmtPrice(item.line_total)} ₺</td>
              </tr>
            );
          })}
        </tbody>
      </table>

      <div className="receipt-divider">{'─'.repeat(40)}</div>

      {/* ── Totals ── */}
      <div className="receipt-totals">
        <div className="receipt-total-row">
          <span>Ara Toplam</span>
          <span>{fmtPrice(order.subtotal)} ₺</span>
        </div>
        {parseFloat(order.delivery_fee) > 0 && (
          <div className="receipt-total-row">
            <span>Teslimat</span>
            <span>{fmtPrice(order.delivery_fee)} ₺</span>
          </div>
        )}
        <div className="receipt-total-row receipt-grand-total">
          <span>TOPLAM</span>
          <span>{fmtPrice(order.total)} ₺</span>
        </div>
      </div>

      <div className="receipt-divider">{'─'.repeat(40)}</div>

      <p className="receipt-footer">Afiyet olsun!</p>
    </div>
  );
});

OrderPrintView.displayName = 'OrderPrintView';
export default OrderPrintView;

