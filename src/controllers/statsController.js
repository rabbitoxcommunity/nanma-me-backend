const Project = require("../models/Project");
const Gallery = require("../models/Gallery");
const Enquiry = require("../models/Enquiry");

exports.dashboard = async (req, res) => {
  const [
    projectsTotal,
    projectsByStatus,
    galleryTotal,
    enquiriesTotal,
    enquiriesNew,
    recentEnquiries,
  ] = await Promise.all([
    Project.countDocuments(),
    Project.aggregate([{ $group: { _id: "$status", count: { $sum: 1 } } }]),
    Gallery.countDocuments(),
    Enquiry.countDocuments(),
    Enquiry.countDocuments({ status: "new" }),
    Enquiry.find().sort({ createdAt: -1 }).limit(5).lean(),
  ]);

  const statusMap = projectsByStatus.reduce((acc, row) => {
    acc[row._id] = row.count;
    return acc;
  }, {});

  res.json({
    projects: {
      total: projectsTotal,
      ongoing: statusMap.ongoing || 0,
      ready: statusMap.ready || 0,
      completed: statusMap.completed || 0,
      upcoming: statusMap.upcoming || 0,
    },
    gallery: { total: galleryTotal },
    enquiries: { total: enquiriesTotal, new: enquiriesNew, recent: recentEnquiries },
  });
};
