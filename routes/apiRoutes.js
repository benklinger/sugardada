const express = require('express');
const router = express.Router();
const {
  getInvestmentRecords,
  updateMonthlyInvestment,
  updateRisk
} = require('../controllers/apiController');

router.get('/investment-records', getInvestmentRecords);
router.post('/update-monthly-investment', updateMonthlyInvestment);
router.post('/update-risk', updateRisk);

module.exports = router;