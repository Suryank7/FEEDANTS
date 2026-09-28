const mongoose = require('mongoose');

const participationSchema = new mongoose.Schema(
  {
    competitionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Competition',
      required: [true, 'Competition ID is required'],
      index: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required'],
      index: true,
    },
    status: {
      type: String,
      enum: ['REGISTERED', 'CANCELLED', 'COMPLETED'],
      default: 'REGISTERED',
    },
    registeredAt: {
      type: Date,
      default: Date.now,
    },
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

/**
 * Compound unique index: prevents duplicate registration.
 * A user can only have ONE active participation per competition.
 */
participationSchema.index(
  { competitionId: 1, userId: 1 },
  { unique: true }
);

module.exports = mongoose.model('Participation', participationSchema);
