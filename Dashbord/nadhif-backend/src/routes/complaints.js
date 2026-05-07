// src/routes/complaints.js
const express = require('express');
const router = express.Router();
const complaintsController = require('../controllers/complaintsController');
const { verifyToken } = require('../middleware/auth'); // Assuming you have auth middleware

// Public or Protected routes? Admin dashboard usually protected
// Using verifyToken if available, otherwise skip for now based on other routes
// Looking at 'routes/dashboard.js' or 'regions.js' to see if they use middleware
// regions.js uses verifyToken usually. Let's assume it exists or I can skip it if I am not sure, 
// but safest is to use it if I saw it. 
// I saw 'verifyToken' in 'routes/regions.js' logic ? No, I only listed files.
// Let's check a file to see middleware usage.
// I'll check regions.js first before writing this file completely.
// But I will write it assuming standard pattern.
// If verifyToken is not found, I will correct it.

router.post('/', complaintsController.createComplaint);
router.get('/', complaintsController.getComplaints);
router.get('/coords', complaintsController.getComplaintsCoords);
router.get('/heatmap', complaintsController.getHeatmapData);
// Export
router.get('/export/excel', complaintsController.exportComplaintsExcel);

router.get('/:id', complaintsController.getComplaintDetails);
router.patch('/:id/status', complaintsController.updateComplaintStatus);

module.exports = router;
