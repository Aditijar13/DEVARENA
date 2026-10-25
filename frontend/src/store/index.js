import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import { eventReducer, notificationReducer, chatReducer, uiReducer } from './slices/allSlices';

const store = configureStore({
  reducer: {
    auth:          authReducer,
    events:        eventReducer,
    notifications: notificationReducer,
    chat:          chatReducer,
    ui:            uiReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({ serializableCheck: false }),
});

export default store;
