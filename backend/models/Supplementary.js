const mongoose = require('mongoose');

// ============ NOTIFICATION MODEL ============
const NotificationSchema = new mongoose.Schema(
  {
    recipient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    type: {
      type: String,
      enum: [
        'registration_approved', 'registration_rejected', 'registration_pending',
        'team_invite', 'team_join_request', 'team_invite_accepted', 'team_invite_rejected',
        'event_reminder', 'event_update', 'event_cancelled', 'event_started',
        'announcement', 'certificate_issued', 'badge_awarded',
        'comment_reply', 'comment_like', 'mention',
        'leaderboard_rank', 'system', 'payment_success', 'payment_failed',
      ],
      required: true,
    },
    title: { type: String, required: true },
    message: { type: String, required: true },
    link: String,
    image: String,
    data: { type: mongoose.Schema.Types.Mixed },
    isRead: { type: Boolean, default: false },
    readAt: Date,
    priority: {
      type: String,
      enum: ['low', 'medium', 'high'],
      default: 'medium',
    },
  },
  { timestamps: true }
);

NotificationSchema.index({ recipient: 1, isRead: 1 });
NotificationSchema.index({ createdAt: -1 });

// ============ CERTIFICATE MODEL ============
const CertificateSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    event: { type: mongoose.Schema.Types.ObjectId, ref: 'Event', required: true },
    team: { type: mongoose.Schema.Types.ObjectId, ref: 'Team' },
    certificateId: { type: String, unique: true, required: true },
    type: {
      type: String,
      enum: ['participation', 'winner', 'runner-up', 'organizer', 'mentor', 'judge'],
      default: 'participation',
    },
    issuedAt: { type: Date, default: Date.now },
    downloadUrl: String,
    cloudinaryPublicId: String,
    qrCode: String,
    verificationUrl: String,
    isValid: { type: Boolean, default: true },
    revokedAt: Date,
    revokeReason: String,
    metadata: {
      rank: Number,
      score: Number,
      achievement: String,
    },
  },
  { timestamps: true }
);

CertificateSchema.index({ user: 1 });
CertificateSchema.index({ event: 1 });

// ============ COMMENT MODEL ============
const CommentSchema = new mongoose.Schema(
  {
    event: { type: mongoose.Schema.Types.ObjectId, ref: 'Event', required: true },
    author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    content: {
      type: String,
      required: true,
      maxlength: [2000, 'Comment cannot exceed 2000 characters'],
    },
    type: {
      type: String,
      enum: ['comment', 'question', 'announcement', 'update'],
      default: 'comment',
    },
    parentComment: { type: mongoose.Schema.Types.ObjectId, ref: 'Comment' },
    replies: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Comment' }],
    likes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    isPinned: { type: Boolean, default: false },
    isAnswered: { type: Boolean, default: false },
    isDeleted: { type: Boolean, default: false },
    isEdited: { type: Boolean, default: false },
    editedAt: Date,
    mentions: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    attachments: [{ url: String, type: String }],
  },
  { timestamps: true }
);

CommentSchema.index({ event: 1, type: 1 });
CommentSchema.index({ parentComment: 1 });
CommentSchema.index({ author: 1 });

// ============ BADGE DEFINITION MODEL ============
const BadgeDefinitionSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, unique: true },
    description: { type: String, required: true },
    icon: { type: String, default: 'badge' },
    color: String,
    category: {
      type: String,
      enum: ['participation', 'achievement', 'contribution', 'special', 'milestone'],
      required: true,
    },
    criteria: {
      type: String,
      required: true,
    },
    pointsRequired: { type: Number, default: 0 },
    eventsRequired: { type: Number, default: 0 },
    isAutoAwarded: { type: Boolean, default: true },
    isRare: { type: Boolean, default: false },
    pointsReward: { type: Number, default: 0 },
    level: { type: Number, default: 1 },
  },
  { timestamps: true }
);

// ============ REPORT MODEL ============
const ReportSchema = new mongoose.Schema(
  {
    reporter: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    targetType: {
      type: String,
      enum: ['event', 'user', 'comment', 'team'],
      required: true,
    },
    targetId: { type: mongoose.Schema.Types.ObjectId, required: true },
    reason: {
      type: String,
      enum: ['spam', 'inappropriate', 'misleading', 'abuse', 'copyright', 'other'],
      required: true,
    },
    description: String,
    status: {
      type: String,
      enum: ['pending', 'reviewed', 'action_taken', 'dismissed'],
      default: 'pending',
    },
    reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    reviewedAt: Date,
    action: String,
  },
  { timestamps: true }
);

ReportSchema.index({ status: 1, targetType: 1 });

module.exports = {
  Notification: mongoose.model('Notification', NotificationSchema),
  Certificate: mongoose.model('Certificate', CertificateSchema),
  Comment: mongoose.model('Comment', CommentSchema),
  BadgeDefinition: mongoose.model('BadgeDefinition', BadgeDefinitionSchema),
  Report: mongoose.model('Report', ReportSchema),
};
