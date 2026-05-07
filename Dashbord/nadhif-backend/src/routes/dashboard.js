// src/routes/dashboard.js
const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboardController');

const isDev = process.env.NODE_ENV === 'development';
const authMiddleware = isDev ? (req, res, next) => next() : (req, res, next) => next();

router.get('/kpis', authMiddleware, dashboardController.getKPIs);
router.get('/trend', authMiddleware, dashboardController.getComplaintsTrend);
router.get('/status-distribution', authMiddleware, dashboardController.getStatusDistribution);
router.get('/communes-distribution', authMiddleware, dashboardController.getCommunesDistribution); // ✅ NOUVEAU
router.get('/regions-stats', authMiddleware, dashboardController.getRegionsStats);

module.exports = router;
