// app.js

require('dotenv').config(); // Load environment variables from .env

const express = require('express');
const mongoose = require('mongoose');
const session = require('express-session');
const User = require('./models/User');
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
  cookie: { secure: false } // Set true if using HTTPS in production
}));

// Connect to MongoDB (optional if storing data in DB)
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => console.log('Connected to MongoDB Atlas successfully.'))
.catch(err => console.error('MongoDB connection error:', err));

// GET / - Simple homepage (or render home.ejs if you like)
app.get('/', (req, res) => {
  res.render('home');
});

// GET /results - Confirmation page
app.get('/results', (req, res) => {
  const gender = req.session.confirmationGender;
  const name   = req.session.confirmationName;
  const dobM   = req.session.confirmationDobMonth;
  const dobD   = req.session.confirmationDobDay;
  const dobY   = req.session.confirmationDobYear;

  if (!gender || !name) {
    // minimal check
    return res.redirect('/');
  }

  // Clear session data after reading
  req.session.confirmationGender = null;
  req.session.confirmationName   = null;
  req.session.confirmationDobMonth = null;
  req.session.confirmationDobDay   = null;
  req.session.confirmationDobYear  = null;

  // Render the confirmation page
  // Add logic to show DOB if present
  res.render('confirmation', { 
    gender, 
    name,
    dobMonth: dobM,
    dobDay: dobD,
    dobYear: dobY
  });
});

// -------------- GENDER SCREEN -------------- //
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
    res.status(500).send('An error occurred while saving your gender selection. Please try again.');
  }
});

// -------------- NAME SCREEN -------------- //
app.get('/onboarding/2', (req, res) => {
  if (!req.session.userGender) {
    return res.redirect('/onboarding/1');
  }

  res.render('name', { 
    errors: [], 
    oldInput: {}, 
    gender: req.session.userGender
  });
});

app.post('/onboarding/2', async (req, res) => {
  const { babyName } = req.body;
  const errors = [];

  if (!babyName || !babyName.trim()) {
    errors.push({ msg: 'Please enter a valid name.' });
  }

  if (errors.length > 0) {
    return res.render('name', { errors, oldInput: { babyName }, gender: req.session.userGender });
  }

  try {
    const userGender = req.session.userGender;
    if (!userGender) {
      errors.push({ msg: 'User gender not found. Please start over.' });
      return res.render('name', { errors, oldInput: { babyName }, gender: 'your baby' });
    }

    // Example of storing in DB
    const newUser = new User({
      gender: userGender,
      name: babyName.trim()
    });
    await newUser.save();

    // Store confirmation data in session
    req.session.confirmationGender = userGender;
    req.session.confirmationName   = babyName.trim();

    // Clear onboarding data from session
    req.session.userGender = null;

    // Instead of going to /results, go to dob screen
    res.redirect('/onboarding/3');
  } catch (error) {
    console.error('Error saving user name:', error);
    res.status(500).send('An error occurred while saving your baby\'s name. Please try again.');
  }
});

// -------------- DOB SCREEN -------------- //
app.get('/onboarding/3', (req, res) => {
  // Ensure name is set
  if (!req.session.confirmationName) {
    return res.redirect('/onboarding/2');
  }

  // Render dob.ejs with child's name
  res.render('dob', { 
    errors: [], 
    oldInput: {}, 
    name: req.session.confirmationName
  });
});

app.post('/onboarding/3', (req, res) => {
  const { dobMonth, dobDay, dobYear } = req.body;
  const errors = [];

  if (!dobMonth || !dobDay || !dobYear) {
    errors.push({ msg: 'Please select Month, Day, and Year.' });
    return res.render('dob', {
      errors,
      oldInput: { dobMonth, dobDay, dobYear },
      name: req.session.confirmationName
    });
  }

  // Store in session for results
  req.session.confirmationDobMonth = dobMonth;
  req.session.confirmationDobDay   = dobDay;
  req.session.confirmationDobYear  = dobYear;

  // Move on to results
  res.redirect('/results');
});

// -------------- SERVER START -------------- //
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});