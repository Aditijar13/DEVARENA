const Chat = require('../models/Chat');
const User = require('../models/User');

// @desc    Get user's chats
// @route   GET /api/chat
// @access  Private
const getChats = async (req, res) => {
  try {
    const chats = await Chat.find({
      participants: req.user.id,
      isActive: true,
    })
      .populate('participants', 'name avatar isOnline lastSeen')
      .populate('lastMessage.sender', 'name')
      .select('-messages')
      .sort({ updatedAt: -1 });

    return res.status(200).json({ success: true, chats });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get or create direct chat
// @route   POST /api/chat/direct/:userId
// @access  Private
const getOrCreateDirectChat = async (req, res) => {
  try {
    const otherUserId = req.params.userId;

    let chat = await Chat.findOne({
      type: 'direct',
      participants: { $all: [req.user.id, otherUserId], $size: 2 },
    }).populate('participants', 'name avatar headline');

    if (!chat) {
      const otherUser = await User.findById(otherUserId).select('name avatar headline');
      if (!otherUser) {
        return res.status(404).json({ success: false, message: 'User not found.' });
      }

      chat = await Chat.create({
        type: 'direct',
        participants: [req.user.id, otherUserId],
      });

      chat = await Chat.findById(chat._id).populate('participants', 'name avatar headline');
    }

    return res.status(200).json({ success: true, chat });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get messages in a chat
// @route   GET /api/chat/:chatId/messages
// @access  Private
const getMessages = async (req, res) => {
  try {
    const { page = 1, limit = 50 } = req.query;
    const chat = await Chat.findById(req.params.chatId)
      .populate({
        path: 'messages.sender',
        select: 'name avatar',
      });

    if (!chat) {
      return res.status(404).json({ success: false, message: 'Chat not found.' });
    }

    if (!chat.participants.some((p) => p.toString() === req.user.id)) {
      return res.status(403).json({ success: false, message: 'Not authorized.' });
    }

    // Pagination (most recent first)
    const total = chat.messages.length;
    const start = Math.max(0, total - parseInt(page) * parseInt(limit));
    const end = total - (parseInt(page) - 1) * parseInt(limit);
    const messages = chat.messages.slice(start, end).filter((m) => !m.isDeleted);

    // Mark messages as read
    const unreadMessages = chat.messages.filter(
      (m) => !m.readBy.includes(req.user.id)
    );
    if (unreadMessages.length > 0) {
      unreadMessages.forEach((m) => {
        if (!m.readBy.includes(req.user.id)) {
          m.readBy.push(req.user.id);
        }
      });
      await chat.save();
    }

    return res.status(200).json({
      success: true,
      messages,
      total,
      hasMore: start > 0,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Send message
// @route   POST /api/chat/:chatId/messages
// @access  Private
const sendMessage = async (req, res) => {
  try {
    const { content, type = 'text', replyTo } = req.body;
    const chat = await Chat.findById(req.params.chatId);

    if (!chat) {
      return res.status(404).json({ success: false, message: 'Chat not found.' });
    }

    if (!chat.participants.some((p) => p.toString() === req.user.id)) {
      return res.status(403).json({ success: false, message: 'Not authorized.' });
    }

    const message = {
      sender: req.user.id,
      content,
      type,
      replyTo,
      readBy: [req.user.id],
    };

    chat.messages.push(message);
    chat.lastMessage = {
      content: content.length > 100 ? content.substring(0, 100) + '...' : content,
      sender: req.user.id,
      createdAt: new Date(),
    };

    await chat.save();

    const newMessage = chat.messages[chat.messages.length - 1];

    // Populate sender before returning so frontend can render immediately
    const populated = {
      ...newMessage.toObject(),
      sender: { _id: req.user.id, name: req.user.name, avatar: req.user.avatar || null },
    };

    // Emit to ALL chat participants via socket (including sender for multi-device support)
    if (req.io) {
      req.io.to(`chat:${chat._id}`).emit('new_message', {
        chatId: chat._id,
        message: populated,
      });
    }

    return res.status(201).json({ success: true, message: populated });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Delete message
// @route   DELETE /api/chat/:chatId/messages/:messageId
// @access  Private
const deleteMessage = async (req, res) => {
  try {
    const chat = await Chat.findById(req.params.chatId);

    if (!chat) {
      return res.status(404).json({ success: false, message: 'Chat not found.' });
    }

    const message = chat.messages.id(req.params.messageId);
    if (!message) {
      return res.status(404).json({ success: false, message: 'Message not found.' });
    }

    if (message.sender.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not authorized.' });
    }

    message.isDeleted = true;
    message.content = 'This message was deleted.';
    message.deletedAt = new Date();
    await chat.save();

    if (req.io) {
      req.io.to(`chat:${chat._id}`).emit('message_deleted', {
        chatId: chat._id,
        messageId: req.params.messageId,
      });
    }

    return res.status(200).json({ success: true, message: 'Message deleted.' });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get unread count
// @route   GET /api/chat/unread
// @access  Private
const getUnreadCount = async (req, res) => {
  try {
    const chats = await Chat.find({ participants: req.user.id, isActive: true });
    let totalUnread = 0;

    chats.forEach((chat) => {
      const unread = chat.messages.filter(
        (m) => !m.readBy.includes(req.user.id) && m.sender.toString() !== req.user.id && !m.isDeleted
      ).length;
      totalUnread += unread;
    });

    return res.status(200).json({ success: true, unreadCount: totalUnread });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getChats,
  getOrCreateDirectChat,
  getMessages,
  sendMessage,
  deleteMessage,
  getUnreadCount,
};
