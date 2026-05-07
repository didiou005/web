// src/controllers/teamsController.js
const poolPromise = require('../db/pool');
const logsController = require('./logsController');

/**
 * Liste toutes les équipes avec le nombre de membres et le nom de la zone (région)
 */
exports.getTeams = async (req, res) => {
  const pool = await poolPromise;
  try {
    const query = `
      SELECT 
        t.id,
        t.name,
        t.vehicle_info,
        t.working_hours,
        t.region_id,
        r.name as region_name,
        (SELECT COUNT(*) FROM team_members tm WHERE tm.team_id = t.id) as members_count
      FROM teams t
      LEFT JOIN regions r ON t.region_id = r.id
      ORDER BY t.name ASC
    `;

    const result = await pool.query(query);

    res.json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    console.error('Erreur getTeams:', error);
    res.status(500).json({ 
      success: false,
      error: 'Erreur serveur lors de la récupération des équipes',
      message: error.message 
    });
  }
};

/**
 * Récupère une équipe par son ID avec ses membres
 */
exports.getTeamById = async (req, res) => {
  const pool = await poolPromise;
  try {
    const { id } = req.params;

    const teamQuery = `
      SELECT 
        t.*,
        r.name as region_name
      FROM teams t
      LEFT JOIN regions r ON t.region_id = r.id
      WHERE t.id = $1
    `;

    const membersQuery = `
      SELECT * FROM team_members 
      WHERE team_id = $1
      ORDER BY role, full_name
    `;

    const [teamResult, membersResult] = await Promise.all([
      pool.query(teamQuery, [id]),
      pool.query(membersQuery, [id])
    ]);

    if (teamResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Équipe introuvable'
      });
    }

    res.json({
      success: true,
      data: {
        ...teamResult.rows[0],
        members: membersResult.rows
      }
    });
  } catch (error) {
    console.error('Erreur getTeamById:', error);
    res.status(500).json({ 
      success: false,
      error: 'Erreur serveur',
      message: error.message 
    });
  }
};

/**
 * Crée une nouvelle équipe et ses membres
 */
exports.createTeam = async (req, res) => {
  const pool = await poolPromise;
  try {
    const { name, vehicle_info, working_hours, region_id, members } = req.body;

    await pool.query('BEGIN');

    const teamQuery = `
      INSERT INTO teams (name, vehicle_info, working_hours, region_id)
      VALUES ($1, $2, $3, $4)
      RETURNING *
    `;

    const teamResult = await pool.query(teamQuery, [name, vehicle_info, working_hours, region_id]);
    const team = teamResult.rows[0];

    if (members && Array.isArray(members)) {
      for (const member of members) {
        if (member.id) {
          // Employé existant : on met à jour son affectation
          await pool.query(
            'UPDATE team_members SET team_id = $1, role = $2, phone = $3, full_name = $4 WHERE id = $5',
            [team.id, member.role, member.phone, member.full_name, member.id]
          );
        } else if (member.full_name) {
          // Nouvel employé
          await pool.query(
            'INSERT INTO team_members (team_id, full_name, role, phone) VALUES ($1, $2, $3, $4)',
            [team.id, member.full_name, member.role, member.phone]
          );
        }
      }
    }

    await pool.query('COMMIT');

    // Log creation
    await logsController.logAction(req.user.id, 'CREATE', 'TEAM', team.id, `Création équipe: ${name}`, { vehicle: vehicle_info, region: region_id }, req);

    res.status(201).json({
      success: true,
      data: team
    });
  } catch (error) {
    await pool.query('ROLLBACK');
    console.error('Erreur createTeam:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Erreur lors de la création de l\'équipe',
      message: error.message 
    });
  }
};

/**
 * Met à jour une équipe et gère ses membres (affectation/désaffectation)
 */
exports.updateTeam = async (req, res) => {
  const pool = await poolPromise;
  try {
    const { id } = req.params;
    const { name, vehicle_info, working_hours, region_id, members } = req.body;

    await pool.query('BEGIN');

    const updateQuery = `
      UPDATE teams 
      SET name = $1, vehicle_info = $2, working_hours = $3, region_id = $4
      WHERE id = $5
      RETURNING *
    `;

    const result = await pool.query(updateQuery, [name, vehicle_info, working_hours, region_id, id]);

    if (result.rows.length === 0) {
      await pool.query('ROLLBACK');
      return res.status(404).json({ success: false, error: 'Équipe introuvable' });
    }

    // 1. Désaffecter tous les membres actuels de cette équipe (team_id = NULL)
    // Cela permet de "retirer" un membre de l'équipe sans supprimer l'employé
    await pool.query('UPDATE team_members SET team_id = NULL WHERE team_id = $1', [id]);
    
    // 2. Réaffecter ou Créer les membres envoyés
    if (members && Array.isArray(members)) {
      for (const member of members) {
        if (member.id) {
          // Employé existant (qu'il soit déjà dans l'équipe ou vienne d'ailleurs) : Mise à jour + Affectation
          await pool.query(
            'UPDATE team_members SET team_id = $1, full_name = $2, role = $3, phone = $4 WHERE id = $5',
            [id, member.full_name, member.role, member.phone, member.id]
          );
        } else if (member.full_name) {
          // Nouvel employé créé à la volée
          await pool.query(
            'INSERT INTO team_members (team_id, full_name, role, phone) VALUES ($1, $2, $3, $4)',
            [id, member.full_name, member.role, member.phone]
          );
        }
      }
    }

    await pool.query('COMMIT');

    // Log update
    await logsController.logAction(req.user.id, 'UPDATE', 'TEAM', id, `Mise à jour équipe: ${name}`, { changedFields: req.body }, req);

    res.json({
      success: true,
      data: result.rows[0]
    });
  } catch (error) {
    await pool.query('ROLLBACK');
    console.error('Erreur updateTeam:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Erreur lors de la mise à jour',
      message: error.message 
    });
  }
};

/**
 * Supprime une équipe si aucune plainte n'y est rattachée
 */
exports.deleteTeam = async (req, res) => {
  const pool = await poolPromise;
  try {
    const { id } = req.params;

    // 1. Vérifier si des plaintes sont assignées
    const checkQuery = 'SELECT COUNT(*) FROM complaints WHERE team_id = $1';
    const checkResult = await pool.query(checkQuery, [id]);
    
    if (parseInt(checkResult.rows[0].count) > 0) {
      return res.status(400).json({ 
        success: false,
        error: 'Suppression impossible', 
        message: 'Cette équipe a des plaintes assignées et ne peut pas être supprimée.' 
      });
    }

    await pool.query('BEGIN');
    // 2. Désaffecter les membres (au lieu de les supprimer)
    await pool.query('UPDATE team_members SET team_id = NULL WHERE team_id = $1', [id]);
    // 3. Supprimer l'équipe
    await pool.query('DELETE FROM teams WHERE id = $1', [id]);
    await pool.query('COMMIT');

    // Log deletion
    await logsController.logAction(req.user.id, 'DELETE', 'TEAM', id, `Suppression équipe (ID: ${id})`, null, req);

    res.json({
      success: true,
      message: 'Équipe supprimée avec succès'
    });
  } catch (error) {
    await pool.query('ROLLBACK');
    console.error('Erreur deleteTeam:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Erreur lors de la suppression',
      message: error.message 
    });
  }
};

/**
 * Statistiques de performance simplifiées
 */
exports.getTeamPerformance = async (req, res) => {
  const pool = await poolPromise;
  try {
    const { team_id } = req.params;
    
    const query = `
      SELECT 
        COUNT(*) as total_assigned,
        COUNT(CASE WHEN status = 'resolue' THEN 1 END) as resolved_count,
        COUNT(CASE WHEN status IN ('en_attente', 'en_cours') THEN 1 END) as pending_count
      FROM complaints
      WHERE team_id = $1
    `;

    const result = await pool.query(query, [team_id]);

    res.json({
      success: true,
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Erreur getTeamPerformance:', error);
    res.status(500).json({ success: false, error: 'Erreur serveur' });
  }
};
