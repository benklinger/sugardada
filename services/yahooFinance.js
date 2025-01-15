// services/yahooFinance.js

const yahooFinance = require('yahoo-finance2').default;

/**
 * Fetches historical data for a specific ticker between startDate and endDate with a monthly interval.
 * @param {string} ticker - The stock ticker symbol (e.g., 'TECL').
 * @param {Date} startDate - The start date for fetching historical data.
 * @param {Date} endDate - The end date for fetching historical data.
 * @returns {Promise<Array>} - An array of historical data objects.
 */
async function getHistoricalData(ticker, startDate, endDate) {
  try {
    const queryOptions = { period1: startDate, period2: endDate, interval: '1mo' };
    const result = await yahooFinance.historical(ticker, queryOptions);
    return result;
  } catch (error) {
    console.error(`Error fetching historical data for ${ticker}:`, error.message);
    throw error;
  }
}

module.exports = {
  getHistoricalData
};