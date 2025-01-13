// models/User.js

const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  gender: {
    type: String,
    enum: ['Boy', 'Girl'], // Ensure these are capitalized
    required: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('User', userSchema);