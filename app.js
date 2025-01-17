require('dotenv').config();

const express = require('express');
const mongoose = require('mongoose');
const session = require('express-session');
const User = require('./models/User');
const InvestmentRecord = require('./models/InvestmentRecord');
const bodyParser = require('body-parser');
const path = require('path');
const { generateInvestmentRecords } = require('./services/investmentCalculator');

const app = express();

const monthMap = { Jan: 0, Feb: 1, Mar: 2, Apr: 3, May: 4, Jun: 5, Jul: 6, Aug: 7, Sep: 8, Oct: 9, Nov: 10, Dec: 11};
const riskToTickerMap = { Low: 'SPY', Medium: 'QQQ', High: 'SOXX'};

app.use(bodyParser.urlencoded({ extended: true }));
app.set('view engine', 'ejs');
app.use(express.static(path.join(__dirname, 'public')));
app.use(session({
  secret: process.env.SESSION_SECRET || 'aSecretKey',
  resave: false,
  saveUninitialized: true,
  cookie: { secure: false }
}));

mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => console.log('Connected to MongoDB Atlas successfully.'))
.catch(err => console.error('MongoDB connection error:', err));

app.get('/', (req, res) => {
  res.render('home');
});

app.get('/results', async (req, res) => {
  try {
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
    } = req.session;

    if (![gender, name, dobMonth, dobDay, dobYear, investment, riskLevel, investmentTicker].every(Boolean) || hasIBAccount === undefined) {
      return res.redirect('/');
    }

    const numericMonth = monthMap[dobMonth];
    if (numericMonth === undefined) throw new Error(`Invalid month abbreviation: ${dobMonth}`);

    const numericDay = parseInt(dobDay, 10);
    const numericYear = parseInt(dobYear, 10);
    if (isNaN(numericDay) || isNaN(numericYear)) throw new Error('Invalid day or year for DOB.');

    const monthlyInvestmentNum = parseInt(investment.replace(/[^0-9]/g, ''), 10);
    if (isNaN(monthlyInvestmentNum)) throw new Error('Invalid monthly investment amount.');

    const userData = {
      gender,
      name,
      dob: new Date(Date.UTC(numericYear, numericMonth, numericDay)),
      monthlyInvestment: monthlyInvestmentNum,
      riskLevel,
      investmentTicker,
      hasIBAccount,
    };

    const user = new User(userData);
    await user.save();

    const today = new Date();

    let investmentRecords;
    try {
      investmentRecords = await generateInvestmentRecords(user, today);
    } catch (calcError) {
      req.session.destroy();
      return res.render('gender', {
        errors: [{ msg: calcError.message }],
        oldInput: {},
        currentStep: 1
      });
    }

    req.session.destroy();

    res.render('confirmation', { 
      dob: userData.dob,
      riskLevel: user.riskLevel, 
      investmentTicker: userData.investmentTicker.toUpperCase(), 
      investment: parseFloat(userData.monthlyInvestment).toFixed(2), 
      investmentRecords 
    });
  } catch (error) {
    console.error('Error processing results:', error);
    res.status(500).send('Error while processing your information. Please try again.');
  }
});

app.get('/onboarding/1', (req, res) => {
  res.render('gender', { errors: [], oldInput: {} });
});

app.post('/onboarding/1', (req, res) => {
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
});

app.get('/onboarding/2', (req, res) => {
  if (!req.session.confirmationGender) {
    return res.redirect('/onboarding/1');
  }
  res.render('name', { errors: [], oldInput: {}, gender: req.session.confirmationGender });
});

app.post('/onboarding/2', (req, res) => {
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
});

app.get('/onboarding/3', (req, res) => {
  if (!req.session.confirmationName) {
    return res.redirect('/onboarding/2');
  }
  res.render('dob', { errors: [], oldInput: {}, name: req.session.confirmationName });
});

app.post('/onboarding/3', (req, res) => {
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
});

app.get('/onboarding/4', (req, res) => {
  if (!req.session.confirmationName || !req.session.confirmationDobMonth) {
    return res.redirect('/');
  }
  res.render('monthly', { errors: [] });
});

app.post('/onboarding/4', (req, res) => {
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
});

app.get('/onboarding/5', (req, res) => {
  if (!req.session.confirmationName || !req.session.confirmationDobMonth || !req.session.confirmationMonthly) {
    return res.redirect('/');
  }
  res.render('risk', { errors: [], babyName: req.session.confirmationName });
});

app.post('/onboarding/5', (req, res) => {
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
});

app.get('/onboarding/6', (req, res) => {
  if (!req.session.confirmationName || !req.session.confirmationRiskLevel) {
    return res.redirect('/');
  }
  res.render('ib', { errors: [], babyName: req.session.confirmationName });
});

app.post('/onboarding/6', (req, res) => {
  const { hasIBAccount } = req.body;
  const errors = [];

  if (!hasIBAccount || !['Yes', 'No'].includes(hasIBAccount)) {
    errors.push({ msg: 'Please select a valid option.' });
  }

  if (errors.length > 0) {
    return res.render('ib', { errors, babyName: req.session.confirmationName });
  }

  req.session.confirmationHasIBAccount = hasIBAccount;
  res.redirect('/results');
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});