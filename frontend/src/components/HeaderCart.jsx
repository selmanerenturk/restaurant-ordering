import { useSelector, useDispatch } from 'react-redux';
import { BsCart3 } from 'react-icons/bs';
import { selectCartItemCount, toggleCart } from '../redux/cartSlice';

function HeaderCart() {
  const dispatch = useDispatch();
  const itemCount = useSelector(selectCartItemCount);

  return (
    <button
      className="btn btn-outline-light position-relative cart-btn"
      onClick={() => dispatch(toggleCart())}
    >
      <BsCart3 size={20} />
      {itemCount > 0 && (
        <span className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger">
          {itemCount}
        </span>
      )}
    </button>
  );
}

export default HeaderCart;
