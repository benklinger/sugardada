require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const session = require('express-session');
const bodyParser = require('body-parser');
const path = require('path');
const indexRoutes = require('./routes/indexRoutes');
const apiRoutes = require('./routes/apiRoutes');
const onboardingRoutes = require('./routes/onboardingRoutes');

const app = express();

// Middleware
app.use(express.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.set('view engine', 'ejs');
app.use(express.static(path.join(__dirname, 'public')));

app.use(session({
  secret: process.env.SESSION_SECRET || 'aSecretKey',
  resave: false,
  saveUninitialized: true,
  cookie: { secure: false }
}));

mongoose.connect(process.env.MONGO_URI)
.then(() => console.log('Connected to MongoDB Atlas successfully.'))
.catch(err => console.error('MongoDB connection error:', err));

app.use('/', indexRoutes);
app.use('/api', apiRoutes);
app.use('/onboarding', onboardingRoutes);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

module.exports = { app };