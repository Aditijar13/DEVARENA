const mongoose = require('mongoose');

const MemberSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  role: {
    type: String,
    enum: ['leader', 'co-leader', 'member'],
    default: 'member',
  },
  skills: [String],
  joinedAt: { type: Date, default: Date.now },
  contribution: { type: String, default: '' },
});

const InviteSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  email: String,
  status: {
    type: String,
    enum: ['pending', 'accepted', 'rejected', 'expired'],
    default: 'pending',
  },
  invitedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  invitedAt: { type: Date, default: Date.now },
  expiresAt: {
    type: Date,
    default: () => new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
  },
});

const JoinRequestSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  message: String,
  skills: [String],
  status: {
    type: String,
    enum: ['pending', 'accepted', 'rejected'],
    default: 'pending',
  },
  requestedAt: { type: Date, default: Date.now },
});

const TeamSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Team name is required'],
      trim: true,
      maxlength: [100, 'Team name cannot exceed 100 characters'],
    },
    description: {
      type: String,
      maxlength: [500, 'Description cannot exceed 500 characters'],
      default: '',
    },
    avatar: { type: String, default: '' },
    event: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Event',
      required: true,
    },
    leader: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    members: [MemberSchema],
    invites: [InviteSchema],
    joinRequests: [JoinRequestSchema],
    
    requiredSkills: [String],
    openRoles: [{
      role: String,
      skills: [String],
      filled: { type: Boolean, default: false },
    }],
    
    maxSize: { type: Number, default: 4 },
    isOpen: { type: Boolean, default: true },
    isComplete: { type: Boolean, default: false },
    
    // Chat room
    chatRoom: { type: mongoose.Schema.Types.ObjectId, ref: 'Chat' },
    
    // Submission
    projectTitle: String,
    projectDescription: String,
    projectLink: String,
    githubLink: String,
    demoLink: String,
    submittedAt: Date,
    
    // Results
    rank: Number,
    score: Number,
    prize: String,
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

TeamSchema.index({ event: 1 });
TeamSchema.index({ leader: 1 });
TeamSchema.index({ 'members.user': 1 });
TeamSchema.index({ name: 'text', description: 'text' });

TeamSchema.virtual('memberCount').get(function () {
  return this.members.length;
});

TeamSchema.virtual('availableSlots').get(function () {
  return this.maxSize - this.members.length;
});

module.exports = mongoose.model('Team', TeamSchema);
