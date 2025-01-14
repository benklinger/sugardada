// app.js

require('dotenv').config(); // Load environment variables from .env

const express = require('express');
const mongoose = require('mongoose');
const session = require('express-session');
const User = require('./models/User'); // Ensure you have a User model defined
const bodyParser = require('body-parser');
const path = require('path');

const app = express();

// Middleware Setup
app.use(bodyParser.urlencoded({ extended: true }));
app.set('view engine', 'ejs');
app.use(express.static(path.join(__dirname, 'public')));
app.use(session({
  secret: process.env.SESSION_SECRET || 'aSecretKey',
  resave: false,
  saveUninitialized: true,
  cookie: { secure: false } // Set to true if using HTTPS in production
}));

// Connect to MongoDB Atlas using MONGO_URI from .env
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => console.log('Connected to MongoDB Atlas successfully.'))
.catch(err => console.error('MongoDB connection error:', err));

// ============= ROUTES =============

// GET / - Render the homepage
app.get('/', (req, res) => {
  res.render('home');
});

// GET /results - Render the confirmation page with collected data
app.get('/results', (req, res) => {
  // Retrieve all necessary data from session
  const gender   = req.session.confirmationGender;
  const name     = req.session.confirmationName;
  const dobMonth = req.session.confirmationDobMonth;
  const dobDay   = req.session.confirmationDobDay;
  const dobYear  = req.session.confirmationDobYear;
  const monthly  = req.session.confirmationMonthly;

  // Check if essential data exists
  if (!gender || !name || !dobMonth || !dobDay || !dobYear || !monthly) {
    return res.redirect('/'); // Redirect to homepage or handle as desired
  }

  // Clear the confirmation data from session after retrieving
  req.session.confirmationGender   = null;
  req.session.confirmationName     = null;
  req.session.confirmationDobMonth = null;
  req.session.confirmationDobDay   = null;
  req.session.confirmationDobYear  = null;
  req.session.confirmationMonthly  = null;

  // Render the confirmation page with all data
  res.render('confirmation', { 
    gender, 
    name, 
    dobMonth, 
    dobDay, 
    dobYear, 
    monthly 
  });
});

// ============= GENDER SCREEN =============
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
    // Store the selected gender in the session
    req.session.userGender = babyGender;
    res.redirect('/onboarding/2');
  } catch (error) {
    console.error('Error saving user gender:', error);
    res.status(500).send('Error while saving gender. Please try again.');
  }
});

// ============= NAME SCREEN =============
app.get('/onboarding/2', (req, res) => {
  if (!req.session.userGender) {
    return res.redirect('/onboarding/1');
  }
  res.render('name', { errors: [], oldInput: {}, gender: req.session.userGender });
});

app.post('/onboarding/2', async (req, res) => {
  const { babyName } = req.body;
  const errors = [];

  if (!babyName || !babyName.trim()) {
    errors.push({ msg: 'Please enter a valid name.' });
  }

  if (errors.length > 0) {
    return res.render('name', {
      errors,
      oldInput: { babyName },
      gender: req.session.userGender
    });
  }

  try {
    const userGender = req.session.userGender;
    if (!userGender) {
      errors.push({ msg: 'User gender not found. Please start over.' });
      return res.render('name', { errors, oldInput: { babyName }, gender: 'your baby' });
    }

    // Example of storing in DB
    const newUser = new User({ gender: userGender, name: babyName.trim() });
    await newUser.save();

    // Store confirmation data in session
    req.session.confirmationGender = userGender;
    req.session.confirmationName   = babyName.trim();

    // Clear onboarding data from session
    req.session.userGender = null;

    // Next step -> DOB
    res.redirect('/onboarding/3');
  } catch (error) {
    console.error('Error saving name:', error);
    res.status(500).send('Error while saving name. Please try again.');
  }
});

// ============= DOB SCREEN =============
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

  // Store DOB in session
  req.session.confirmationDobMonth = dobMonth;
  req.session.confirmationDobDay   = dobDay;
  req.session.confirmationDobYear  = dobYear;

  // Next step -> Monthly Investment
  res.redirect('/onboarding/4');
});

// ============= MONTHLY INVESTMENT SCREEN =============
app.get('/onboarding/4', (req, res) => {
  // Ensure that previous steps are completed
  if (!req.session.confirmationGender || !req.session.confirmationName || !req.session.confirmationDobMonth) {
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

  // Store in session
  req.session.confirmationMonthly = monthlyInvestment.trim();

  // Final step -> Confirmation
  res.redirect('/results');
});

// ============= SERVER START =============
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});