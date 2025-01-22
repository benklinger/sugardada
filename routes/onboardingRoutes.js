const express = require('express');
const router = express.Router();
const {
  getStep1, postStep1,
  getStep2, postStep2,
  getStep3, postStep3,
  getStep4, postStep4,
  getStep5, postStep5,
  getStep6, postStep6,
  getStep7, postStep7
} = require('../controllers/onboardingController');

// Step 1 (Gender)
router.get('/1', getStep1);
router.post('/1', postStep1);

// Step 2 (Name)
router.get('/2', getStep2);
router.post('/2', postStep2);

// Step 3 (DOB)
router.get('/3', getStep3);
router.post('/3', postStep3);

// Step 4 (Monthly investment)
router.get('/4', getStep4);
router.post('/4', postStep4);

// Step 5 (Risk)
router.get('/5', getStep5);
router.post('/5', postStep5);

// Step 6 (IB)
router.get('/6', getStep6);
router.post('/6', postStep6);

// Step 7 (Email)
router.get('/7', getStep7);
router.post('/7', postStep7);

module.exports = router;