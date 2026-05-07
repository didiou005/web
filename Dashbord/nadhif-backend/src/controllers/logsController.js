// src/controllers/logsController.js
const poolPromise = require('../db/pool');

/**
 * Récupérer les logs avec filtres, pagination et recherche
 */
exports.getLogs = async (req, res) => {
  const pool = await poolPromise;
  try {
    const { 
      page = 1, 
      limit = 20, 
      type,       // filtre: CREATE, UPDATE, DELETE...
      entity,     // filtre: COMPLAINT, REGION...
      search,     // recherche textuelle
      startDate,  
      endDate 
    } = req.query;

    const offset = (page - 1) * limit;
    const values = [];
    let queryDetail = `
      FROM activity_logs l
      LEFT JOIN admin_users u ON l.admin_id = u.id
      WHERE 1=1
    `;
    let countIndex = 1;

    // --- Filtres ---

    if (type && type !== 'all') {
      queryDetail += ` AND l.action_type = $${countIndex++}`;
      values.push(type);
    }

    if (entity && entity !== 'all') {
      queryDetail += ` AND l.entity_type = $${countIndex++}`;
      values.push(entity);
    }

    if (startDate) {
      queryDetail += ` AND l.created_at >= $${countIndex++}`;
      values.push(startDate);
    }

    if (endDate) {
      queryDetail += ` AND l.created_at <= $${countIndex++}`;
      values.push(endDate + ' 23:59:59');
    }

    if (search) {
      queryDetail += ` AND (
        u.email ILIKE $${countIndex} OR 
        u.full_name ILIKE $${countIndex} OR
        l.description ILIKE $${countIndex}
      )`;
      values.push(`%${search}%`);
      countIndex++;
    }

    // --- Exécution ---

    // 1. Compter le total pour la pagination
    const countQuery = `SELECT COUNT(*) as total ${queryDetail}`;
    const countResult = await pool.query(countQuery, values);
    const total = parseInt(countResult.rows[0].total);

    // 2. Récupérer les données
    const dataQuery = `
      SELECT 
        l.id,
        l.action_type,
        l.entity_type,
        l.entity_id,
        l.description,
        l.created_at,
        l.ip_address,
        u.full_name as author_name,
        u.email as author_email,
        u.role as author_role
      ${queryDetail}
      ORDER BY l.created_at DESC
      LIMIT $${countIndex++} OFFSET $${countIndex++}
    `;
    
    // Ajouter limit et offset aux valeurs
    values.push(parseInt(limit), parseInt(offset));

    const result = await pool.query(dataQuery, values);

    res.json({
      success: true,
      data: result.rows,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    console.error('Erreur getLogs:', error);
    res.status(500).json({ error: 'Erreur serveur lors de la récupération des logs' });
  }
};

/**
 * Fonction utilitaire pour créer un log (à utiliser dans les autres contrôleurs)
 * Ex: await logsController.logAction(req.user.id, 'UPDATE', 'COMPLAINT', complaintId, 'Changement statut vers résolu');
 */
exports.logAction = async (adminId, actionType, entityType, entityId, description, metadata = null, req = null) => {
    try {
        const pool = await poolPromise;
        
        let ip = 'Unknown';
        let userAgent = 'System';
        
        if (req) {
             ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
             userAgent = req.headers['user-agent'];
        }

        await pool.query(
            `INSERT INTO activity_logs (admin_id, action_type, entity_type, entity_id, description, metadata, ip_address, user_agent)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
            [adminId, actionType, entityType, entityId, description, metadata, ip, userAgent]
        );
        console.log(`📝 Log enregistré: ${actionType} ${entityType} par ${adminId}`);
    } catch (error) {
        console.error("❌ Erreur lors de l'enregistrement du log:", error);
        // On ne bloque pas l'exécution principale si le log échoue
    }
};
