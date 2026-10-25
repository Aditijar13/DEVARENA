const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const SocialLinksSchema = new mongoose.Schema({
  github: { type: String, default: '' },
  linkedin: { type: String, default: '' },
  portfolio: { type: String, default: '' },
  twitter: { type: String, default: '' },
  devto: { type: String, default: '' },
});

const BadgeSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: String,
  icon: String,
  category: {
    type: String,
    enum: ['participation', 'achievement', 'contribution', 'special', 'milestone'],
    default: 'participation',
  },
  awardedAt: { type: Date, default: Date.now },
});

const ExperienceSchema = new mongoose.Schema({
  title: String,
  role: String,
  company: String,
  startDate: Date,
  endDate: Date,
  current: { type: Boolean, default: false },
  description: String,
});

const EducationSchema = new mongoose.Schema({
  institution: String,
  degree: String,
  field: String,
  startYear: Number,
  endYear: Number,
  grade: String,
});

const UserSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      maxlength: [100, 'Name cannot exceed 100 characters'],
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email'],
    },
    password: {
      type: String,
      minlength: [6, 'Password must be at least 6 characters'],
      select: false,
    },
    googleId: { type: String, unique: true, sparse: true },
    role: {
      type: String,
      enum: ['participant', 'organizer', 'admin'],
      default: 'participant',
    },
    avatar: {
      type: String,
      default: '',
    },
    avatarPublicId: String,
    bio: {
      type: String,
      maxlength: [500, 'Bio cannot exceed 500 characters'],
      default: '',
    },
    headline: {
      type: String,
      maxlength: [150, 'Headline cannot exceed 150 characters'],
      default: '',
    },
    mobile: {
      type: String,
      default: '',
    },
    gender: {
      type: String,
      enum: ['male', 'female', 'other', 'prefer-not-to-say', ''],
      default: '',
    },
    dateOfBirth: {
      type: Date,
    },
    location: {
      city: String,
      state: String,
      country: String,
    },
    skills: [{ type: String, trim: true }],
    interests: [{ type: String, trim: true }],
    socialLinks: { type: SocialLinksSchema, default: () => ({}) },
    experience: [ExperienceSchema],
    education: [EducationSchema],
    
    // Gamification
    points: { type: Number, default: 0 },
    level: { type: Number, default: 1 },
    badges: [BadgeSchema],
    streak: { type: Number, default: 0 },
    lastActiveDate: { type: Date, default: Date.now },
    
    // Event tracking
    bookmarkedEvents: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Event' }],
    participationHistory: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Event' }],
    
    // Account
    isVerified: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true },
    isBanned: { type: Boolean, default: false },
    banReason: String,
    verificationToken: String,
    verificationTokenExpiry: Date,
    resetPasswordToken: String,
    resetPasswordExpiry: Date,
    
    // Notification preferences
    notificationPreferences: {
      email: { type: Boolean, default: true },
      eventReminders: { type: Boolean, default: true },
      teamInvites: { type: Boolean, default: true },
      announcements: { type: Boolean, default: true },
      marketing: { type: Boolean, default: false },
    },
    
    // Stats
    stats: {
      eventsCreated: { type: Number, default: 0 },
      eventsJoined: { type: Number, default: 0 },
      teamsCreated: { type: Number, default: 0 },
      teamsJoined: { type: Number, default: 0 },
      hackathonsWon: { type: Number, default: 0 },
      certificatesEarned: { type: Number, default: 0 },
    },
    
    // Calendar integrations
    googleCalendarToken: String,
    
    lastLogin: { type: Date },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Indexes
UserSchema.index({ name: 'text', bio: 'text', skills: 'text' });
UserSchema.index({ points: -1 });
UserSchema.index({ role: 1 });

// Virtual: Profile completion percentage
UserSchema.virtual('profileCompletion').get(function () {
  let score = 0;
  const fields = ['avatar', 'bio', 'headline', 'location', 'skills', 'interests', 'education'];
  fields.forEach((field) => {
    if (this[field] && (Array.isArray(this[field]) ? this[field].length > 0 : this[field])) {
      score += Math.floor(100 / fields.length);
    }
  });
  return Math.min(score, 100);
});

// Pre-save: hash password
UserSchema.pre('save', async function (next) {
  if (!this.isModified('password') || !this.password) return next();
  const salt = await bcrypt.genSalt(12);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Method: compare password
UserSchema.methods.comparePassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// Method: add points and handle level up
UserSchema.methods.addPoints = async function (pts, reason) {
  this.points += pts;
  // Level calculation: level = floor(sqrt(points/100)) + 1
  this.level = Math.floor(Math.sqrt(this.points / 100)) + 1;
  await this.save();
};

// Method: award badge if not already awarded
UserSchema.methods.awardBadge = async function (badge) {
  const exists = this.badges.some((b) => b.name === badge.name);
  if (!exists) {
    this.badges.push(badge);
    await this.save();
    return true;
  }
  return false;
};

module.exports = mongoose.model('User', UserSchema);
