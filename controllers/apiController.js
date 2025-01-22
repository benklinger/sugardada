const mongoose = require('mongoose');
const User = require('../models/User');
const { generateInvestmentRecords } = require('../services/investmentCalculator');
const { riskToTickerMap } = require('../config/maps'); 

// Helper
function getNextRiskLevel(current) {
  const levels = ["Low","Medium","High"];
  const idx = levels.indexOf(current);
  return levels[(idx + 1) % levels.length];
}

exports.getInvestmentRecords = async (req, res) => {
  try {
    const userId = req.session.userId;
    if (!userId) return res.status(400).json({ error: 'User not found in session.' });

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ error: 'User not found.' });

    const today = new Date();
    const investmentRecords = await generateInvestmentRecords(user, today);

    res.json({ investmentRecords });
  } catch (error) {
    console.error('Error fetching investment records:', error);
    res.status(500).json({ error: 'Failed to fetch investment records.' });
  }
};

exports.updateMonthlyInvestment = async (req, res) => {
  try {
    const userId = req.session.userId;
    if (!userId) {
      return res.status(400).json({ error: 'User not found in session.' });
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
      const latestRecord = investmentRecords[investmentRecords.length - 1];
      const { totalValue, totalInvestment } = latestRecord;
      const interest = totalValue - totalInvestment;
      const roiMultiple = totalInvestment > 0
        ? (interest / totalInvestment).toFixed(2)
        : '0.00';
      const totalProfit = Math.round(interest);

      res.json({
        message: 'Monthly investment updated successfully.',
        monthlyInvestment: user.monthlyInvestment,
        investmentRecords,
        roiMultiple,
        totalProfit,
      });
    } else {
      res.json({
        message: 'Monthly investment updated, but no investment records found.',
        monthlyInvestment: user.monthlyInvestment,
        investmentRecords: [],
        roiMultiple: '0.00',
        totalProfit: 0,
      });
    }
  } catch (error) {
    res.status(500).json({ error: 'Failed to update monthly investment.' });
  }
};

exports.updateRisk = async (req, res) => {
  try {
    const userId = req.session.userId;
    if (!userId) {
      return res.status(400).json({ error: 'No user in session.' });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }

    const nextRisk = getNextRiskLevel(user.riskLevel);
    user.riskLevel = nextRisk;
    user.investmentTicker = riskToTickerMap[nextRisk];
    await user.save();

    const investmentRecords = await generateInvestmentRecords(user, new Date());
    if (!investmentRecords || !investmentRecords.length) {
      return res.json({
        message: 'Risk updated, but no records found.',
        riskLevel: user.riskLevel,
        investmentTicker: user.investmentTicker,
        monthlyInvestment: user.monthlyInvestment,
        estValue: 0,
        roiMultiple: '0.00',
        totalProfit: 0
      });
    }

    const latest = investmentRecords[investmentRecords.length - 1];
    const totalValue = latest.totalValue;
    const totalInvestment = latest.totalInvestment;
    const interest = totalValue - totalInvestment;
    const roiMultiple = totalInvestment > 0
      ? (interest / totalInvestment).toFixed(2)
      : '0.00';

    res.json({
      message: 'Risk updated successfully.',
      riskLevel: user.riskLevel,
      investmentTicker: user.investmentTicker,
      monthlyInvestment: user.monthlyInvestment,
      estValue: Math.round(totalValue),
      roiMultiple,
      totalProfit: Math.round(interest)
    });
  } catch (err) {
    console.error('Error updating risk:', err);
    res.status(500).json({ error: 'Failed to update risk.' });
  }
};