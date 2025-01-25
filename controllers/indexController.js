const mongoose = require('mongoose');
const User = require('../models/User');
const { monthMap } = require('../config/maps'); 
const { generateInvestmentRecords } = require('../services/investmentCalculator');
const { sendMail } = require('../services/mailService');
const { getLifeEventsForUser } = require('../services/lifeEvents');

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

exports.finalizeAndRedirect = async (req, res) => {
  try {
    let userData;

    // DEMO or real
    if (req.session.isDemo) {
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
        'confirmationEmail','isDemo'
      ].forEach(key => req.session[key] = null);
    }

    // Create user in DB
    const user = new User(userData);
    await user.save();

    const hostUrl = `${req.protocol}://${req.get('host')}`;
    const shareableUrl = `${hostUrl}/results/${user._id}`;

    if (user.email) {
		const subject = `${user.name}` + "'s Plan is Ready";
      const text = `
Hello, 

${user.name}'s plan has been created with a monthly investment of $${user.monthlyInvestment}.
Risk level: ${user.riskLevel}, Ticker: ${user.investmentTicker}.

Click here to view your results anytime:
${shareableUrl}
`;

 // try {
 //        await sendMail({
 //          to: user.email,
 //          subject,
 //          text
 //        });
 //        console.log("Plan email sent to", user.email);
 //      } catch (err) {
 //        console.error("Failed to send plan email:", err);
 //      }
    }


    return res.redirect(`/results/${user._id}`);
  } catch (error) {
    console.error(error);
    return res.status(500).send('Error while processing your information. Please try again.');
  }
};

exports.showUserById = async (req, res) => {
  try {
    const { userId } = req.params;
    if (!userId) {
      return res.redirect('/');
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).send('User not found.');
    }

    const today = new Date();
    const investmentRecords = await generateInvestmentRecords(user, today);
    const lifeEvents = getLifeEventsForUser(user);

    if (investmentRecords && investmentRecords.length > 0) {
      const latestRecord = investmentRecords[investmentRecords.length - 1];
      const { totalValue, totalInvestment } = latestRecord;
      const interest = totalValue - totalInvestment;
      const roiMultiple = totalInvestment > 0 ? (interest / totalInvestment).toFixed(2) : '0.00';
      const totalProfit = Math.round(interest);

      return res.render('confirmation', {
		userId: user._id.toString(),
        name: user.name,
        dob: user.dob,
        riskLevel: user.riskLevel,
        investmentTicker: user.investmentTicker.toUpperCase(),
        investment: parseFloat(user.monthlyInvestment).toFixed(2),
        hasIBAccount: user.hasIBAccount,
        estValue: Math.round(totalValue).toLocaleString(),
        roiMultiple,
        roiHint: `${totalProfit.toLocaleString()}`,
        lifeEvents: JSON.stringify(lifeEvents)
      });
    } else {
      return res.render('confirmation', {
        userId: user._id.toString(),
		name: user.name,
        dob: user.dob,
        riskLevel: user.riskLevel,
        investmentTicker: user.investmentTicker.toUpperCase(),
        investment: parseFloat(user.monthlyInvestment).toFixed(2),
        hasIBAccount: user.hasIBAccount,
        estValue: '123,456',
        roiMultiple: '1.23',
        roiHint: '$12,345',
        lifeEvents: JSON.stringify(lifeEvents)
      });
    }
  } catch (err) {
    console.error(err);
    res.status(500).send('Error loading plan. Please try again.');
  }
};