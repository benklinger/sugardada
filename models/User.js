// models/User.js

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
    min: [0, 'Monthly investment must be a non-negative number']
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('User', userSchema);