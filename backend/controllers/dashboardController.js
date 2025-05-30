// controllers/dashboardController.js
const User = require('../models/User');
const Rc = require('../models/Rc');

exports.getDashboardData = async (req, res, next) => {
  try {
    const rcEntries = await Rc.find();
    const rcStats = {
      totalRc: rcEntries.length,
      totalRcTransferred: rcEntries.filter(e => e.status === 'transferred').length,
      totalRtoFeeDone: rcEntries.filter(e => e.rtoFeesPaid).length,
      totalRcTransferLeft: rcEntries.filter(e => e.status !== 'transferred').length
    };

    const dashboardData = {
      totalBuyLetters: 0,
      totalSellLetters: 0,
      totalBuyValue: 0,
      totalSellValue: 0,
      profit: 0,
      ownerName: req.user.name,
      recentTransactions: {
        buy: [],
        sell: [],
        service: []
      },
      monthlyData: [],
      rcStats: rcStats  // Make sure this is properly nested
    };

    res.status(200).json({
      success: true,
      data: dashboardData
    });
  } catch (err) {
    next(err);
  }
};

exports.getOwnerDashboardData = async (req, res, next) => {
  try {
    // Similar to above but filtered for owner
    const rcEntries = await Rc.find({ createdBy: req.user.id });
    const rcStats = {
      totalRc: rcEntries.length,
      totalRcTransferred: rcEntries.filter(e => e.status === 'transferred').length,
      totalRtoFeeDone: rcEntries.filter(e => e.rtoFeesPaid).length,
      totalRcTransferLeft: rcEntries.filter(e => e.status !== 'transferred').length
    };

    const dashboardData = {
      totalBuyLetters: 0,
      totalSellLetters: 0,
      totalBuyValue: 0,
      totalSellValue: 0,
      profit: 0,
      ownerName: req.user.name,
      recentTransactions: {
        buy: [],
        sell: [],
        service: []
      },
      monthlyData: [],
      rcStats
    };

    res.status(200).json({
      success: true,
      data: dashboardData
    });
  } catch (err) {
    next(err);
  }
};