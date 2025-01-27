const mongoose = require('mongoose');
const User = require('../models/User');
const { generateInvestmentRecords } = require('../services/investmentCalculator');
const { riskToTickerMap } = require('../config/maps');

exports.getInvestmentRecordsByParam = async (req, res) => {
  try {
    const { userId } = req.params;
    if (!userId) {
      return res.status(400).json({ error: 'No userId param provided.' });
    }
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }
    const today = new Date();
    const investmentRecords = await generateInvestmentRecords(user, today);
    return res.json({ investmentRecords });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to fetch investment records by param.' });
  }
};

exports.updateMonthlyInvestmentByParam = async (req, res) => {
  try {
    const { userId } = req.params;
    if (!userId) {
      return res.status(400).json({ error: 'No userId param provided.' });
    }
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }
    const { action } = req.body;
    if (action === 'decrement') {
      user.monthlyInvestment -= 50;
      if (user.monthlyInvestment < 0) user.monthlyInvestment = 0;
    } else {
      user.monthlyInvestment += 50;
    }
    await user.save();
    const today = new Date();
    const investmentRecords = await generateInvestmentRecords(user, today);
    if (investmentRecords && investmentRecords.length > 0) {
      const latest = investmentRecords[investmentRecords.length - 1];
      const { totalValue, totalInvestment } = latest;
      const interest = totalValue - totalInvestment;
      const roiPct = totalInvestment > 0 ? (interest / totalInvestment).toFixed(2) * 100 : 0;
      const totalProfit = Math.round(interest);
      return res.json({
        message: 'Monthly investment updated successfully.',
        monthlyInvestment: user.monthlyInvestment,
        estValue: Math.round(totalValue),
        roiPct,
        investmentRecords,
        totalProfit
      });
    } else {
      return res.json({
        message: 'Monthly investment updated, but no investment records found.',
        monthlyInvestment: user.monthlyInvestment,
        investmentRecords: [],
        roiPct: 0,
        totalProfit: 0,
        estValue: 0
      });
    }
  } catch (error) {
    return res.status(500).json({ error: 'Failed to update monthly investment.' });
  }
};

function getNextRiskLevel(current) {
  const levels = ["Low","Medium","High"];
  const idx = levels.indexOf(current);
  return levels[(idx + 1) % levels.length];
}

exports.updateRiskByParam = async (req, res) => {
  try {
    const { userId } = req.params;
    if (!userId) {
      return res.status(400).json({ error: 'No userId param provided.' });
    }
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }
    const nextRisk = getNextRiskLevel(user.riskLevel);
    user.riskLevel = nextRisk;
    user.investmentTicker = riskToTickerMap[nextRisk] || 'SPY';
    await user.save();
    const investmentRecords = await generateInvestmentRecords(user, new Date());
    if (!investmentRecords || !investmentRecords.length) {
      return res.json({
        message: 'Risk updated, but no records found.',
        riskLevel: user.riskLevel,
        investmentTicker: user.investmentTicker,
        monthlyInvestment: user.monthlyInvestment,
        estValue: 0,
        roiPct: 0,
        totalProfit: 0
      });
    }
    const latest = investmentRecords[investmentRecords.length - 1];
    const { totalValue, totalInvestment } = latest;
    const interest = totalValue - totalInvestment;
    const roiPct = totalInvestment > 0 ? (interest / totalInvestment).toFixed(2) * 100 : 0;
    return res.json({
      message: 'Risk updated successfully.',
      riskLevel: user.riskLevel,
      investmentTicker: user.investmentTicker,
      monthlyInvestment: user.monthlyInvestment,
      estValue: Math.round(totalValue),
      roiPct,
      totalProfit: Math.round(interest)
    });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to update risk.' });
  }
};

exports.updateTargetAge = async (req, res) => {
  try {
    const { userId } = req.params;
    if (!userId) {
      return res.status(400).json({ error: 'No userId param provided' });
    }
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const possibleAges = [12, 15, 18, 21];
    const currentIndex = possibleAges.indexOf(user.targetAge || 18);
    const nextIndex = (currentIndex + 1) % possibleAges.length;
    user.targetAge = possibleAges[nextIndex];
    await user.save();

    const today = new Date();
    const investmentRecords = await generateInvestmentRecords(user, today, user.targetAge);
    if (!investmentRecords || !investmentRecords.length) {
      return res.json({
        message: 'Target age updated, but no records found.',
        targetAge: user.targetAge,
        monthlyInvestment: user.monthlyInvestment,
        estValue: 0,
        roiPct: 0,
        totalProfit: 0,
        investmentRecords: []
      });
    }

    const latest = investmentRecords[investmentRecords.length - 1];
    const { totalValue, totalInvestment } = latest;
    const interest = totalValue - totalInvestment;
    const roiPct = totalInvestment > 0 ? (interest / totalInvestment).toFixed(2) * 100 : 0;
    return res.json({
      message: 'Target age updated successfully',
      targetAge: user.targetAge,
      monthlyInvestment: user.monthlyInvestment,
      estValue: Math.round(totalValue),
      roiPct,
      totalProfit: Math.round(interest),
      investmentRecords
    });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to update target age' });
  }
};