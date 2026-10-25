import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../utils/api';
import toast from 'react-hot-toast';

// ============================================================
// EVENT SLICE
// ============================================================
export const fetchEvents = createAsyncThunk('events/fetch', async (params, { rejectWithValue }) => {
  try {
    const { data } = await api.get('/events', { params });
    return data;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message);
  }
});

export const fetchEvent = createAsyncThunk('events/fetchOne', async (slug, { rejectWithValue }) => {
  try {
    const { data } = await api.get(`/events/${slug}`);
    return data;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message);
  }
});

export const fetchTrending = createAsyncThunk('events/trending', async (_, { rejectWithValue }) => {
  try {
    const { data } = await api.get('/events/trending');
    return data;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message);
  }
});

export const fetchRecommended = createAsyncThunk('events/recommended', async (_, { rejectWithValue }) => {
  try {
    const { data } = await api.get('/events/recommended');
    return data;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message);
  }
});

export const registerForEvent = createAsyncThunk('events/register', async ({ eventId, ...payload }, { rejectWithValue }) => {
  try {
    const { data } = await api.post(`/events/${eventId}/register`, payload);
    toast.success(data.message);
    return { eventId, ...data };
  } catch (err) {
    toast.error(err.response?.data?.message || 'Registration failed');
    return rejectWithValue(err.response?.data?.message);
  }
});

export const toggleBookmark = createAsyncThunk('events/bookmark', async (eventId, { rejectWithValue }) => {
  try {
    const { data } = await api.post(`/events/${eventId}/bookmark`);
    toast.success(data.message);
    return { eventId, isBookmarked: data.isBookmarked };
  } catch (err) {
    return rejectWithValue(err.response?.data?.message);
  }
});

export const createEvent = createAsyncThunk('events/create', async (formData, { rejectWithValue }) => {
  try {
    const { data } = await api.post('/events', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
    toast.success('Event created successfully!');
    return data;
  } catch (err) {
    toast.error(err.response?.data?.message || 'Failed to create event');
    return rejectWithValue(err.response?.data?.message);
  }
});

const eventSlice = createSlice({
  name: 'events',
  initialState: {
    events: [],
    currentEvent: null,
    trending: [],
    recommended: [],
    total: 0,
    totalPages: 0,
    currentPage: 1,
    loading: false,
    loadingEvent: false,
    error: null,
    filters: { search: '', category: 'all', mode: 'all', sortBy: 'newest', page: 1 },
  },
  reducers: {
    setFilters: (state, action) => { state.filters = { ...state.filters, ...action.payload, page: 1 }; },
    clearCurrentEvent: (state) => { state.currentEvent = null; },
    updateBookmarkInList: (state, action) => {
      const { eventId, isBookmarked } = action.payload;
      const event = state.events.find(e => e._id === eventId);
      if (event) event.isBookmarked = isBookmarked;
      if (state.currentEvent?._id === eventId) state.currentEvent.isBookmarked = isBookmarked;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchEvents.pending, (state) => { state.loading = true; })
      .addCase(fetchEvents.fulfilled, (state, action) => {
        state.loading = false;
        state.events = action.payload.events;
        state.total = action.payload.total;
        state.totalPages = action.payload.totalPages;
        state.currentPage = action.payload.currentPage;
      })
      .addCase(fetchEvents.rejected, (state) => { state.loading = false; })
      .addCase(fetchEvent.pending, (state) => { state.loadingEvent = true; })
      .addCase(fetchEvent.fulfilled, (state, action) => {
        state.loadingEvent = false;
        state.currentEvent = action.payload.event;
      })
      .addCase(fetchEvent.rejected, (state) => { state.loadingEvent = false; })
      .addCase(fetchTrending.fulfilled, (state, action) => { state.trending = action.payload.events; })
      .addCase(fetchRecommended.fulfilled, (state, action) => { state.recommended = action.payload.events; })
      .addCase(toggleBookmark.fulfilled, (state, action) => {
        const { eventId, isBookmarked } = action.payload;
        const event = state.events.find(e => e._id === eventId);
        if (event) event.isBookmarked = isBookmarked;
        if (state.currentEvent?._id === eventId) state.currentEvent.isBookmarked = isBookmarked;
      });
  },
});

export const { setFilters, clearCurrentEvent, updateBookmarkInList } = eventSlice.actions;
export const eventReducer = eventSlice.reducer;

// ============================================================
// NOTIFICATION SLICE
// ============================================================
const notificationSlice = createSlice({
  name: 'notifications',
  initialState: { items: [], unreadCount: 0, loading: false },
  reducers: {
    addNotification: (state, action) => {
      state.items.unshift(action.payload);
      state.unreadCount += 1;
    },
    setNotifications: (state, action) => {
      state.items = action.payload.notifications;
      state.unreadCount = action.payload.unreadCount;
    },
    markAllRead: (state) => {
      state.items.forEach(n => { n.isRead = true; });
      state.unreadCount = 0;
    },
    removeNotification: (state, action) => {
      state.items = state.items.filter(n => n._id !== action.payload);
      state.unreadCount = state.items.filter(n => !n.isRead).length;
    },
  },
});

export const { addNotification, setNotifications, markAllRead, removeNotification } = notificationSlice.actions;
export const notificationReducer = notificationSlice.reducer;

// ============================================================
// CHAT SLICE
// ============================================================
const chatSlice = createSlice({
  name: 'chat',
  initialState: { chats: [], activeChat: null, messages: [], unreadCount: 0, loading: false },
  reducers: {
    setChats: (state, action) => { state.chats = action.payload; },
    setActiveChat: (state, action) => { state.activeChat = action.payload; },
    setMessages: (state, action) => { state.messages = action.payload; },
    addMessage: (state, action) => {
      // Deduplicate: skip if message _id already exists
      const msg = action.payload;
      if (msg._id && state.messages.some(m => m._id === msg._id)) return;
      state.messages.push(msg);
      const chat = state.chats.find(c => c._id === msg.chatId);
      if (chat) chat.lastMessage = { content: msg.content, sender: msg.sender, createdAt: msg.createdAt };
    },
    setUnreadCount: (state, action) => { state.unreadCount = action.payload; },
    deleteMessageInStore: (state, action) => {
      state.messages = state.messages.map(m =>
        m._id === action.payload ? { ...m, isDeleted: true, content: 'This message was deleted.' } : m
      );
    },
  },
});

export const { setChats, setActiveChat, setMessages, addMessage, setUnreadCount, deleteMessageInStore } = chatSlice.actions;
export const chatReducer = chatSlice.reducer;

// ============================================================
// UI SLICE
// ============================================================
const uiSlice = createSlice({
  name: 'ui',
  initialState: { theme: localStorage.getItem('devarena_theme') || 'light', sidebarOpen: false, modal: null },
  reducers: {
    toggleTheme: (state) => {
      state.theme = state.theme === 'dark' ? 'light' : 'dark';
      localStorage.setItem('devarena_theme', state.theme);
    },
    setTheme: (state, action) => {
      state.theme = action.payload;
      localStorage.setItem('devarena_theme', action.payload);
    },
    toggleSidebar: (state) => { state.sidebarOpen = !state.sidebarOpen; },
    openModal: (state, action) => { state.modal = action.payload; },
    closeModal: (state) => { state.modal = null; },
  },
});

export const { toggleTheme, setTheme, toggleSidebar, openModal, closeModal } = uiSlice.actions;
export const uiReducer = uiSlice.reducer;

// Export all reducers for store
const rootReducer = {
  events: eventReducer,
  notifications: notificationReducer,
  chat: chatReducer,
  ui: uiReducer,
};

export default rootReducer;
