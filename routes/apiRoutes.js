const express = require('express');
const router = express.Router();
const {
  getInvestmentRecordsByParam,
  updateMonthlyInvestmentByParam,
  updateRiskByParam
} = require('../controllers/apiController');

// 1) GET /api/investment-records/:userId
router.get('/investment-records/:userId', getInvestmentRecordsByParam);

// 2) POST /api/update-monthly-investment/:userId
router.post('/update-monthly-investment/:userId', updateMonthlyInvestmentByParam);

// 3) POST /api/update-risk/:userId
router.post('/update-risk/:userId', updateRiskByParam);

module.exports = router;