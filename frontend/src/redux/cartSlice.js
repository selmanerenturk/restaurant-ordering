import { createSlice } from '@reduxjs/toolkit';

const cartSlice = createSlice({
  name: 'cart',
  initialState: {
    items: [],
    isOpen: false,
  },
  reducers: {
    addToCart: (state, action) => {
      const { product_price_id, product_id, product_name, quantity_code, unit_code, price, currency_code, quantity, imageurl } = action.payload;
      const existingItem = state.items.find(item => item.product_price_id === product_price_id);
      if (existingItem) {
        existingItem.quantity += quantity;
      } else {
        state.items.push({
          product_price_id,
          product_id,
          product_name,
          quantity_code,
          unit_code,
          price,
          currency_code,
          quantity,
          imageurl,
        });
      }
    },
    removeFromCart: (state, action) => {
      state.items = state.items.filter(item => item.product_price_id !== action.payload);
    },
    updateQuantity: (state, action) => {
      const { product_price_id, quantity } = action.payload;
      const item = state.items.find(item => item.product_price_id === product_price_id);
      if (item) {
        if (quantity <= 0) {
          state.items = state.items.filter(i => i.product_price_id !== product_price_id);
        } else {
          item.quantity = quantity;
        }
      }
    },
    clearCart: (state) => {
      state.items = [];
    },
    toggleCart: (state) => {
      state.isOpen = !state.isOpen;
    },
    openCart: (state) => {
      state.isOpen = true;
    },
    closeCart: (state) => {
      state.isOpen = false;
    },
  },
});

export const { addToCart, removeFromCart, updateQuantity, clearCart, toggleCart, openCart, closeCart } = cartSlice.actions;

export const selectCartItems = (state) => state.cart.items;
export const selectCartTotal = (state) =>
  state.cart.items.reduce((total, item) => total + item.price * item.quantity, 0);
export const selectCartItemCount = (state) =>
  state.cart.items.reduce((count, item) => count + item.quantity, 0);
export const selectIsCartOpen = (state) => state.cart.isOpen;

export default cartSlice.reducer;
