const express = require('express');
const router = express.Router();
const {
  getInvestmentRecordsByParam,
  updateMonthlyInvestmentByParam,
  updateRiskByParam,
  updateTargetAge
} = require('../controllers/apiController');

router.get('/investment-records/:userId', getInvestmentRecordsByParam);
router.post('/update-monthly-investment/:userId', updateMonthlyInvestmentByParam);
router.post('/update-risk/:userId', updateRiskByParam);
router.post('/update-target-age/:userId', updateTargetAge);

module.exports = router;