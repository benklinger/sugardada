// models/InvestmentRecord.js

const mongoose = require('mongoose');

const investmentRecordSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  ticker: {
    type: String,
    required: true,
  },
  investment: {
    type: Number,
    required: true,
  },
  simulatedDate: {
    type: Date,
    required: true,
  },
  historicalDate: {
    type: Date,
    required: true,
  },
  totalInvestment: {
    type: Number,
    required: true,
  },
  sharePrice: {
    type: Number,
    required: true,
  },
  sharesPurchased: {
    type: Number,
    required: true,
  },
  totalValue: {
    type: Number,
    required: true,
  },
  interest: {
    type: Number,
    required: true,
  },
});

const InvestmentRecord = mongoose.model('InvestmentRecord', investmentRecordSchema);

module.exports = InvestmentRecord;