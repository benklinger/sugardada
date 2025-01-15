// models/InvestmentRecord.js

const mongoose = require('mongoose');

const investmentRecordSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  simulatedDate: {
    type: Date,
    required: true
  },
  historicalDate: {
    type: Date,
    required: true
  },
  totalInvestment: {
    type: Number,
    required: true,
    min: [0, 'Total investment must be a non-negative number']
  },
  sharePrice: {
    type: Number,
    required: true,
    min: [0, 'Share price must be a non-negative number']
  },
  sharesPurchased: {
    type: Number,
    required: true,
    min: [0, 'Shares purchased must be a non-negative number']
  },
  totalValue: {
    type: Number,
    required: true,
    min: [0, 'Total value must be a non-negative number']
  },
  interest: {
    type: Number,
    required: true,
    min: [0, 'Interest must be a non-negative number']
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('InvestmentRecord', investmentRecordSchema);