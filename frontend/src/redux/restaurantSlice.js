import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { getRestaurantAvailability } from '../services/restaurantSettingsService';

export const fetchAvailability = createAsyncThunk(
  'restaurant/fetchAvailability',
  async (_, { rejectWithValue }) => {
    try {
      return await getRestaurantAvailability();
    } catch (error) {
      return rejectWithValue(error.response?.data?.detail || 'Durum kontrol edilemedi');
    }
  }
);

const restaurantSlice = createSlice({
  name: 'restaurant',
  initialState: {
    is_open: true,
    reason: null,
    next_open_time: null,
    loading: false,
    error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchAvailability.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAvailability.fulfilled, (state, action) => {
        state.loading = false;
        state.is_open = action.payload.is_open;
        state.reason = action.payload.reason;
        state.next_open_time = action.payload.next_open_time;
      })
      .addCase(fetchAvailability.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const selectRestaurantOpen = (state) => state.restaurant.is_open;
export const selectRestaurantReason = (state) => state.restaurant.reason;
export const selectRestaurantNextOpen = (state) => state.restaurant.next_open_time;

export default restaurantSlice.reducer;

