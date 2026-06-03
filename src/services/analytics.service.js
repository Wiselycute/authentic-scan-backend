const User = require('../models/User');
const Scan = require('../models/Scan');
const Report = require('../models/Report');

const getAdminAnalytics = async () => {
  const [
    userCount,
    scanStats,
    reportStats,
    recentScans,
    mostScannedBrands,
    mostScannedCategories,
    mostReportedSuspicious,
  ] = await Promise.all([
    User.countDocuments(),
    Scan.aggregate([
      {
        $group: {
          _id: '$verificationStatus',
          count: { $sum: 1 },
        },
      },
    ]),
    Report.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
        },
      },
    ]),
    Scan.find()
      .sort({ createdAt: -1 })
      .limit(10)
      .select(
        'verificationStatus aiAnalysis.confidence aiAnalysis.suspiciousIndicators aiAnalysis.reasoning createdAt source productName brandName category uploadedImage barcode'
      )
      .lean(),
    Scan.aggregate([
      { $match: { brandName: { $exists: true, $ne: '' } } },
      { $group: { _id: '$brandName', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 5 },
    ]),
    Scan.aggregate([
      { $match: { category: { $exists: true, $ne: '' } } },
      { $group: { _id: '$category', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 5 },
    ]),
    Report.aggregate([
      {
        $lookup: {
          from: 'scans',
          localField: 'scan',
          foreignField: '_id',
          as: 'scanDoc',
        },
      },
      { $unwind: { path: '$scanDoc', preserveNullAndEmptyArrays: false } },
      {
        $group: {
          _id: '$scanDoc.productName',
          count: { $sum: 1 },
          brandName: { $first: '$scanDoc.brandName' },
        },
      },
      { $sort: { count: -1 } },
      { $limit: 5 },
    ]),
  ]);

  return {
    users: userCount,
    scanBreakdown: scanStats,
    reportBreakdown: reportStats,
    recentScans,
    mostScannedBrands,
    mostScannedCategories,
    mostReportedSuspicious,
  };
};

module.exports = { getAdminAnalytics };
