// src/routes/stats.js
const express = require('express');
const router = express.Router();
const statsController = require('../controllers/statsController');
const statsService = require('../services/statsService');
const { requireAuth, requireRole } = require('../middleware/auth');

// Pour le développement, on désactive temporairement l'auth
const isDev = process.env.NODE_ENV === 'development';
const authMiddleware = isDev ? (req, res, next) => next() : requireAuth;
const roleMiddleware = isDev ? (req, res, next) => next() : requireRole(['admin', 'super_admin']);

// Route de test pour vérifier les données
router.get('/test-data', async (req, res) => {
  try {
    const pool = await require('../db/pool'); // ✅ CHANGEMENT ICI

    // Test simple - compter les plaintes
    const countResult = await pool.query(`
      SELECT 
        COUNT(*) as total,
        COUNT(DISTINCT region_id) as total_regions,
        COUNT(DISTINCT team_id) as total_teams
      FROM complaints
    `);

    // Quelques exemples de plaintes
    const samplesResult = await pool.query(`
      SELECT 
        id, 
        code, 
        complaint_type, 
        waste_type, 
        created_at
      FROM complaints
      ORDER BY created_at DESC
      LIMIT 5
    `);

    // Par type de déchet
    const wasteTypeResult = await pool.query(`
      SELECT 
        COALESCE(waste_type, 'Non défini') as type,
        COUNT(*) as count
      FROM complaints
      GROUP BY waste_type
      ORDER BY count DESC
    `);

    // Par région
    const regionResult = await pool.query(`
      SELECT 
        COALESCE(r.name, 'Sans région') as region,
        COUNT(c.id) as count
      FROM complaints c
      LEFT JOIN regions r ON c.region_id = r.id
      GROUP BY r.name
      ORDER BY count DESC
    `);

    res.json({
      success: true,
      summary: countResult.rows[0],
      samples: samplesResult.rows,
      by_waste_type: wasteTypeResult.rows,
      by_region: regionResult.rows
    });

  } catch (error) {
    console.error('❌ Erreur test-data:', error);
    res.status(500).json({
      error: error.message,
      stack: error.stack
    });
  }
});

// Stats principales (utilisé par les graphiques)
router.post('/stats', authMiddleware, roleMiddleware, statsController.getStats);

// KPIs filtrés
router.post('/stats/kpis', authMiddleware, roleMiddleware, async (req, res) => {
  try {
    const pool = await require('../db/pool'); // ✅ CHANGEMENT ICI
    const filters = req.body;
    
    let whereClauses = [];
    let params = [];
    let paramIndex = 1;

    if (filters.date_from) {
      whereClauses.push(`c.created_at >= $${paramIndex++}`);
      params.push(filters.date_from);
    }

    if (filters.date_to) {
      whereClauses.push(`c.created_at <= $${paramIndex++}`);
      params.push(filters.date_to);
    }

    if (filters.region_ids && filters.region_ids.length > 0) {
      whereClauses.push(`c.region_id = ANY($${paramIndex++})`);
      params.push(filters.region_ids);
    }

    if (filters.team_ids && filters.team_ids.length > 0) {
      whereClauses.push(`c.team_id = ANY($${paramIndex++})`);
      params.push(filters.team_ids);
    }

    const whereClause = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

    const query = `
      SELECT 
        COUNT(*) as total,
        COUNT(CASE WHEN csh_last.new_status IN ('new', 'assigned', 'in_progress') THEN 1 END) as open,
        COUNT(CASE WHEN csh_last.new_status = 'resolved' THEN 1 END) as resolved,
        COUNT(CASE WHEN csh_last.new_status = 'closed' THEN 1 END) as closed,
        COUNT(DISTINCT c.region_id) as total_regions,
        COUNT(DISTINCT c.team_id) FILTER (WHERE c.team_id IS NOT NULL) as active_teams
      FROM complaints c
      LEFT JOIN LATERAL (
        SELECT new_status
        FROM complaint_status_history
        WHERE complaint_id = c.id
        ORDER BY changed_at DESC
        LIMIT 1
      ) csh_last ON true
      ${whereClause}
    `;

    const result = await pool.query(query, params);
    const row = result.rows[0];

    const total = parseInt(row.total) || 0;

    res.json({
      success: true,
      data: {
        total,
        open: parseInt(row.open) || 0,
        resolved: parseInt(row.resolved) || 0,
        closed: parseInt(row.closed) || 0,
        open_percentage: total > 0 ? ((parseInt(row.open) / total) * 100).toFixed(1) : 0,
        resolved_percentage: total > 0 ? ((parseInt(row.resolved) / total) * 100).toFixed(1) : 0,
        closed_percentage: total > 0 ? ((parseInt(row.closed) / total) * 100).toFixed(1) : 0,
        total_regions: parseInt(row.total_regions) || 0,
        active_teams: parseInt(row.active_teams) || 0,
        avg_resolution: '0',
        sla_48h: '0'
      }
    });

  } catch (error) {
    console.error('❌ Erreur getFilteredKPIs:', error);
    res.status(500).json({ 
      error: 'Erreur serveur',
      message: error.message 
    });
  }
});

// Métadonnées - Régions
router.get('/regions', authMiddleware, async (req, res) => {
  try {
    const regions = await statsService.getRegions();
    res.json({ success: true, data: regions });
  } catch (error) {
    console.error('❌ Erreur régions:', error);
    res.status(500).json({ 
      error: 'Erreur serveur',
      message: error.message 
    });
  }
});

// Métadonnées - Équipes
router.get('/teams', authMiddleware, async (req, res) => {
  try {
    const teams = await statsService.getTeams();
    res.json({ success: true, data: teams });
  } catch (error) {
    console.error('❌ Erreur équipes:', error);
    res.status(500).json({ 
      error: 'Erreur serveur',
      message: error.message 
    });
  }
});

module.exports = router;
