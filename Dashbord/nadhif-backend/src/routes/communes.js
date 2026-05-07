const express = require('express');
const router = express.Router();
const communesController = require('../controllers/communesController');

// Helper for dev mode logic if needed, similar to regions.js
const isDev = true; 
const authMiddleware = isDev ? (req, res, next) => next() : require('../middleware/auth').requireAuth;

router.get('/', authMiddleware, communesController.getAllCommunes);

module.exports = router;
