// src/controllers/statsController.js

/**
 * Récupérer les statistiques selon metric/dimension/filters
 */
exports.getStats = async (req, res) => {
  try {
    const pool = await require('../db/pool');
    const { metric, dimension, filters } = req.body;

    console.log('📊 Requête stats reçue:', { metric, dimension, filters });

    if (!metric || !dimension) {
      return res.status(400).json({
        error: 'Paramètres manquants',
        message: 'metric et dimension sont requis'
      });
    }

    // Définition du calcul de la métrique
    let metricExpr = 'COUNT(c.id)';
    if (metric === 'avg_resolution_time') {
      metricExpr = "AVG(CASE WHEN c.status = 'resolue' THEN EXTRACT(EPOCH FROM (c.updated_at - c.created_at)) / 3600 END)";
    } else if (metric === 'backlog') {
      metricExpr = "COUNT(c.id) FILTER (WHERE c.status IN ('en_attente', 'en_cours'))";
    } else if (metric === 'sla_compliance') {
      metricExpr = "100.0 * COUNT(c.id) FILTER (WHERE c.updated_at - c.created_at <= INTERVAL '48 hours' AND c.status = 'resolue') / NULLIF(COUNT(c.id) FILTER (WHERE c.status = 'resolue'), 0)";
    }

    // Construire la requête selon dimension
    let query = '';
    let params = [];

    // Gestion des filtres de date
    let dateFilter = '';
    if (filters?.date_from) {
      dateFilter += ` AND c.created_at >= $${params.length + 1}::timestamp`;
      params.push(filters.date_from);
    }
    if (filters?.date_to) {
      dateFilter += ` AND c.created_at <= $${params.length + 1}::timestamp`;
      params.push(filters.date_to + ' 23:59:59');
    }

    // Requêtes selon la dimension
    switch (dimension) {
      case 'date':
        // Si on a des filtres de date précis, on génère une série complète pour avoir une courbe continue
        if (filters?.date_from && filters?.date_to) {
          query = `
            SELECT 
              d.date as label,
              ${metricExpr} as value
            FROM (
              SELECT generate_series($1::timestamp, $2::timestamp, '1 day')::date as date
            ) d
            LEFT JOIN complaints c ON DATE(c.created_at) = d.date
            GROUP BY d.date
            ORDER BY d.date ASC
          `;
          params = [filters.date_from, filters.date_to];
        } else {
          query = `
            SELECT 
              DATE(c.created_at) as label,
              ${metricExpr} as value
            FROM complaints c
            WHERE 1=1 ${dateFilter}
            GROUP BY DATE(c.created_at)
            ORDER BY label ASC
          `;
        }
        break;

      case 'status':
        query = `
          SELECT 
            c.status as label,
            ${metricExpr} as value
          FROM complaints c
          WHERE 1=1 ${dateFilter}
          GROUP BY c.status
          ORDER BY value DESC
        `;
        break;

      case 'region':
        query = `
          SELECT 
            COALESCE(r.name, 'Sans région') as label,
            ${metricExpr} as value,
            COALESCE(r.color_hex, '#00d2ff') as color
          FROM complaints c
          LEFT JOIN regions r ON c.region_id = r.id
          WHERE 1=1 ${dateFilter}
          GROUP BY r.id, r.name, r.color_hex
          ORDER BY value DESC
        `;
        break;

      case 'waste_type':
        query = `
          SELECT 
            COALESCE(c.waste_type, 'Non défini') as label,
            ${metricExpr} as value
          FROM complaints c
          WHERE 1=1 ${dateFilter}
          GROUP BY c.waste_type
          ORDER BY value DESC
        `;
        break;

      case 'complaint_type':
        query = `
          SELECT 
            COALESCE(c.complaint_type, 'Non défini') as label,
            ${metricExpr} as value
          FROM complaints c
          WHERE 1=1 ${dateFilter}
          GROUP BY c.complaint_type
          ORDER BY value DESC
        `;
        break;

      case 'team':
        query = `
          SELECT 
            COALESCE(t.name, 'Sans équipe') as label,
            ${metricExpr} as value
          FROM complaints c
          LEFT JOIN teams t ON c.team_id = t.id
          WHERE 1=1 ${dateFilter}
          GROUP BY t.name
          ORDER BY value DESC
        `;
        break;

      default:
        return res.status(400).json({
          error: 'Dimension invalide',
          message: `Dimension "${dimension}" non supportée`
        });
    }

    const result = await pool.query(query, params);

    // Formater les résultats
    const data = result.rows.map(row => ({
      label: formatLabel(dimension, row.label),
      value: parseFloat(row.value) || 0
    }));

    res.json({
      success: true,
      data: data
    });

  } catch (error) {
    console.error('❌ Erreur getStats:', error);
    res.status(500).json({
      error: 'Erreur serveur',
      message: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};

/**
 * Récupérer les KPIs filtrés
 */
exports.getFilteredKPIs = async (req, res) => {
  try {
    const pool = await require('../db/pool');
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
        COUNT(CASE WHEN c.status IN ('en_attente', 'en_cours') THEN 1 END) as open,
        COUNT(CASE WHEN c.status = 'resolue' THEN 1 END) as resolved,
        COUNT(DISTINCT c.region_id) as total_regions,
        COUNT(DISTINCT c.team_id) FILTER (WHERE c.team_id IS NOT NULL) as active_teams,
        AVG(CASE WHEN c.status = 'resolue' THEN EXTRACT(EPOCH FROM (c.updated_at - c.created_at)) / 3600 END) as avg_res,
        COUNT(*) FILTER (WHERE c.status = 'resolue' AND c.updated_at - c.created_at <= INTERVAL '48 hours' AND c.updated_at - c.created_at <= INTERVAL '48 hours') as fast_res
      FROM complaints c
      ${whereClause}
    `;

    const result = await pool.query(query, params);
    const row = result.rows[0];

    const total = parseInt(row.total) || 0;
    const resolved = parseInt(row.resolved) || 0;
    const fastRes = parseInt(row.fast_res) || 0;

    res.json({
      success: true,
      data: {
        total,
        open: parseInt(row.open) || 0,
        resolved: resolved,
        total_regions: parseInt(row.total_regions) || 0,
        active_teams: parseInt(row.active_teams) || 0,
        avg_resolution: parseFloat(row.avg_res || 0).toFixed(1),
        sla_48h: resolved > 0 ? Math.round((fastRes / resolved) * 100) : 0
      }
    });
  } catch (error) {
    console.error('❌ Erreur getFilteredKPIs:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

/**
 * Fonction pour formater les labels
 */
function formatLabel(dimension, value) {
  if (!value || value === 'null') return 'Non défini';

  switch (dimension) {
    case 'date':
      return new Date(value).toLocaleDateString('fr-DZ', {
        day: '2-digit',
        month: 'short'
      });

    case 'status':
      const statusMap = {
        'en_attente': 'En attente',
        'en_cours': 'En cours',
        'resolue': 'Résolue'
      };
      return statusMap[value] || value;

    case 'complaint_type':
      const typeMap = {
        'illegal_dump': 'Dépôt sauvage',
        'overflow': 'Débordement',
        'collection': 'Collecte non effectuée',
        'other': 'Autre'
      };
      return typeMap[value] || value;

    case 'waste_type':
      const wasteMap = {
        'menager': 'Ménager',
        'inerte': 'Inerte'
      };
      return wasteMap[value] || value;

    default:
      return value;
  }
}
