const mongoose = require('mongoose');
const User = require('../models/User');
const { monthMap } = require('../config/maps');
const { tickerParagraphMap } = require('../config/maps');
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
      res.redirect('/plan');
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
        confirmationEmail: email
      } = req.session;

      if (![gender, name, dobMonth, dobDay, dobYear, investment, riskLevel, investmentTicker, email].every(Boolean)) {
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
        email: email
      };

      [
        'confirmationGender','confirmationName','confirmationDobMonth',
        'confirmationDobDay','confirmationDobYear','confirmationMonthly',
        'confirmationRiskLevel','confirmationInvestmentTicker','confirmationHasIBAccount',
        'confirmationEmail','isDemo'
      ].forEach(key => req.session[key] = null);
    }

    const user = new User(userData);
    await user.save();

    const hostUrl = `${req.protocol}://${req.get('host')}`;
    const shareableUrl = `${hostUrl}/plan/${user._id}`;

    if (user.email) {
	  const endAge = user.targetAge || 18;
      const alink = 'https://u50048141.ct.sendgrid.net/ls/click?upn=u001.-2BlOTt6iTKyiCh3-2BMr4ellWVMqPTFCul7oE3y-2FV2F6it-2F4ckbZUff-2FQg5z5o7AD-2F2Oekg_Q21ZqrWvlwXxIMJklgw9w8-2FrXpMcNFIlJWo8kVCKJ0sYHklF4FqJg8YLpOqyl2x-2FM0UXciSKSS-2B0KLajDntSwKp6BgPuIRq1foDPVWwC-2BRDZ3mOuQbU7VPlnTsS49VaMVmTfHAV13Bi7WvB4QDmzL8dkmQrZMlvW4iPEZNwNx-2B-2B50P1lbRKkZ46SAT9oqs-2F6-2F5TIuPbFn7AnfJted1qeEg-3D-3D';
      const rlink = 'https://u50048141.ct.sendgrid.net/ls/click?upn=u001.-2BlOTt6iTKyiCh3-2BMr4ellQa-2FbSjj8lPfQS7OhIiF0RMisMSMUSBWhXvHRaQoYX-2FQtncT03dP1VX54eQj6IefEg-3D-3Ddu6E_Q21ZqrWvlwXxIMJklgw9w8-2FrXpMcNFIlJWo8kVCKJ0sYHklF4FqJg8YLpOqyl2x-2FEt7he-2Fbz4ic2SMmPFVTROTah8MjsyxY8tI3gFP3I7wByQYg4ethIKTcwyqasuak-2B7QNkNA8ZzO18-2F8R3BN24h3k0Rii0Cp3KQFS3nrsQBhYp8aybBJvDz-2Fdwmz0R3ICi4328kJm0sH-2FND7IiutUL3A-3D-3D';
      const tickerParagraph = tickerParagraphMap[user.investmentTicker.toUpperCase()] || '';

      const today = new Date();
      const investmentRecords = await generateInvestmentRecords(user, today);
      let estValue, roiPct;
      if (investmentRecords && investmentRecords.length > 0) {
        const latestRecord = investmentRecords[investmentRecords.length - 1];
        estValue = `$${Math.round(latestRecord.totalValue).toLocaleString()}`;
        const interest = latestRecord.totalValue - latestRecord.totalInvestment;
        roiPct = latestRecord.totalInvestment > 0 ? Math.round((interest / latestRecord.totalInvestment) * 100) : '0';
      } else {
        estValue = 'N/A';
        roiPct = 'N/A';
      }

      const step2 = (user.hasIBAccount &&
        (typeof user.hasIBAccount === 'string'
          ? user.hasIBAccount.toLowerCase() === 'yes'
          : user.hasIBAccount === true))
        ? `<li><del>Sign up for a trading account</del></li>`
        : `<li><a href="${alink}">Sign up for a trading account</a></li>`;

      const subject = `${user.name}'s Plan is Ready`;
      const html = `
<p>Thanks for creating an investment plan for ${user.name}!<br>
You can revisit or update it anytime using <a href="${shareableUrl}">this link</a>.</p>

<p>Here’s the deal: if you contribute <strong>$${user.monthlyInvestment}/mo</strong> until ${user.name} turns ${endAge} in <strong>${user.investmentTicker.toUpperCase()}</strong>, your investment could grow to <strong>${estValue}</strong> — that’s an return of <strong>~${roiPct}%</strong>.</p>

<p>${tickerParagraph}</p>

<p>Ready to get started? Here’s what to do:</p>
<ol>
  <li><del>Build a plan</del></li>
  ${step2}
  <li><a href="${rlink}">Set up recurring contributions</a></li>
  <li>Sit back until ${user.name} turns ${endAge}</li>
</ol>

<p>Cheers,<br/>Ben</p>
<p>P.S.<br/><a href="https://fantastical.app/benklinger-abJD/meet">I ❤️ feedback</a></p>
`;

      try {
        await sendMail({
          from: 'Ben @ Sugar Dada',
		  to: user.email,
          subject,
          html
        });
        console.log("Plan email sent to", user.email);
      } catch (err) {
        console.error("Failed to send plan email:", err);
      }
    }

    return res.redirect(`/plan/${user._id}`);
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
      const roiPct = totalInvestment > 0 ? Math.round((interest / totalInvestment) * 100) : '0';

      return res.render('confirmation', {
        userId: user._id.toString(),
        name: user.name,
        dob: user.dob,
        riskLevel: user.riskLevel,
        investmentTicker: user.investmentTicker.toUpperCase(),
        investment: parseFloat(user.monthlyInvestment).toFixed(2),
        hasIBAccount: user.hasIBAccount,
        estValue: Math.round(totalValue).toLocaleString(),
        roiPct,
        lifeEvents: JSON.stringify(lifeEvents),
        targetAge: user.targetAge || 18
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
        roiPct: '123%',
        lifeEvents: JSON.stringify(lifeEvents),
        targetAge: user.targetAge || 18
      });
    }
  } catch (err) {
    console.error(err);
    res.status(500).send('Error loading plan. Please try again.');
  }
};