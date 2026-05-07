// src/routes/logs.js
const express = require('express');
const router = express.Router();
const logsController = require('../controllers/logsController');
const { requireAuth, requireSuperAdmin } = require('../middleware/auth');

/**
 * @route GET /api/logs
 * @desc Récupérer les logs d'activité (Super Admin seulement ou Admin)
 */
router.get('/', requireAuth, logsController.getLogs);

module.exports = router;
