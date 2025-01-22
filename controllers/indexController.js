const mongoose = require('mongoose');
const User = require('../models/User');
const { monthMap } = require('../config/maps'); 
const { generateInvestmentRecords } = require('../services/investmentCalculator');

exports.renderHome = (req, res) => {
  res.render('home');
};

exports.startDemo = async (req, res) => {
  try {
    req.session.isDemo = true;
    req.session.confirmationGender = 'Girl';
    req.session.confirmationName = 'Omer';
    req.session.confirmationDobMonth = 'Jun';
    req.session.confirmationDobDay = '28';
    req.session.confirmationDobYear = '2023';
    req.session.confirmationMonthly = '100';
    req.session.confirmationRiskLevel = 'High';
    req.session.confirmationInvestmentTicker = 'SOXX';
    req.session.confirmationHasIBAccount = 'No';
    req.session.confirmationEmail = 'benklinger@gmail.com';
    req.session.save(err => {
      if (err) {
        console.error('Session save error:', err);
        return res.status(500).send('Error saving session.');
      }
      res.redirect('/results');
    });
  } catch (error) {
    console.error('Error initiating demo:', error);
    res.status(500).send('An error occurred while initiating the demo.');
  }
};

exports.showResults = async (req, res) => {
  try {
    let userData;

    if (req.session.isDemo) {
      // Demo user
      userData = {
        _id: new mongoose.Types.ObjectId(),
        gender: req.session.confirmationGender,
        name: req.session.confirmationName,
        dob: new Date(Date.UTC(
          parseInt(req.session.confirmationDobYear, 10),
          monthMap[req.session.confirmationDobMonth],
          parseInt(req.session.confirmationDobDay, 10)
        )),
        monthlyInvestment: parseInt(req.session.confirmationMonthly, 10),
        riskLevel: req.session.confirmationRiskLevel,
        investmentTicker: req.session.confirmationInvestmentTicker,
        hasIBAccount: req.session.confirmationHasIBAccount,
        email: req.session.confirmationEmail || '',
        createdAt: new Date()
      };
      req.session.isDemo = false;
    } else {
      // Real user
      const {
        confirmationGender: gender,
        confirmationName: name,
        confirmationDobMonth: dobMonth,
        confirmationDobDay: dobDay,
        confirmationDobYear: dobYear,
        confirmationMonthly: investment,
        confirmationRiskLevel: riskLevel,
        confirmationInvestmentTicker: investmentTicker,
        confirmationHasIBAccount: hasIBAccount,
        confirmationEmail: userEmail
      } = req.session;

      // If missing any
      if (![gender, name, dobMonth, dobDay, dobYear, investment, riskLevel, investmentTicker, userEmail].every(Boolean)) {
        return res.redirect('/');
      }

      const numericMonth = monthMap[dobMonth];
      if (numericMonth === undefined) throw new Error(`Invalid month abbreviation: ${dobMonth}`);

      const numericDay = parseInt(dobDay, 10);
      const numericYear = parseInt(dobYear, 10);
      if (isNaN(numericDay) || isNaN(numericYear)) {
        throw new Error('Invalid day/year');
      }

      const monthlyInvestmentNum = parseInt(investment.replace(/[^0-9]/g, ''), 10);
      if (isNaN(monthlyInvestmentNum)) {
        throw new Error('Invalid monthly investment amount.');
      }

      userData = {
        gender,
        name,
        dob: new Date(Date.UTC(numericYear, numericMonth, numericDay)),
        monthlyInvestment: monthlyInvestmentNum,
        riskLevel,
        investmentTicker,
        hasIBAccount,
        email: userEmail
      };

      // Clear session data
      [
        'confirmationGender','confirmationName','confirmationDobMonth',
        'confirmationDobDay','confirmationDobYear','confirmationMonthly',
        'confirmationRiskLevel','confirmationInvestmentTicker','confirmationHasIBAccount',
        'confirmationEmail'
      ].forEach(key => req.session[key] = null);
    }

    // Create user in DB
    const user = new User(userData);
    await user.save();
    req.session.userId = user._id;

    // Generate records
    const today = new Date();
    const investmentRecords = await generateInvestmentRecords(user, today);

    if (investmentRecords && investmentRecords.length > 0) {
      const latestRecord = investmentRecords[investmentRecords.length - 1];
      const { totalValue, totalInvestment } = latestRecord;
      const interest = totalValue - totalInvestment;
      const roiMultiple = totalInvestment > 0 ? (interest / totalInvestment).toFixed(2) : '0.00';
      const totalProfit = Math.round(interest);

      res.render('confirmation', {
        name: userData.name,
        dob: userData.dob,
        riskLevel: userData.riskLevel,
        investmentTicker: userData.investmentTicker.toUpperCase(),
        investment: parseFloat(userData.monthlyInvestment).toFixed(2),
        hasIBAccount: userData.hasIBAccount,
        estValue: Math.round(totalValue).toLocaleString(),
        roiMultiple,
        roiHint: `$${totalProfit.toLocaleString()}`,
      });
    } else {
      res.render('confirmation', {
        name: userData.name,
        dob: userData.dob,
        riskLevel: userData.riskLevel,
        investmentTicker: userData.investmentTicker.toUpperCase(),
        investment: parseFloat(userData.monthlyInvestment).toFixed(2),
        hasIBAccount: userData.hasIBAccount,
        estValue: '0',
        roiMultiple: '0.00',
        roiHint: '$0',
      });
    }
  } catch (error) {
    console.error(error);
    res.status(500).send('Error while processing your information. Please try again.');
  }
};