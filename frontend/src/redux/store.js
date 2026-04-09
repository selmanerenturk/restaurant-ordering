import { configureStore } from '@reduxjs/toolkit';
import productsReducer from './productsSlice';
import cartReducer from './cartSlice';
import orderReducer from './orderSlice';
import authReducer from './authSlice';
import notificationReducer from './notificationSlice';

const store = configureStore({
  reducer: {
    products: productsReducer,
    cart: cartReducer,
    order: orderReducer,
    auth: authReducer,
    notifications: notificationReducer,
  },
});

export default store;
