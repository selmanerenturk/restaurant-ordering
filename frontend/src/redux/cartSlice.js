import { createSlice } from '@reduxjs/toolkit';

const buildCartKey = (product_price_id, selected_options = []) => {
  const optionKeys = selected_options
    .map((o) => `${o.option_item_id}${o.is_removed ? 'r' : ''}`)
    .sort()
    .join(',');
  return `${product_price_id}__${optionKeys}`;
};

const cartSlice = createSlice({
  name: 'cart',
  initialState: {
    items: [],
    isOpen: false,
  },
  reducers: {
    addToCart: (state, action) => {
      const { product_price_id, product_id, product_name, quantity_code, unit_code, price, currency_code, quantity, imageurl, selected_options = [] } = action.payload;
      const cartKey = buildCartKey(product_price_id, selected_options);
      const existingItem = state.items.find(item => item.cartKey === cartKey);
      if (existingItem) {
        existingItem.quantity += quantity;
      } else {
        state.items.push({
          cartKey,
          product_price_id,
          product_id,
          product_name,
          quantity_code,
          unit_code,
          price,
          currency_code,
          quantity,
          imageurl,
          selected_options,
        });
      }
    },
    removeFromCart: (state, action) => {
      state.items = state.items.filter(item => item.cartKey !== action.payload);
    },
    updateQuantity: (state, action) => {
      const { cartKey, quantity } = action.payload;
      const item = state.items.find(item => item.cartKey === cartKey);
      if (item) {
        if (quantity <= 0) {
          state.items = state.items.filter(i => i.cartKey !== cartKey);
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
  state.cart.items.reduce((total, item) => {
    const optionsExtra = (item.selected_options || []).reduce((sum, o) => sum + (o.extra_price || 0), 0);
    return total + (item.price + optionsExtra) * item.quantity;
  }, 0);
export const selectCartItemCount = (state) =>
  state.cart.items.reduce((count, item) => count + item.quantity, 0);
export const selectIsCartOpen = (state) => state.cart.isOpen;

export default cartSlice.reducer;
