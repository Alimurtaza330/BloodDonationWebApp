const mongoose = require('mongoose');

const bloodRequestSchema = new mongoose.Schema({
  requesterId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  donorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  bloodGroup: {
    type: String,
    required: true,
    enum: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']
  },
  status: {
    type: String,
    enum: ['pending', 'accepted', 'rejected', 'completed', 'cancelled'],
    default: 'pending'
  },
  urgency: {
    type: String,
    enum: ['low', 'medium', 'high', 'critical'],
    default: 'medium'
  },
  message: {
    type: String,
    maxLength: 500
  },
  hospitalName: {
    type: String,
    trim: true
  },
  hospitalAddress: {
    type: String,
    trim: true
  },
  requiredDate: {
    type: Date,
    required: true
  },
  acceptedAt: {
    type: Date
  },
  completedAt: {
    type: Date
  },
  donationCompleted: {
    type: Boolean,
    default: false
  },
  rating: {
    type: Number,
    min: 1,
    max: 5
  },
  feedback: {
    type: String,
    maxLength: 500
  }
}, {
  timestamps: true
});

// Index for efficient querying
bloodRequestSchema.index({ donorId: 1, status: 1 });
bloodRequestSchema.index({ requesterId: 1, status: 1 });
bloodRequestSchema.index({ createdAt: -1 });

module.exports = mongoose.model('BloodRequest', bloodRequestSchema);