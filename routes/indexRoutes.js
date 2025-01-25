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
router.get('/results', finalizeAndRedirect);
router.get('/results/:userId', showUserById);

module.exports = router;