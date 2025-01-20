const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  gender: {
    type: String,
    enum: ['Boy', 'Girl'],
    required: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  dob: {
    type: Date,
    required: true
  },
  monthlyInvestment: {
    type: Number,
    required: true,
	default: 50,
    min: [0, 'Monthly investment must be a non-negative number']
  },
  riskLevel: {
    type: String,
    enum: ['Low', 'Medium', 'High'],
    required: true
  },
  investmentTicker: {
    type: String,
    enum: ['SPY', 'QQQ', 'SOXX'],
    required: true
  },
  hasIBAccount: {
    type: String,
    enum: ['Yes', 'No'],
    required: true
  },
  email: {
	type: String,
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('User', userSchema);