import { useSelector } from 'react-redux';
import { Navigate } from 'react-router-dom';
import { selectIsAuthenticated, selectIsSeller } from '../redux/authSlice';

function ProtectedRoute({ children }) {
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const isSeller = useSelector(selectIsSeller);

  if (!isAuthenticated || !isSeller) {
    return <Navigate to="/login" replace />;
  }

  return children;
}

export default ProtectedRoute;
