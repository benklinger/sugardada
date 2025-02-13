const mongoose = require('mongoose');
const { monthMap, riskToTickerMap } = require('../config/maps'); 
const { generateInvestmentRecords } = require('../services/investmentCalculator');

// Step 1 - Gender
exports.getStep1 = (req, res) => {
  res.render('gender', { errors: [], oldInput: {} });
};

exports.postStep1 = (req, res) => {
  const { babyGender } = req.body;
  const errors = [];

  if (!babyGender || !['Boy', 'Girl'].includes(babyGender)) {
    errors.push({ msg: 'Please select a valid gender.' });
  }

  if (errors.length > 0) {
    return res.render('gender', { errors, oldInput: { babyGender } });
  }

  try {
    req.session.confirmationGender = babyGender;
    res.redirect('/onboarding/2');
  } catch (error) {
    console.error('Error saving user gender:', error);
    res.status(500).send('Error while saving gender. Please try again.');
  }
};

// Step 2 - Name
exports.getStep2 = (req, res) => {
  if (!req.session.confirmationGender) {
    return res.redirect('/onboarding/1');
  }
  res.render('name', { errors: [], oldInput: {}, gender: req.session.confirmationGender });
};

exports.postStep2 = (req, res) => {
  const { babyName } = req.body;
  const errors = [];

  if (!babyName || !babyName.trim()) {
    errors.push({ msg: 'Please enter a valid name.' });
  }

  if (errors.length > 0) {
    return res.render('name', {
      errors,
      oldInput: { babyName },
      gender: req.session.confirmationGender
    });
  }

  try {
    req.session.confirmationName = babyName.trim();
    res.redirect('/onboarding/3');
  } catch (error) {
    console.error('Error saving name:', error);
    res.status(500).send('Error while saving name. Please try again.');
  }
};

// Step 3 - DOB
exports.getStep3 = (req, res) => {
  if (!req.session.confirmationName) {
    return res.redirect('/onboarding/2');
  }
  res.render('dob', { errors: [], oldInput: {}, name: req.session.confirmationName });
};

exports.postStep3 = (req, res) => {
  const { dobMonth, dobDay, dobYear } = req.body;
  const errors = [];

  if (!dobMonth || !dobDay || !dobYear) {
    errors.push({ msg: 'Please select Month, Day, and Year.' });
  }

  if (errors.length > 0) {
    return res.render('dob', {
      errors,
      oldInput: { dobMonth, dobDay, dobYear },
      name: req.session.confirmationName
    });
  }

  req.session.confirmationDobMonth = dobMonth;
  req.session.confirmationDobDay = dobDay;
  req.session.confirmationDobYear = dobYear;

  res.redirect('/onboarding/4');
};

// Step 4 - Monthly
exports.getStep4 = (req, res) => {
  if (!req.session.confirmationName || !req.session.confirmationDobMonth) {
    return res.redirect('/');
  }
  res.render('monthly', { errors: [] });
};

exports.postStep4 = (req, res) => {
  const { monthlyInvestment } = req.body;
  const errors = [];

  if (!monthlyInvestment || !monthlyInvestment.trim()) {
    errors.push({ msg: 'Please enter a valid monthly investment amount.' });
  }

  if (errors.length > 0) {
    return res.render('monthly', { errors });
  }

  req.session.confirmationMonthly = monthlyInvestment.trim();
  res.redirect('/onboarding/5');
};

// Step 5 - Risk
exports.getStep5 = (req, res) => {
  if (!req.session.confirmationName || !req.session.confirmationDobMonth || !req.session.confirmationMonthly) {
    return res.redirect('/');
  }
  res.render('risk', { errors: [], babyName: req.session.confirmationName });
};

exports.postStep5 = (req, res) => {
  const { riskLevel } = req.body;
  const errors = [];

  if (!riskLevel || !['Low', 'Medium', 'High'].includes(riskLevel)) {
    errors.push({ msg: 'Please select a valid risk level.' });
  }

  if (errors.length > 0) {
    return res.render('risk', { errors, babyName: req.session.confirmationName });
  }

  const investmentTicker = riskToTickerMap[riskLevel];
  if (!investmentTicker) {
    errors.push({ msg: 'Invalid risk level selected.' });
    return res.render('risk', { errors, babyName: req.session.confirmationName });
  }

  req.session.confirmationRiskLevel = riskLevel;
  req.session.confirmationInvestmentTicker = investmentTicker;
  res.redirect('/onboarding/6');
};

// Step 6 - IB
exports.getStep6 = (req, res) => {
  if (!req.session.confirmationName || !req.session.confirmationRiskLevel) {
    return res.redirect('/');
  }
  res.render('ib', { errors: [], babyName: req.session.confirmationName });
};

exports.postStep6 = (req, res) => {
  const { hasIBAccount } = req.body;
  const errors = [];

  if (!hasIBAccount || !['Yes', 'No'].includes(hasIBAccount)) {
    errors.push({ msg: 'Please select a valid option.' });
  }

  if (errors.length > 0) {
    return res.render('ib', { errors, babyName: req.session.confirmationName });
  }

  req.session.confirmationHasIBAccount = hasIBAccount;
  res.redirect('/onboarding/7');
};

// Step 7 - Email
exports.getStep7 = async (req, res) => {
  try {
    if(
      !req.session.confirmationName ||
      !req.session.confirmationRiskLevel ||
      !req.session.confirmationDobMonth ||
      !req.session.confirmationDobDay ||
      !req.session.confirmationDobYear ||
      !req.session.confirmationMonthly
    ){
      return res.redirect('/');
    }

    const numericMonth = monthMap[req.session.confirmationDobMonth];
    const numericDay   = parseInt(req.session.confirmationDobDay, 10);
    const numericYear  = parseInt(req.session.confirmationDobYear, 10);
    const monthlyInvestmentNum = parseInt(
      req.session.confirmationMonthly.replace(/[^0-9]/g, ''),10
    ) || 0;

    const userLike = {
      _id: new mongoose.Types.ObjectId(),
      dob: new Date(Date.UTC(numericYear, numericMonth, numericDay)),
      monthlyInvestment: monthlyInvestmentNum,
      riskLevel: req.session.confirmationRiskLevel,
      investmentTicker: req.session.confirmationInvestmentTicker
    };

    const today = new Date();
    const investmentRecords = await generateInvestmentRecords(userLike, today);

    let estValue='0', roiPct='0';
    if(investmentRecords && investmentRecords.length){
      const last = investmentRecords[investmentRecords.length-1];
      const { totalValue, totalInvestment } = last;
      const interest = totalValue - totalInvestment;
      estValue = Math.round(totalValue).toLocaleString();
      if(totalInvestment>0){
        roiPct = (interest/totalInvestment).toFixed(0) * 100;
      }
      roiHint = Math.round(interest).toLocaleString();
    }

    res.render('email',{
	  name: req.session.confirmationName || 'Omer',
      riskLevel: req.session.confirmationRiskLevel || 'Medium',
      investmentTicker: req.session.confirmationInvestmentTicker || 'QQQ',
      investment: monthlyInvestmentNum.toString(),
      estValue,
      roiPct,
      errors:[]
    });
  } catch(err){
    console.error('Error in GET /onboarding/7:', err);
    res.redirect('/');
  }
};

exports.postStep7 = (req, res) => {
  const { email } = req.body;
  if(!email || !email.includes('@')){
    return res.render('email',{
      errors:[{msg:'Please enter a valid email'}],
	  name: req.session.confirmationName || 'Omer',
      riskLevel: req.session.confirmationRiskLevel || 'High',
      investmentTicker: req.session.confirmationInvestmentTicker || 'SOXX',
      investment: req.session.confirmationMonthly || '100',
      estValue:'0',
      roiPct:'0',
      roiHint:'0'
    });
  }
  req.session.confirmationEmail = email.trim().toLowerCase();
  res.redirect('/plan');
};