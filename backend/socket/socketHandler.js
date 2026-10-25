const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Chat = require('../models/Chat');
const logger = require('../utils/logger');

const onlineUsers = new Map(); // userId -> socketId

const initializeSocket = (io) => {
  // Auth middleware for socket
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth?.token || socket.handshake.query?.token;
      if (!token) return next(new Error('Authentication required'));

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.id).select('-password');
      if (!user) return next(new Error('User not found'));

      socket.user = user;
      next();
    } catch (err) {
      next(new Error('Invalid token'));
    }
  });

  io.on('connection', async (socket) => {
    const user = socket.user;
    logger.info(`[socket] User connected: ${user.name} (${socket.id})`);

    // Track online users
    onlineUsers.set(user._id.toString(), socket.id);
    io.emit('user_online', { userId: user._id, isOnline: true });

    // Join personal room for notifications
    socket.join(`user:${user._id}`);

    // ==================== CHAT EVENTS ====================

    socket.on('join_chat', async (chatId) => {
      socket.join(`chat:${chatId}`);
      socket.emit('joined_chat', { chatId });
    });

    socket.on('leave_chat', (chatId) => {
      socket.leave(`chat:${chatId}`);
    });

    socket.on('typing_start', ({ chatId }) => {
      socket.to(`chat:${chatId}`).emit('user_typing', {
        chatId,
        userId: user._id,
        userName: user.name,
      });
    });

    socket.on('typing_stop', ({ chatId }) => {
      socket.to(`chat:${chatId}`).emit('user_stopped_typing', {
        chatId,
        userId: user._id,
      });
    });

    socket.on('send_message', async (data) => {
      try {
        const { chatId, content, type = 'text', replyTo } = data;
        const chat = await Chat.findById(chatId);

        if (!chat || !chat.participants.some(p => p.toString() === user._id.toString())) {
          return socket.emit('error', { message: 'Not authorized to send messages here.' });
        }

        const message = {
          sender: user._id,
          content,
          type,
          replyTo,
          readBy: [user._id],
        };

        chat.messages.push(message);
        chat.lastMessage = { content: content.substring(0, 100), sender: user._id, createdAt: new Date() };
        await chat.save();

        const savedMsg = chat.messages[chat.messages.length - 1];
        const msgData = {
          ...savedMsg.toObject(),
          sender: { _id: user._id, name: user.name, avatar: user.avatar },
        };

        io.to(`chat:${chatId}`).emit('new_message', { chatId, message: msgData });
      } catch (err) {
        socket.emit('error', { message: err.message });
      }
    });

    socket.on('mark_read', async ({ chatId }) => {
      try {
        const chat = await Chat.findById(chatId);
        if (!chat) return;

        let updated = false;
        chat.messages.forEach((msg) => {
          if (!msg.readBy.includes(user._id)) {
            msg.readBy.push(user._id);
            updated = true;
          }
        });

        if (updated) {
          await chat.save();
          socket.to(`chat:${chatId}`).emit('messages_read', { chatId, userId: user._id });
        }
      } catch (err) {
        logger.error('mark_read error:', err.message);
      }
    });

    socket.on('react_to_message', async ({ chatId, messageId, emoji }) => {
      try {
        const chat = await Chat.findById(chatId);
        if (!chat) return;

        const message = chat.messages.id(messageId);
        if (!message) return;

        const existingReaction = message.reactions.find(r => r.emoji === emoji);
        if (existingReaction) {
          const userIndex = existingReaction.users.indexOf(user._id);
          if (userIndex > -1) {
            existingReaction.users.splice(userIndex, 1);
            if (existingReaction.users.length === 0) {
              message.reactions = message.reactions.filter(r => r.emoji !== emoji);
            }
          } else {
            existingReaction.users.push(user._id);
          }
        } else {
          message.reactions.push({ emoji, users: [user._id] });
        }

        await chat.save();
        io.to(`chat:${chatId}`).emit('reaction_updated', {
          chatId, messageId, reactions: message.reactions,
        });
      } catch (err) {
        logger.error('react_to_message error:', err.message);
      }
    });

    // ==================== EVENT ROOM EVENTS ====================

    socket.on('join_event_room', (eventId) => {
      socket.join(`event:${eventId}`);
    });

    socket.on('leave_event_room', (eventId) => {
      socket.leave(`event:${eventId}`);
    });

    // ==================== TEAM EVENTS ====================

    socket.on('join_team_room', (teamId) => {
      socket.join(`team:${teamId}`);
    });

    // ==================== NOTIFICATION EVENTS ====================

    socket.on('notification_read', async (notificationId) => {
      try {
        const { Notification } = require('../models/Supplementary');
        await Notification.findOneAndUpdate(
          { _id: notificationId, recipient: user._id },
          { isRead: true, readAt: new Date() }
        );
      } catch (err) {
        logger.error('notification_read error:', err.message);
      }
    });

    // ==================== PRESENCE ====================

    socket.on('update_presence', (status) => {
      socket.broadcast.emit('presence_update', { userId: user._id, status });
    });

    // ==================== DISCONNECT ====================

    socket.on('disconnect', () => {
      logger.info(`[socket] User disconnected: ${user.name}`);
      onlineUsers.delete(user._id.toString());
      io.emit('user_offline', { userId: user._id, isOnline: false });
    });
  });

  return io;
};

// Helper: get socket id for a user
const getSocketId = (userId) => onlineUsers.get(userId.toString());

// Helper: emit to specific user
const emitToUser = (io, userId, event, data) => {
  io.to(`user:${userId}`).emit(event, data);
};

module.exports = { initializeSocket, getSocketId, emitToUser };
