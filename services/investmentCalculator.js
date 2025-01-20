const mongoose = require('mongoose');
const { getHistoricalData } = require('../services/yahooFinance');
const InvestmentRecord = require('../models/InvestmentRecord');

function calculateFullMonthDifference(startDate,endDate){
  let years=endDate.getFullYear()-startDate.getFullYear();
  let months=endDate.getMonth()-startDate.getMonth();
  let days=endDate.getDate()-startDate.getDate();
  let totalMonths=years*12+months;if(days<0)totalMonths-=1;
  return totalMonths;
}

async function generateInvestmentRecords(user,today){
  const dobDate=new Date(user.dob);
  const eighteenBirthday=new Date(dobDate.getFullYear()+18,dobDate.getMonth(),dobDate.getDate());
  let totalMonths=calculateFullMonthDifference(today,eighteenBirthday);
  if(totalMonths<=0)throw new Error('User is already 18 or older.');
  const investmentLimit=totalMonths;
  const historicalStartDate=new Date(today.getFullYear(),today.getMonth()-investmentLimit,1);
  const historicalEndDate=today;
  const historicalData=await getHistoricalData(user.investmentTicker,historicalStartDate,historicalEndDate);
  if(!historicalData||!historicalData.length)throw new Error('No historical data found for the provided ticker.');
  historicalData.sort((a,b)=>a.date-b.date);
  if(historicalData.length<investmentLimit)throw new Error(`Insufficient historical data. Required: ${investmentLimit}, Available: ${historicalData.length}`);
  let totalInvestmentAmount=0, totalShares=0, totalValue=0, totalInterest=0;
  const investmentRecords=[];
  for(let i=0;i<investmentLimit;i++){
    const monthlyClose=historicalData[i].close;
    const simulatedDate=new Date(today.getFullYear(),today.getMonth()+i+1,0);
    const historicalDate=historicalData[i].date;
    const sharesPurchased=user.monthlyInvestment/monthlyClose;
    totalInvestmentAmount+=parseFloat(user.monthlyInvestment);
    totalShares+=parseFloat(sharesPurchased);
    totalValue=parseFloat((totalShares*monthlyClose).toFixed(2));
    totalInterest=parseFloat((totalValue-totalInvestmentAmount).toFixed(2));
    investmentRecords.push({
      user:user._id,
      investmentTicker:user.investmentTicker.toUpperCase(),
      investment:parseFloat(user.monthlyInvestment),
      historicalDate,
      simulatedDate,
      totalInvestment:parseFloat(totalInvestmentAmount.toFixed(2)),
      sharePrice:parseFloat(monthlyClose.toFixed(2)),
      sharesPurchased:parseFloat(sharesPurchased.toFixed(4)),
      totalValue,
      interest:totalInterest>=0?totalInterest:0
    });
  }
  await InvestmentRecord.insertMany(investmentRecords);
  return investmentRecords;
}

module.exports={generateInvestmentRecords,calculateFullMonthDifference};