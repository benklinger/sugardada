const express = require('express');
const router = express.Router();

const {
  renderHome,
  startDemo,
  showResults
} = require('../controllers/indexController');

router.get('/', renderHome);
router.get('/demo', startDemo);
router.get('/results', showResults);

module.exports = router;