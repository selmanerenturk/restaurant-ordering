import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { fetchProductsWithDefaultPrices, fetchProductWithPrices } from '../services/productService';

export const getProductsWithDefaultPrices = createAsyncThunk(
  'products/getWithDefaultPrices',
  async (_, { rejectWithValue }) => {
    try {
      return await fetchProductsWithDefaultPrices();
    } catch (error) {
      return rejectWithValue(error.response?.data?.detail || 'Failed to fetch products');
    }
  }
);

export const getProductWithPrices = createAsyncThunk(
  'products/getProductWithPrices',
  async (productId, { rejectWithValue }) => {
    try {
      return await fetchProductWithPrices(productId);
    } catch (error) {
      return rejectWithValue(error.response?.data?.detail || 'Failed to fetch product');
    }
  }
);

const productsSlice = createSlice({
  name: 'products',
  initialState: {
    items: [],
    selectedProduct: null,
    loading: false,
    error: null,
    searchQuery: '',
  },
  reducers: {
    clearSelectedProduct: (state) => {
      state.selectedProduct = null;
    },
    setSearchQuery: (state, action) => {
      state.searchQuery = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(getProductsWithDefaultPrices.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getProductsWithDefaultPrices.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload;
      })
      .addCase(getProductsWithDefaultPrices.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(getProductWithPrices.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getProductWithPrices.fulfilled, (state, action) => {
        state.loading = false;
        state.selectedProduct = action.payload;
      })
      .addCase(getProductWithPrices.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const { clearSelectedProduct, setSearchQuery } = productsSlice.actions;
export default productsSlice.reducer;
