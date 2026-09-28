const mongoose = require('mongoose');

const prizeSchema = new mongoose.Schema(
  {
    position: { type: String, required: true }, // e.g. "1st Winner"
    amount: { type: Number, required: true },
    currency: { type: String, default: 'INR' },
  },
  { _id: false }
);

const judgingParameterSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    weightage: { type: String, default: null }, // e.g. "30%"
    description: { type: String, default: null },
  },
  { _id: false }
);

const previousWinnerSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    position: { type: String, required: true }, // e.g. "1st Winner"
    avatar: { type: String, default: null },
  },
  { _id: false }
);

const competitionSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Competition title is required'],
      trim: true,
      maxlength: [200, 'Title must not exceed 200 characters'],
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },
    description: {
      type: String,
      required: [true, 'Description is required'],
      maxlength: [5000, 'Description must not exceed 5000 characters'],
    },
    bannerImage: {
      type: String,
      default: null,
    },
    category: {
      type: String,
      required: true,
      trim: true,
    },
    tags: [{ type: String, trim: true }], // e.g. ["Dance", "Multi-Win"]

    // Organizer / Judge info
    organizer: {
      name: { type: String, required: true },
      title: { type: String, default: null }, // e.g. "Professional Kathak Dancer"
      experience: { type: String, default: null }, // e.g. "12+ Years of Experience"
      avatar: { type: String, default: null },
      introVideo: { type: String, default: null },
    },

    // Financial
    prizePool: { type: Number, default: 0 },
    entryFee: { type: Number, default: 0 },
    currency: { type: String, default: 'INR' },
    prizes: [prizeSchema],

    // Dates — all stored in UTC
    registrationStartAt: {
      type: Date,
      required: [true, 'Registration start date is required'],
    },
    registrationEndAt: {
      type: Date,
      required: [true, 'Registration end date is required'],
    },
    submissionStartAt: {
      type: Date,
      default: null,
    },
    submissionEndAt: {
      type: Date,
      default: null,
    },
    startAt: {
      type: Date,
      required: [true, 'Competition start date is required'],
    },
    endAt: {
      type: Date,
      required: [true, 'Competition end date is required'],
    },
    resultAt: {
      type: Date,
      default: null,
    },

    // Capacity
    capacity: {
      type: Number,
      required: [true, 'Capacity is required'],
      min: [1, 'Capacity must be at least 1'],
    },
    registeredCount: {
      type: Number,
      default: 0,
      min: 0,
    },

    // Content
    rules: [{ type: String }],
    eligibility: [{ type: String }],
    judgingParameters: [judgingParameterSchema],
    previousWinners: [previousWinnerSchema],

    // Metadata
    certificateProvided: { type: Boolean, default: false },
    disclaimer: { type: String, default: null },
    referralEnabled: { type: Boolean, default: false },
  },
  {
    timestamps: true,
    toJSON: {
      transform(doc, ret) {
        ret.id = ret._id;
        delete ret._id;
        delete ret.__v;
        return ret;
      },
    },
  }
);

// Indexes for efficient queries (slug index already created by unique: true)
competitionSchema.index({ startAt: 1 });
competitionSchema.index({ endAt: 1 });
competitionSchema.index({ category: 1 });
competitionSchema.index({ registrationEndAt: 1 });

/**
 * Virtual: remainingSlots — derived, never stored independently.
 */
competitionSchema.virtual('remainingSlots').get(function () {
  return Math.max(0, this.capacity - this.registeredCount);
});

// Ensure virtuals are included in JSON output
competitionSchema.set('toJSON', {
  virtuals: true,
  transform(doc, ret) {
    ret.id = ret._id;
    delete ret._id;
    delete ret.__v;
    return ret;
  },
});

competitionSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Competition', competitionSchema);
