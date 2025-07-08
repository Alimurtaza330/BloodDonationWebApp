const mongoose = require('mongoose');

const userProfileSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  phoneNum: {
    type: String,
    required: true,
    trim: true
  },
  whatsappNum: {
    type: String,
    required: true,
    trim: true
  },
  age: {
    type: Number,
    required: true,
    min: 18,
    max: 65
  },
  city: {
    type: String,
    required: true,
    trim: true
  },
  bloodGroup: {
    type: String,
    required: true,
    enum: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']
  },
  isAvailable: {
    type: Boolean,
    default: true
  },
  lastDonationDate: {
    type: Date,
    default: null
  },
  availableAfter: {
    type: Date,
    default: null
  },
  totalDonations: {
    type: Number,
    default: 0
  },
  rating: {
    type: Number,
    default: 0,
    min: 0,
    max: 5
  },
  totalRatings: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

// Method to check if user is available for donation
userProfileSchema.methods.checkAvailability = function() {
  if (!this.isAvailable) return false;
  if (this.availableAfter && new Date() < this.availableAfter) return false;
  return true;
};

// Method to mark user as donated
userProfileSchema.methods.markAsDonated = function() {
  this.lastDonationDate = new Date();
  this.availableAfter = new Date(Date.now() + 5 * 30 * 24 * 60 * 60 * 1000); // 5 months
  this.isAvailable = false;
  this.totalDonations += 1;
  return this.save();
};

// Method to make user available again after 5 months
userProfileSchema.methods.makeAvailable = function() {
  if (this.availableAfter && new Date() >= this.availableAfter) {
    this.isAvailable = true;
    this.availableAfter = null;
    return this.save();
  }
  return false;
};

module.exports = mongoose.model('UserProfile', userProfileSchema);