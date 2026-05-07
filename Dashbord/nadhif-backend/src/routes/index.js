// src/routes/index.js
const express = require('express');
const authRoutes = require('./auth');
const dashboardRoutes = require('./dashboard');
const statsRoutes = require('./stats');
const regionsRoutes = require('./regions');
const teamsRoutes = require('./teams');

const router = express.Router();

router.use('/auth', authRoutes);
router.use('/dashboard', dashboardRoutes);
router.use('/stats', statsRoutes);
router.use('/regions', regionsRoutes);
router.use('/teams', teamsRoutes);
router.use('/employees', require('./employees'));
router.use('/communes', require('./communes'));
router.use('/complaints', require('./complaints'));
router.use('/logs', require('./logs'));

// Route de test
router.get('/ping', (req, res) => {
  res.json({ 
    message: 'NADHIF API is running',
    timestamp: new Date().toISOString()
  });
});

module.exports = router;
