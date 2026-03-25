import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { BsX, BsTrash, BsDash, BsPlus } from 'react-icons/bs';
import {
  selectCartItems,
  selectCartTotal,
  selectIsCartOpen,
  closeCart,
  removeFromCart,
  updateQuantity,
} from '../redux/cartSlice';

function Cart() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const items = useSelector(selectCartItems);
  const total = useSelector(selectCartTotal);
  const isOpen = useSelector(selectIsCartOpen);

  const handleCheckout = () => {
    dispatch(closeCart());
    navigate('/order');
  };

  return (
    <>
      {isOpen && <div className="cart-overlay" onClick={() => dispatch(closeCart())}></div>}
      <div className={`cart-drawer ${isOpen ? 'open' : ''}`}>
        <div className="cart-header d-flex justify-content-between align-items-center p-3">
          <h5 className="mb-0 fw-bold">Sepetiniz</h5>
          <button className="btn btn-link text-decoration-none" onClick={() => dispatch(closeCart())}>
            <BsX size={24} />
          </button>
        </div>

        <div className="cart-body p-3">
          {items.length === 0 ? (
            <div className="text-center py-5">
              <p className="text-muted">Sepetiniz boş</p>
            </div>
          ) : (
            items.map((item) => {
              const optionsExtra = (item.selected_options || []).reduce((sum, o) => sum + (o.extra_price || 0), 0);
              const lineTotal = (item.price + optionsExtra) * item.quantity;
              return (
                <div key={item.cartKey} className="cart-item d-flex align-items-center mb-3 p-2 rounded">
                  <img
                    src={item.imageurl}
                    alt={item.product_name}
                    className="cart-item-img rounded me-3"
                  />
                  <div className="flex-grow-1">
                    <h6 className="mb-1 fw-semibold">{item.product_name}</h6>
                    <small className="text-muted">
                      {item.quantity_code} {item.unit_code}
                    </small>
                    {item.selected_options && item.selected_options.filter((o) => o.is_removed || o.extra_price > 0).length > 0 && (
                      <div className="mt-1">
                        {item.selected_options
                          .filter((o) => o.is_removed || o.extra_price > 0)
                          .map((opt, idx) => (
                            <span
                              key={idx}
                              className={`badge me-1 mb-1 ${opt.is_removed ? 'bg-danger-subtle text-danger' : 'bg-light text-dark'}`}
                              style={{ fontSize: '0.7rem' }}
                            >
                              {opt.is_removed ? (
                                <><s>{opt.item_name}</s> ✕</>
                              ) : (
                                <>{opt.item_name}{opt.extra_price > 0 && ` +${opt.extra_price.toFixed(2)}₺`}</>
                              )}
                            </span>
                          ))}
                      </div>
                    )}
                    <div className="d-flex align-items-center mt-1">
                      <button
                        className="btn btn-sm btn-outline-secondary"
                        onClick={() =>
                          dispatch(updateQuantity({ cartKey: item.cartKey, quantity: item.quantity - 1 }))
                        }
                      >
                        <BsDash />
                      </button>
                      <span className="mx-2 fw-semibold">{item.quantity}</span>
                      <button
                        className="btn btn-sm btn-outline-secondary"
                        onClick={() =>
                          dispatch(updateQuantity({ cartKey: item.cartKey, quantity: item.quantity + 1 }))
                        }
                      >
                        <BsPlus />
                      </button>
                    </div>
                  </div>
                  <div className="text-end">
                    <p className="mb-1 fw-bold">{lineTotal.toFixed(2)} {item.currency_code}</p>
                    <button
                      className="btn btn-sm btn-outline-danger"
                      onClick={() => dispatch(removeFromCart(item.cartKey))}
                    >
                      <BsTrash />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {items.length > 0 && (
          <div className="cart-footer p-3 border-top">
            <div className="d-flex justify-content-between mb-3">
              <span className="fw-bold fs-5">Toplam:</span>
              <span className="fw-bold fs-5">{total.toFixed(2)} TRY</span>
            </div>
            <button className="btn btn-gold w-100 fw-bold" onClick={handleCheckout}>
              Siparişe devam et
            </button>
          </div>
        )}
      </div>
    </>
  );
}

export default Cart;
