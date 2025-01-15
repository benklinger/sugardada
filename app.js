require('dotenv').config();

const express = require('express');
const mongoose = require('mongoose');
const session = require('express-session');
const User = require('./models/User');
const InvestmentRecord = require('./models/InvestmentRecord');
const { getHistoricalData } = require('./services/yahooFinance');
const bodyParser = require('body-parser');
const path = require('path');

const app = express();

const monthMap = { Jan: 0, Feb: 1, Mar: 2, Apr: 3, May: 4, Jun: 5, Jul: 6, Aug: 7, Sep: 8, Oct: 9, Nov: 10, Dec: 11};
const riskToTickerMap = { Low: 'SPY', Medium: 'QQQ', High: 'TECL'};

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

// Helper function to calculate the total number of full months between two dates
function calculateFullMonthDifference(startDate, endDate) {
  let years = endDate.getFullYear() - startDate.getFullYear();
  let months = endDate.getMonth() - startDate.getMonth();
  let days = endDate.getDate() - startDate.getDate();

  let totalMonths = years * 12 + months;
  if (days < 0) {
    totalMonths -= 1;
  }

  return totalMonths;
}

app.get('/', (req, res) => {
  res.render('home');
});

app.get('/results', async (req, res) => {
  const { isDemo } = req.session;
  
  try {
    let userData;

    if (isDemo) {
      userData = {
        _id: new mongoose.Types.ObjectId(),
        gender: "Girl",
        name: "Omer",
        dob: new Date(Date.UTC(2023, 1, 28)),
        monthlyInvestment: 1000,
        riskLevel: "High",
        investmentTicker: "TECL",
        hasIBAccount: "No",
        createdAt: new Date(),
      };
      req.session.isDemo = false;
    } else {
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

      userData = {
        gender,
        name,
        dob: new Date(Date.UTC(numericYear, numericMonth, numericDay)),
        monthlyInvestment: monthlyInvestmentNum,
        riskLevel,
        investmentTicker,
        hasIBAccount,
      };

      // Clear session data
      [
        'confirmationGender', 'confirmationName', 'confirmationDobMonth', 
        'confirmationDobDay', 'confirmationDobYear', 'confirmationMonthly', 
        'confirmationRiskLevel', 'confirmationInvestmentTicker', 'confirmationHasIBAccount'
      ].forEach(key => req.session[key] = null);
    }

    // Create and save the user
    const user = new User(userData);
    await user.save();

    // Calculate the user's 18th birthday
    const dobDate = new Date(user.dob);
    const eighteenBirthday = new Date(dobDate.getFullYear() + 18, dobDate.getMonth(), dobDate.getDate());

    // Today's date
    const today = new Date();

    // Calculate the total number of months until 18th birthday
    let totalMonths = calculateFullMonthDifference(today, eighteenBirthday);

    // Handle scenarios where the user is already 18 or older
    if (totalMonths <= 0) {
      req.session.destroy();
      return res.render('gender', {
        errors: [{ msg: 'You have already turned 18 years old.' }],
        oldInput: {},
        currentStep: 1
      });
    }

    console.log(`Total months to simulate: ${totalMonths}`);

    // Limit to one investment record for debugging
    const investmentLimit = totalMonths; // Change to 'totalMonths' for full simulation

    // Define the start and end dates for historical data
    const historicalMonths = investmentLimit; // Number of months to fetch historical data
    const historicalStartDate = new Date(today.getFullYear(), today.getMonth() - historicalMonths, 1);
    const historicalEndDate = today;

    console.log(`Fetching historical data from ${historicalStartDate.toDateString()} to ${historicalEndDate.toDateString()}`);

    try {
      // Fetch historical data using getHistoricalData with '1mo' interval
      const historicalData = await getHistoricalData(user.investmentTicker, historicalStartDate, historicalEndDate);

      console.log(`Historical data length: ${historicalData.length}`);

      if (!historicalData || historicalData.length === 0) {
        return res.render('ib', {
          errors: [{ msg: 'No historical data found for the provided ticker.' }],
          oldInput: req.body,
          currentStep: 6
        });
      }

      // Ensure historicalData has at least 'investmentLimit' entries
      if (historicalData.length < historicalMonths) {
        return res.render('ib', {
          errors: [{ msg: `Insufficient historical data for the provided ticker. Required: ${historicalMonths} months, Available: ${historicalData.length} months.` }],
          oldInput: req.body,
          currentStep: 6
        });
      }

      // Sort the historical data from oldest to newest
      historicalData.sort((a, b) => a.date - b.date);

      // Log a sample of historical data
      console.log('Sample historical data:', historicalData.slice(0, 3));

      // Calculate monthly returns
      const monthlyReturns = [];

      for (let i = 1; i < historicalData.length; i++) {
        const previousClose = historicalData[i - 1].close;
        const currentClose = historicalData[i].close;
        const monthlyReturn = (currentClose - previousClose) / previousClose;
        monthlyReturns.push(monthlyReturn);
      }

      // Calculate average monthly return
      const averageMonthlyReturn = monthlyReturns.reduce((acc, val) => acc + val, 0) / monthlyReturns.length;

      console.log(`Average monthly return: ${(averageMonthlyReturn * 100).toFixed(2)}%`);

      // Initialize simulation variables
      let simulatedSharePrice = historicalData[historicalData.length - 1].close; // Last known share price
      let totalInvestmentAmount = 0;
      let totalShares = 0;
      let totalValue = 0;
      let totalInterest = 0;

      const investmentRecords = [];

      for (let i = 0; i < investmentLimit; i++) {
        // Simulate date (end of each month)
        const simulatedDate = new Date(
          today.getFullYear(),
          today.getMonth() + i + 1,
          0 // 0th day of next month = last day of current month
        );

        // Apply average monthly return to simulate share price
        simulatedSharePrice = simulatedSharePrice * (1 + averageMonthlyReturn);

        // Calculate shares purchased
        const sharesPurchased = user.monthlyInvestment / simulatedSharePrice;

        // Update totals
        totalInvestmentAmount += parseFloat(user.monthlyInvestment);
        totalShares += parseFloat(sharesPurchased);
        totalValue = parseFloat((totalShares * simulatedSharePrice).toFixed(2));
        totalInterest = parseFloat((totalValue - totalInvestmentAmount).toFixed(2));

        // Historical date corresponding to this investment month
        const historicalDate = historicalData[i].date; // Assuming historicalData is ordered from oldest to newest

        // Create investment record
        investmentRecords.push({
          user: user._id,
          investmentTicker: user.investmentTicker.toUpperCase(),
          investment: parseFloat(user.monthlyInvestment),
          simulatedDate,
          historicalDate,
          totalInvestment: parseFloat(totalInvestmentAmount.toFixed(2)),
          sharePrice: parseFloat(simulatedSharePrice.toFixed(2)),
          sharesPurchased: parseFloat(sharesPurchased.toFixed(4)),
          totalValue: totalValue,
          interest: totalInterest >= 0 ? totalInterest : 0, // Ensure non-negative
        });
      }

      console.log(`Generated ${investmentRecords.length} investment records.`);

      // Save all investment records to MongoDB
      await InvestmentRecord.insertMany(investmentRecords);

      // Clear session data
      req.session.destroy();

      // Render the result page
      res.render('confirmation', { 
        dob: userData.dob,
		riskLevel: user.riskLevel, 
        investmentTicker: userData.investmentTicker.toUpperCase(), 
        investment: parseFloat(userData.monthlyInvestment).toFixed(2), 
        investmentRecords 
      });
    } catch (error) {
      console.error('Error processing investment data:', error.message);
      res.status(500).send('An error occurred while processing your investment data.');
    }
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

  if (!babyGender || !['Boy', 'Girl', 'DEMO'].includes(babyGender)) {
    errors.push({ msg: 'Please select a valid gender.' });
  }

  if (errors.length > 0) {
    return res.render('gender', { errors, oldInput: { babyGender } });
  }

  try {
    if (babyGender === 'DEMO') {
      req.session.isDemo = true;
      res.redirect('/results');
    } else {
      req.session.confirmationGender = babyGender;
      res.redirect('/onboarding/2');
    }
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