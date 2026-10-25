const mongoose = require('mongoose');

const MessageSchema = new mongoose.Schema({
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  content: { type: String, required: true, maxlength: 5000 },
  type: {
    type: String,
    enum: ['text', 'image', 'file', 'system', 'code'],
    default: 'text',
  },
  attachments: [{
    url: String,
    name: String,
    type: String,
    size: Number,
  }],
  readBy: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  reactions: [{
    emoji: String,
    users: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  }],
  replyTo: { type: mongoose.Schema.Types.ObjectId },
  isEdited: { type: Boolean, default: false },
  isDeleted: { type: Boolean, default: false },
  deletedAt: Date,
  pinnedAt: Date,
  createdAt: { type: Date, default: Date.now },
});

const ChatSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ['direct', 'team', 'event'],
      required: true,
    },
    name: String, // For group chats
    avatar: String,
    participants: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    admins: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    team: { type: mongoose.Schema.Types.ObjectId, ref: 'Team' },
    event: { type: mongoose.Schema.Types.ObjectId, ref: 'Event' },
    messages: [MessageSchema],
    lastMessage: {
      content: String,
      sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      createdAt: Date,
    },
    isActive: { type: Boolean, default: true },
    settings: {
      allowInvites: { type: Boolean, default: true },
      onlyAdminsCanMessage: { type: Boolean, default: false },
    },
  },
  {
    timestamps: true,
  }
);

ChatSchema.index({ participants: 1 });
ChatSchema.index({ team: 1 });
ChatSchema.index({ event: 1 });
ChatSchema.index({ type: 1 });

module.exports = mongoose.model('Chat', ChatSchema);
