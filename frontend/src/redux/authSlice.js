import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { loginSeller, registerSeller } from '../services/authService';

const savedToken = localStorage.getItem('token');
const savedUser = localStorage.getItem('user');

export const login = createAsyncThunk(
  'auth/login',
  async ({ email, password, turnstileToken }, { rejectWithValue }) => {
    try {
      return await loginSeller(email, password, turnstileToken);
    } catch (error) {
      const detail = error.response?.data?.detail;
      if (Array.isArray(detail)) {
        const messages = detail.map((d) => d.msg?.replace('Value error, ', '') || d.msg);
        return rejectWithValue(messages.join(', '));
      }
      return rejectWithValue(detail || 'Login failed');
    }
  }
);

export const register = createAsyncThunk(
  'auth/register',
  async ({formData, turnstileToken }, { rejectWithValue }) => {
    try {
      return await registerSeller(formData, turnstileToken);
    } catch (error) {
      const detail = error.response?.data?.detail;
      if (Array.isArray(detail)) {
        const messages = detail.map((d) => d.msg?.replace('Value error, ', '') || d.msg);
        return rejectWithValue(messages.join(', '));
      }
      return rejectWithValue(detail || 'Registration failed');
    }
  }
);

const authSlice = createSlice({
  name: 'auth',
  initialState: {
    token: savedToken || null,
    user: savedUser ? JSON.parse(savedUser) : null,
    loading: false,
    error: null,
    registerSuccess: false,
  },
  reducers: {
    logout: (state) => {
      state.token = null;
      state.user = null;
      state.error = null;
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    },
    clearAuthError: (state) => {
      state.error = null;
    },
    clearRegisterSuccess: (state) => {
      state.registerSuccess = false;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(login.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(login.fulfilled, (state, action) => {
        state.loading = false;
        state.token = action.payload.access_token;
        state.user = action.payload.user;
        localStorage.setItem('token', action.payload.access_token);
        localStorage.setItem('user', JSON.stringify(action.payload.user));
      })
      .addCase(login.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(register.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.registerSuccess = false;
      })
      .addCase(register.fulfilled, (state) => {
        state.loading = false;
        state.registerSuccess = true;
      })
      .addCase(register.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const { logout, clearAuthError, clearRegisterSuccess } = authSlice.actions;

export const selectIsAuthenticated = (state) => !!state.auth.token;
export const selectCurrentUser = (state) => state.auth.user;
export const selectIsSeller = (state) => state.auth.user?.role === 'seller';

export default authSlice.reducer;
