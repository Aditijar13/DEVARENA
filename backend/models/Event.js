const mongoose = require('mongoose');
const slugify = require('slugify');

const PrizeSchema = new mongoose.Schema({
  position: { type: String, required: true },
  amount: { type: Number },
  description: String,
  perks: [String],
});

const ScheduleSchema = new mongoose.Schema({
  date: { type: Date, required: true },
  time: String,
  title: { type: String, required: true },
  description: String,
  speaker: String,
  duration: String,
  type: {
    type: String,
    enum: ['session', 'break', 'workshop', 'keynote', 'panel', 'networking', 'other'],
    default: 'session',
  },
});

const FAQSchema = new mongoose.Schema({
  question: { type: String, required: true },
  answer: { type: String, required: true },
});

const SponsorSchema = new mongoose.Schema({
  name: { type: String, required: true },
  logo: String,
  tier: { type: String, enum: ['title', 'gold', 'silver', 'bronze', 'community'] },
  website: String,
});

const RegistrationSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  team: { type: mongoose.Schema.Types.ObjectId, ref: 'Team' },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected', 'waitlisted', 'cancelled'],
    default: 'pending',
  },
  registeredAt: { type: Date, default: Date.now },
  approvedAt: Date,
  rejectedAt: Date,
  customAnswers: [{ question: String, answer: String }],
  paymentId: String,
  paymentStatus: {
    type: String,
    enum: ['pending', 'completed', 'failed', 'refunded'],
  },
  checkInStatus: { type: Boolean, default: false },
  checkInTime: Date,
  certificateIssued: { type: Boolean, default: false },
});

const EventSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Event title is required'],
      trim: true,
      maxlength: [200, 'Title cannot exceed 200 characters'],
    },
    slug: { type: String, unique: true },
    description: {
      type: String,
      required: [true, 'Event description is required'],
      maxlength: [10000, 'Description cannot exceed 10000 characters'],
    },
    shortDescription: {
      type: String,
      maxlength: [300, 'Short description cannot exceed 300 characters'],
    },
    organizer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    coOrganizers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    
    // Categorization
    category: {
      type: String,
      required: true,
      enum: [
        'hackathon', 'workshop', 'webinar', 'conference', 'competition',
        'seminar', 'meetup', 'bootcamp', 'startup', 'cultural', 'gaming',
        'open-source', 'networking', 'other'
      ],
    },
    tags: [{ type: String, trim: true, lowercase: true }],
    
    // Event Details
    mode: {
      type: String,
      enum: ['online', 'offline', 'hybrid'],
      required: true,
    },
    location: {
      venue: String,
      address: String,
      city: String,
      state: String,
      country: String,
      pincode: String,
      googleMapsLink: String,
      onlineLink: String,
      platform: String, // Zoom, Google Meet, Discord, etc.
    },
    
    // Dates
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    registrationOpenDate: { type: Date, default: Date.now },
    registrationDeadline: { type: Date, required: true },
    
    // Media
    banner: { type: String, default: '' },
    bannerPublicId: String,
    gallery: [String],
    brochure: String,
    video: String,
    
    // Registration Settings
    maxParticipants: { type: Number, default: 0 }, // 0 = unlimited
    registrations: [RegistrationSchema],
    registeredCount: { type: Number, default: 0 },
    waitlistEnabled: { type: Boolean, default: false },
    requiresApproval: { type: Boolean, default: false },
    customQuestions: [{ question: String, required: Boolean, type: String }],
    
    // Team Settings
    isTeamEvent: { type: Boolean, default: false },
    minTeamSize: { type: Number, default: 1 },
    maxTeamSize: { type: Number, default: 4 },
    allowSoloParticipation: { type: Boolean, default: true },
    
    // Pricing
    isPaid: { type: Boolean, default: false },
    price: { type: Number, default: 0 },
    currency: { type: String, default: 'INR' },
    razorpayPlanId: String,
    paymentRef: String,  // Razorpay order reference
    earlyBirdPrice: Number,
    earlyBirdDeadline: Date,
    
    // Content
    prizes: [PrizeSchema],
    schedule: [ScheduleSchema],
    faqs: [FAQSchema],
    sponsors: [SponsorSchema],
    requirements: [String],
    skills: [String], // Skills participants should have
    resources: [{ title: String, link: String, type: String }],
    
    // Status & Visibility
    status: {
      type: String,
      enum: ['draft', 'upcoming', 'ongoing', 'completed', 'cancelled'],
      default: 'draft',
    },
    isPublished: { type: Boolean, default: false },
    isFeatured: { type: Boolean, default: false },
    isVerified: { type: Boolean, default: false },
    isSponsored: { type: Boolean, default: false },
    
    // Engagement
    views: { type: Number, default: 0 },
    bookmarks: { type: Number, default: 0 },
    shares: { type: Number, default: 0 },
    likes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    
    // Judging
    judges: [{
      name: String,
      designation: String,
      company: String,
      avatar: String,
      bio: String,
    }],
    judgingCriteria: [{ criterion: String, weightage: Number }],
    
    // Certificates
    certificatesEnabled: { type: Boolean, default: true },
    certificateTemplate: String,
    
    // Analytics
    analytics: {
      totalViews: { type: Number, default: 0 },
      uniqueViews: { type: Number, default: 0 },
      conversionRate: { type: Number, default: 0 },
      revenue: { type: Number, default: 0 },
    },
    
    // Report & moderation
    reports: [{
      user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      reason: String,
      createdAt: { type: Date, default: Date.now },
    }],
    isRemoved: { type: Boolean, default: false },
    removeReason: String,
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Indexes
EventSchema.index({ title: 'text', description: 'text', tags: 'text' });
EventSchema.index({ category: 1, status: 1 });
EventSchema.index({ startDate: 1 });
EventSchema.index({ 'location.city': 1 });
EventSchema.index({ organizer: 1 });
EventSchema.index({ isFeatured: 1, isPublished: 1 });

// Virtual: Days remaining for registration
EventSchema.virtual('daysToDeadline').get(function () {
  const diff = this.registrationDeadline - new Date();
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
});

// Virtual: Is registration open
EventSchema.virtual('isRegistrationOpen').get(function () {
  const now = new Date();
  return (
    now >= this.registrationOpenDate &&
    now <= this.registrationDeadline &&
    (this.maxParticipants === 0 || this.registeredCount < this.maxParticipants) &&
    (this.status === 'upcoming' || this.status === 'ongoing')
  );
});

// Pre-save: Generate slug
EventSchema.pre('save', async function (next) {
  if (this.isModified('title')) {
    let slug = slugify(this.title, { lower: true, strict: true });
    const existingEvent = await mongoose.model('Event').findOne({ slug, _id: { $ne: this._id } });
    if (existingEvent) {
      slug = `${slug}-${Date.now()}`;
    }
    this.slug = slug;
  }

  // Auto update status
  const now = new Date();
  if (this.isPublished) {
    if (now < this.startDate) {
      this.status = 'upcoming';
    } else if (now >= this.startDate && now <= this.endDate) {
      this.status = 'ongoing';
    } else if (now > this.endDate) {
      this.status = 'completed';
    }
  }

  next();
});

module.exports = mongoose.model('Event', EventSchema);
