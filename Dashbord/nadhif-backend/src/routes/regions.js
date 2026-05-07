// src/routes/regions.js
const express = require('express');
const router = express.Router();
const regionsController = require('../controllers/regionsController');

const isDev = true; // process.env.NODE_ENV === 'development';
const authMiddleware = isDev ? (req, res, next) => next() : require('../middleware/auth').requireAuth;

/**
 * @route GET /api/regions
 * @desc Get all regions with geometry
 */
router.get('/', authMiddleware, regionsController.getRegions);

/**
 * @route POST /api/regions
 * @desc Create a new region
 */
router.post('/', authMiddleware, regionsController.createRegion);

/**
 * @route GET /api/regions/stats
 * @desc Get statistics for all regions
 */
router.get('/stats', authMiddleware, regionsController.getRegionStats);
router.get('/map-data', authMiddleware, regionsController.getRegionsMapData);

/**
 * @route GET /api/regions/:id
 * @desc Get a single region by ID
 */
router.get('/:id', authMiddleware, regionsController.getRegionById);

/**
 * @route PUT /api/regions/:id
 * @desc Update a region
 */
router.put('/:id', authMiddleware, regionsController.editRegion);

/**
 * @route DELETE /api/regions/:id
 * @desc Delete a region
 */
router.delete('/:id', authMiddleware, regionsController.deleteRegion);

module.exports = router;
