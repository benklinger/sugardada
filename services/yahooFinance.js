// services/yahooFinance.js

const yahooFinance = require('yahoo-finance2').default;

// Suppress the specific deprecation notice
yahooFinance.suppressNotices(['ripHistorical']);

/**
 * Fetch historical stock data for a given ticker and date range.
 * @param {string} ticker - Stock ticker symbol (e.g., 'AAPL').
 * @param {Date} startDate - Start date for historical data.
 * @param {Date} endDate - End date for historical data.
 * @returns {Promise<Array>} - Array of historical data points.
 */
async function getHistoricalData(ticker, startDate, endDate) {
  try {
    const queryOptions = { period1: startDate, period2: endDate, interval: '1mo' };
    const result = await yahooFinance.historical(ticker, queryOptions);
    return result;
  } catch (error) {
    console.error(`Error fetching historical data for ${ticker}:`, error);
    throw error;
  }
}

module.exports = { getHistoricalData };