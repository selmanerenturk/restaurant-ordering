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
            items.map((item) => (
              <div key={item.product_price_id} className="cart-item d-flex align-items-center mb-3 p-2 rounded">
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
                  <div className="d-flex align-items-center mt-1">
                    <button
                      className="btn btn-sm btn-outline-secondary"
                      onClick={() =>
                        dispatch(updateQuantity({ product_price_id: item.product_price_id, quantity: item.quantity - 1 }))
                      }
                    >
                      <BsDash />
                    </button>
                    <span className="mx-2 fw-semibold">{item.quantity}</span>
                    <button
                      className="btn btn-sm btn-outline-secondary"
                      onClick={() =>
                        dispatch(updateQuantity({ product_price_id: item.product_price_id, quantity: item.quantity + 1 }))
                      }
                    >
                      <BsPlus />
                    </button>
                  </div>
                </div>
                <div className="text-end">
                  <p className="mb-1 fw-bold">{(item.price * item.quantity).toFixed(2)} {item.currency_code}</p>
                  <button
                    className="btn btn-sm btn-outline-danger"
                    onClick={() => dispatch(removeFromCart(item.product_price_id))}
                  >
                    <BsTrash />
                  </button>
                </div>
              </div>
            ))
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
