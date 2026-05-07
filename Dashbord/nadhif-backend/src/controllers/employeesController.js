// src/controllers/employeesController.js
const poolPromise = require('../db/pool');
const logsController = require('./logsController');

/**
 * Liste tous les employés (membres d'équipe) avec les détails de leur équipe
 */
exports.getAll = async (req, res) => {
  const pool = await poolPromise;
  try {
    const query = `
      SELECT 
        tm.id,
        tm.full_name,
        tm.role,
        tm.phone,
        tm.created_at,
        tm.team_id,
        t.name as team_name,
        t.region_id,
        r.name as region_name
      FROM team_members tm
      LEFT JOIN teams t ON tm.team_id = t.id
      LEFT JOIN regions r ON t.region_id = r.id
      ORDER BY tm.full_name ASC
    `;

    const result = await pool.query(query);

    res.json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    console.error('Erreur getEmployees:', error);
    res.status(500).json({ 
      success: false,
      error: 'Erreur serveur lors de la récupération des employés',
      message: error.message 
    });
  }
};

/**
 * Crée un nouvel employé
 */
exports.create = async (req, res) => {
  const pool = await poolPromise;
  try {
    const { full_name, role, phone, team_id } = req.body;

    const query = `
      INSERT INTO team_members (full_name, role, phone, team_id)
      VALUES ($1, $2, $3, $4)
      RETURNING *
    `;

    const result = await pool.query(query, [full_name, role, phone, team_id || null]);

    // Log creation
    await logsController.logAction(req.user.id, 'CREATE', 'EMPLOYEE', result.rows[0].id, `Création employé: ${full_name}`, req.body, req);

    res.status(201).json({
      success: true,
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Erreur createEmployee:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Erreur lors de la création de l\'employé',
      message: error.message 
    });
  }
};

/**
 * Met à jour un employé
 */
exports.update = async (req, res) => {
  const pool = await poolPromise;
  try {
    const { id } = req.params;
    const { full_name, role, phone, team_id } = req.body;

    const query = `
      UPDATE team_members 
      SET full_name = $1, role = $2, phone = $3, team_id = $4
      WHERE id = $5
      RETURNING *
    `;

    const result = await pool.query(query, [full_name, role, phone, team_id || null, id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Employé introuvable' });
    }

    // Log update
    await logsController.logAction(req.user.id, 'UPDATE', 'EMPLOYEE', id, `Mise à jour employé: ${full_name}`, { changedFields: req.body }, req);

    res.json({
      success: true,
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Erreur updateEmployee:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Erreur lors de la mise à jour',
      message: error.message 
    });
  }
};

/**
 * Supprime un employé
 */
exports.delete = async (req, res) => {
  const pool = await poolPromise;
  try {
    const { id } = req.params;

    const result = await pool.query('DELETE FROM team_members WHERE id = $1 RETURNING id', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Employé introuvable' });
    }

    // Log deletion
    await logsController.logAction(req.user.id, 'DELETE', 'EMPLOYEE', id, `Suppression employé (ID: ${id})`, null, req);

    res.json({
      success: true,
      message: 'Employé supprimé avec succès'
    });
  } catch (error) {
    console.error('Erreur deleteEmployee:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Erreur lors de la suppression',
      message: error.message 
    });
  }
};
