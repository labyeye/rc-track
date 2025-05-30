const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');

router.route('/')
  .get(protect)
  .post(protect);
module.exports = router;
