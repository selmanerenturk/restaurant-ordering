import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { createOrder } from '../services/orderService';
import { clearCart } from './cartSlice';

export const submitOrder = createAsyncThunk(
  'order/submit',
  async (orderData, { dispatch, rejectWithValue }) => {
    try {
      const result = await createOrder(orderData);
      dispatch(clearCart());
      return result;
    } catch (error) {
      return rejectWithValue(error.response?.data?.detail || 'Failed to submit order');
    }
  }
);

const orderSlice = createSlice({
  name: 'order',
  initialState: {
    currentOrder: null,
    loading: false,
    error: null,
    success: false,
  },
  reducers: {
    resetOrder: (state) => {
      state.currentOrder = null;
      state.loading = false;
      state.error = null;
      state.success = false;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(submitOrder.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.success = false;
      })
      .addCase(submitOrder.fulfilled, (state, action) => {
        state.loading = false;
        state.currentOrder = action.payload;
        state.success = true;
      })
      .addCase(submitOrder.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        state.success = false;
      });
  },
});

export const { resetOrder } = orderSlice.actions;
export default orderSlice.reducer;
