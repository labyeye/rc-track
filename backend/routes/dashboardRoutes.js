// routes/dashboardRoutes.js
const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const {
  getDashboardData,
  getOwnerDashboardData
} = require('../controllers/dashboardController');

router.get('/', protect, getDashboardData);
router.get('/owner', protect, getOwnerDashboardData);

module.exports = router;