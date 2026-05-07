const poolPromise = require('../db/pool');

/**
 * GET /api/communes
 * Retrieves all communes ordered by name.
 */
exports.getAllCommunes = async (req, res) => {
  try {
     const pool = await poolPromise;
     const result = await pool.query('SELECT id, name, code_postal FROM communes ORDER BY name ASC');
     
     res.json({
        success: true,
        data: result.rows
     });
  } catch (error) {
    console.error('GetAllCommunes error:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
};
