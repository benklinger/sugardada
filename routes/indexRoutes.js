const express = require('express');
const router = express.Router();

const {
  renderHome,
  startDemo,
  finalizeAndRedirect, 
  showUserById
} = require('../controllers/indexController');

router.get('/', renderHome);
router.get('/demo', startDemo);
router.get('/plan', finalizeAndRedirect);
router.get('/plan/:userId', showUserById);

module.exports = router;