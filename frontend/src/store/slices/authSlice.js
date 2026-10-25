import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../utils/api';
import toast from 'react-hot-toast';

export const registerUser = createAsyncThunk('auth/register', async (userData, { rejectWithValue }) => {
  try {
    const { data } = await api.post('/auth/register', userData);
    localStorage.setItem('devarena_token', data.token);
    if (data.refreshToken) localStorage.setItem('devarena_refresh', data.refreshToken);
    return data;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || 'Registration failed');
  }
});

export const loginUser = createAsyncThunk('auth/login', async (credentials, { rejectWithValue }) => {
  try {
    const { data } = await api.post('/auth/login', credentials);
    localStorage.setItem('devarena_token', data.token);
    if (data.refreshToken) localStorage.setItem('devarena_refresh', data.refreshToken);
    return data;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || 'Login failed');
  }
});

export const fetchCurrentUser = createAsyncThunk('auth/fetchCurrentUser', async (_, { rejectWithValue }) => {
  try {
    const { data } = await api.get('/auth/me');
    return data;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || 'Session expired');
  }
});

export const updateProfile = createAsyncThunk('auth/updateProfile', async (profileData, { rejectWithValue }) => {
  try {
    const { data } = await api.put('/users/profile', profileData);
    return data;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || 'Update failed');
  }
});

export const uploadAvatar = createAsyncThunk('auth/uploadAvatar', async (formData, { rejectWithValue }) => {
  try {
    const { data } = await api.put('/users/avatar', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return data;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || 'Upload failed');
  }
});

const authSlice = createSlice({
  name: 'auth',
  initialState: {
    user: null,
    token: localStorage.getItem('devarena_token') || null,
    isAuthenticated: false,
    loading: false,
    initializing: !!localStorage.getItem('devarena_token'), // only true when token exists
    error: null,
  },
  reducers: {
    logout: (state) => {
      state.user = null;
      state.token = null;
      state.isAuthenticated = false;
      state.initializing = false;
      localStorage.removeItem('devarena_token');
      localStorage.removeItem('devarena_refresh');
    },
    clearError: (state) => { state.error = null; },
    updateUserPoints: (state, action) => {
      if (state.user) state.user.points = action.payload;
    },
    addBadge: (state, action) => {
      if (state.user) state.user.badges = [...(state.user.badges || []), action.payload];
    },
    toggleBookmarkInStore: (state, action) => {
      if (!state.user) return;
      const id = action.payload;
      const bookmarks = state.user.bookmarkedEvents || [];
      if (bookmarks.includes(id)) {
        state.user.bookmarkedEvents = bookmarks.filter(b => b !== id);
      } else {
        state.user.bookmarkedEvents = [...bookmarks, id];
      }
    },
  },
  extraReducers: (builder) => {
    // Register
    builder
      .addCase(registerUser.pending,   (state) => { state.loading = true; state.error = null; })
      .addCase(registerUser.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload.user;
        state.token = action.payload.token;
        state.isAuthenticated = true;
        state.initializing = false;
        toast.success('Welcome to DevArena!');
      })
      .addCase(registerUser.rejected,  (state, action) => {
        state.loading = false; state.error = action.payload; toast.error(action.payload);
      });

    // Login
    builder
      .addCase(loginUser.pending,   (state) => { state.loading = true; state.error = null; })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload.user;
        state.token = action.payload.token;
        state.isAuthenticated = true;
        state.initializing = false;
        toast.success(`Welcome back, ${action.payload.user.name.split(' ')[0]}!`);
      })
      .addCase(loginUser.rejected,  (state, action) => {
        state.loading = false; state.error = action.payload; toast.error(action.payload);
      });

    // Fetch current user
    builder
      .addCase(fetchCurrentUser.pending,   (state) => { state.loading = true; })
      .addCase(fetchCurrentUser.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload.user;
        state.isAuthenticated = true;
        state.initializing = false;
      })
      .addCase(fetchCurrentUser.rejected,  (state) => {
        state.loading = false;
        state.initializing = false;
        state.isAuthenticated = false;
        state.user = null;
        localStorage.removeItem('devarena_token');
      });

    // Update profile
    builder
      .addCase(updateProfile.pending,   (state) => { state.loading = true; })
      .addCase(updateProfile.fulfilled, (state, action) => {
        state.loading = false; state.user = action.payload.user; toast.success('Profile updated!');
      })
      .addCase(updateProfile.rejected,  (state, action) => {
        state.loading = false; toast.error(action.payload);
      });

    // Upload avatar
    builder
      .addCase(uploadAvatar.fulfilled, (state, action) => {
        if (state.user) state.user.avatar = action.payload.avatar; toast.success('Avatar updated!');
      });
  },
});

export const { logout, clearError, updateUserPoints, addBadge, toggleBookmarkInStore } = authSlice.actions;
export default authSlice.reducer;
