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
  secret: process.env.SESSION_SECRET, // Use SESSION_SECRET from .env
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

// GET / - Render the homepage
app.get('/', (req, res) => {
  res.render('home');
});

// GET /results - Render the confirmation page with collected data
app.get('/results', (req, res) => {
  // Retrieve gender and name from session
  const gender = req.session.confirmationGender;
  const name = req.session.confirmationName;

  // Check if data exists; if not, redirect to homepage or an error page
  if (!gender || !name) {
    return res.redirect('/'); // Redirect to homepage or handle as desired
  }

  // Clear the confirmation data from session after retrieving
  req.session.confirmationGender = null;
  req.session.confirmationName = null;

  // Render the confirmation page with the data
  res.render('confirmation', { gender, name });
});

// GET /onboarding/1 - Render the gender selection form
app.get('/onboarding/1', (req, res) => {
  res.render('gender', { errors: [], oldInput: {} });
});

// POST /onboarding/1 - Handle gender selection
app.post('/onboarding/1', async (req, res) => {
  const { babyGender } = req.body;
  const errors = [];

  if (!babyGender || !['Boy', 'Girl'].includes(babyGender)) {
    errors.push({ msg: 'Please select a valid gender.' });
  }

  if (errors.length > 0) {
    return res.render('gender', { errors, oldInput: { babyGender } });
  }

  try {
    // Store the selected gender in the session as is ('Boy' or 'Girl')
    req.session.userGender = babyGender;
    res.redirect('/onboarding/2');
  } catch (error) {
    console.error('Error saving user gender:', error);
    res.status(500).send('An error occurred while saving your gender selection. Please try again.');
  }
});

// GET /onboarding/2 - Render the baby's name input form
app.get('/onboarding/2', (req, res) => {
  // Ensure that gender has been selected
  if (!req.session.userGender) {
    return res.redirect('/onboarding/1');
  }

  // Pass the gender to the template
  res.render('name', { 
    errors: [], 
    oldInput: {}, 
    gender: req.session.userGender 
  });
});

// POST /onboarding/2 - Handle baby's name submission
app.post('/onboarding/2', async (req, res) => {
  const { babyName } = req.body;
  const errors = [];

  if (!babyName || babyName.trim() === '') {
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
    // Retrieve gender from session
    const userGender = req.session.userGender;
    if (!userGender) {
      errors.push({ msg: 'User gender not found. Please start over.' });
      return res.render('name', { 
        errors, 
        oldInput: { babyName }, 
        gender: 'your baby' 
      });
    }

    const newUser = new User({
      gender: userGender, // 'Boy' or 'Girl'
      name: babyName.trim()
    });

    await newUser.save();

    // Store confirmation data in session
    req.session.confirmationGender = userGender;
    req.session.confirmationName = babyName.trim();

    // Clear onboarding data from session
    req.session.userGender = null;

    // Redirect to /results
    res.redirect('/results');
  } catch (error) {
    console.error('Error saving user name:', error);
    res.status(500).send('An error occurred while saving your baby\'s name. Please try again.');
  }
});

// Start the Server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});