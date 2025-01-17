const mongoose = require('mongoose');
const { getHistoricalData } = require('../services/yahooFinance');
const InvestmentRecord = require('../models/InvestmentRecord');

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

async function generateInvestmentRecords(user, today) {
  const dobDate = new Date(user.dob);
  const eighteenBirthday = new Date(dobDate.getFullYear() + 18, dobDate.getMonth(), dobDate.getDate());
  let totalMonths = calculateFullMonthDifference(today, eighteenBirthday);

  if (totalMonths <= 0) {
    throw new Error('User is already 18 or older.');
  }

  const investmentLimit = totalMonths;
  const historicalMonths = investmentLimit;
  const historicalStartDate = new Date(today.getFullYear(), today.getMonth() - historicalMonths, 1);
  const historicalEndDate = today;

  const historicalData = await getHistoricalData(user.investmentTicker, historicalStartDate, historicalEndDate);

  if (!historicalData || historicalData.length === 0) {
    throw new Error('No historical data found for the provided ticker.');
  }

  if (historicalData.length < historicalMonths) {
    throw new Error(`Insufficient historical data. Required: ${historicalMonths} months, Available: ${historicalData.length} months.`);
  }

  historicalData.sort((a, b) => a.date - b.date);

  const monthlyReturns = [];
  for (let i = 1; i < historicalData.length; i++) {
    const previousClose = historicalData[i - 1].close;
    const currentClose = historicalData[i].close;
    const monthlyReturn = (currentClose - previousClose) / previousClose;
    monthlyReturns.push(monthlyReturn);
  }

  const averageMonthlyReturn = monthlyReturns.reduce((acc, val) => acc + val, 0) / monthlyReturns.length;

  let simulatedSharePrice = historicalData[historicalData.length - 1].close;
  let totalInvestmentAmount = 0;
  let totalShares = 0;
  let totalValue = 0;
  let totalInterest = 0;

  const investmentRecords = [];

  for (let i = 0; i < investmentLimit; i++) {
    const simulatedDate = new Date(
      today.getFullYear(),
      today.getMonth() + i + 1,
      0
    );

    simulatedSharePrice = simulatedSharePrice * (1 + averageMonthlyReturn);
    const sharesPurchased = user.monthlyInvestment / simulatedSharePrice;

    totalInvestmentAmount += parseFloat(user.monthlyInvestment);
    totalShares += parseFloat(sharesPurchased);
    totalValue = parseFloat((totalShares * simulatedSharePrice).toFixed(2));
    totalInterest = parseFloat((totalValue - totalInvestmentAmount).toFixed(2));

    const historicalDate = historicalData[i].date;

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
      interest: totalInterest >= 0 ? totalInterest : 0,
    });
  }

  await InvestmentRecord.insertMany(investmentRecords);
  return investmentRecords;
}

module.exports = { generateInvestmentRecords, calculateFullMonthDifference };