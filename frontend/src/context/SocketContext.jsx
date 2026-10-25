import React, { createContext, useContext, useEffect, useRef, useState, useCallback } from 'react';
import { io } from 'socket.io-client';
import { useDispatch, useSelector } from 'react-redux';
import { addNotification } from '../store/slices/notificationSlice';
import { addMessage, deleteMessageInStore } from '../store/slices/chatSlice';
import toast from 'react-hot-toast';

const SocketContext = createContext(null);

const SOCKET_URL =
  process.env.NODE_ENV === 'production'
    ? window.location.origin
    : process.env.REACT_APP_SOCKET_URL || 'http://localhost:5000';

export const SocketProvider = ({ children }) => {
  const { token, isAuthenticated } = useSelector(s => s.auth);
  const dispatch = useDispatch();
  const socketRef = useRef(null);

  const [isConnected,  setIsConnected]  = useState(false);
  const [onlineUsers,  setOnlineUsers]  = useState(new Set());
  const [typingUsers,  setTypingUsers]  = useState({});

  useEffect(() => {
    if (!isAuthenticated || !token) {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
        setIsConnected(false);
      }
      return;
    }

    // Avoid double-connecting if token hasn't changed
    if (socketRef.current?.connected) return;

    const socket = io(SOCKET_URL, {
      auth:                { token },
      transports:          ['websocket', 'polling'],
      reconnection:        true,
      reconnectionDelay:   1500,
      reconnectionAttempts: 10,
      timeout:             10000,
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      setIsConnected(true);
    });

    socket.on('disconnect', (reason) => {
      setIsConnected(false);
      if (reason === 'io server disconnect') {
        // Server forced disconnect (e.g. invalid token) — don't reconnect
        socket.close();
      }
    });

    socket.on('connect_error', (err) => {
      console.error('[socket] connect error:', err.message);
      setIsConnected(false);
    });

    // ── Notifications ──────────────────────────────────────
    socket.on('new_notification', (notification) => {
      dispatch(addNotification(notification));
      const loud = [
        'registration_approved', 'team_invite',
        'certificate_issued',    'badge_awarded',
        'event_reminder',        'payment_success',
      ];
      if (loud.includes(notification.type)) {
        toast(notification.title || notification.message, { duration: 4500 });
      }
    });

    // ── Chat messages ──────────────────────────────────────
    socket.on('new_message', ({ chatId, message }) => {
      dispatch(addMessage({ ...message, chatId }));
    });

    socket.on('message_deleted', ({ chatId, messageId }) => {
      dispatch(deleteMessageInStore(messageId));
    });

    socket.on('messages_read', ({ chatId, userId }) => {
      // Could update read receipts in store here
    });

    socket.on('reaction_updated', ({ chatId, messageId, reactions }) => {
      // Reactions handled locally
    });

    // ── Presence ──────────────────────────────────────────
    socket.on('user_online', ({ userId }) =>
      setOnlineUsers(p => new Set([...p, userId.toString()]))
    );
    socket.on('user_offline', ({ userId }) =>
      setOnlineUsers(p => { const n = new Set(p); n.delete(userId.toString()); return n; })
    );

    // ── Typing ────────────────────────────────────────────
    socket.on('user_typing', ({ chatId, userId, userName }) =>
      setTypingUsers(p => ({ ...p, [chatId]: { ...(p[chatId] || {}), [userId]: userName } }))
    );
    socket.on('user_stopped_typing', ({ chatId, userId }) =>
      setTypingUsers(p => {
        const copy = { ...(p[chatId] || {}) };
        delete copy[userId];
        return { ...p, [chatId]: copy };
      })
    );

    return () => {
      socket.removeAllListeners();
      socket.disconnect();
      socketRef.current = null;
      setIsConnected(false);
    };
  }, [isAuthenticated, token, dispatch]);

  // ── Emitter helpers (stable references via useCallback) ─
  const emit = useCallback((event, data) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit(event, data);
    }
  }, []);

  const joinChat      = useCallback(id => emit('join_chat', id), [emit]);
  const leaveChat     = useCallback(id => emit('leave_chat', id), [emit]);
  const sendTyping    = useCallback(id => emit('typing_start', { chatId: id }), [emit]);
  const stopTyping    = useCallback(id => emit('typing_stop',  { chatId: id }), [emit]);
  const joinEventRoom = useCallback(id => emit('join_event_room', id), [emit]);
  const markRead      = useCallback(id => emit('mark_read', { chatId: id }), [emit]);
  const sendSocketMsg = useCallback((chatId, content, type = 'text') =>
    emit('send_message', { chatId, content, type }), [emit]);

  return (
    <SocketContext.Provider value={{
      isConnected,
      onlineUsers,
      typingUsers,
      joinChat,
      leaveChat,
      sendTyping,
      stopTyping,
      joinEventRoom,
      markRead,
      sendSocketMessage: sendSocketMsg,
    }}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => useContext(SocketContext);
export default SocketContext;
