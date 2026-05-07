// src/controllers/dashboardController.js (COMPLET)

exports.getKPIs = async (req, res) => {
  try {
    const pool = await require('../db/pool');

    const totalQuery = 'SELECT COUNT(*) as count FROM complaints';
    const totalResult = await pool.query(totalQuery);

    const statusQuery = `
      SELECT 
        COUNT(*) FILTER (WHERE status IN ('en_attente', 'en_cours')) as open,
        COUNT(*) FILTER (WHERE status = 'resolue') as resolved
      FROM complaints
    `;
    const statusResult = await pool.query(statusQuery);

    const todayQuery = `
      SELECT COUNT(*) as count 
      FROM complaints 
      WHERE DATE(created_at) = CURRENT_DATE
    `;
    const todayResult = await pool.query(todayQuery);

    // Temps moyen de résolution (en heures)
    const avgResQuery = `
      SELECT AVG(EXTRACT(EPOCH FROM (updated_at - created_at)) / 3600) as avg_hours
      FROM complaints 
      WHERE status = 'resolue'
    `;
    const avgResResult = await pool.query(avgResQuery);
    const avgHours = parseFloat(avgResResult.rows[0].avg_hours) || 0;

    // Résolues en moins de 48h (pourcentage)
    const fastResQuery = `
      SELECT 
        COUNT(*) FILTER (WHERE updated_at - created_at <= INTERVAL '48 hours') as fast_count,
        COUNT(*) as total_resolved
      FROM complaints 
      WHERE status = 'resolue'
    `;
    const fastResResult = await pool.query(fastResQuery);
    const fastCount = parseInt(fastResResult.rows[0].fast_count) || 0;
    const totalResolved = parseInt(fastResResult.rows[0].total_resolved) || 0;
    const fastResPercentage = totalResolved > 0 ? Math.round((fastCount / totalResolved) * 100) : 0;

    const total = parseInt(totalResult.rows[0].count) || 0;
    const statusRow = statusResult.rows[0];

    res.json({
      success: true,
      data: {
        total_complaints: total,
        open_complaints: parseInt(statusRow.open) || 0,
        new_today: parseInt(todayResult.rows[0].count) || 0,
        avg_resolution_time: avgHours.toFixed(1),
        resolved_under_48h: `${fastResPercentage}%`
      }
    });

  } catch (error) {
    console.error('❌ Erreur getKPIs:', error);
    res.status(500).json({ 
      error: 'Erreur serveur',
      message: error.message
    });
  }
};

exports.getComplaintsTrend = async (req, res) => {
  try {
    const pool = await require('../db/pool');
    const days = parseInt(req.query.days) || 30;

    const query = `
      SELECT 
        d.date,
        COALESCE(count, 0) as count
      FROM (
        SELECT (CURRENT_DATE - (n || ' days')::interval)::date as date
        FROM generate_series(0, ${days - 1}) n
      ) d
      LEFT JOIN (
        SELECT DATE(created_at) as date, COUNT(*) as count
        FROM complaints
        WHERE created_at >= CURRENT_DATE - INTERVAL '${days - 1} days'
        GROUP BY DATE(created_at)
      ) c ON d.date = c.date
      ORDER BY d.date ASC
    `;

    const result = await pool.query(query);

    res.json({
      success: true,
      data: result.rows.map(row => {
        const d = new Date(row.date);
        return {
          date: `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}`,
          count: parseInt(row.count)
        };
      })
    });

  } catch (error) {
    console.error('❌ Erreur getComplaintsTrend:', error);
    res.status(500).json({ 
      error: 'Erreur serveur',
      message: error.message
    });
  }
};

exports.getStatusDistribution = async (req, res) => {
  try {
    const pool = await require('../db/pool');

    const query = `
      SELECT 
        status,
        COUNT(*) as count
      FROM complaints
      GROUP BY status
      ORDER BY count DESC
    `;

    const result = await pool.query(query);

    res.json({
      success: true,
      data: result.rows.map(row => ({
        status: row.status,
        count: parseInt(row.count)
      }))
    });

  } catch (error) {
    console.error('❌ Erreur getStatusDistribution:', error);
    res.status(500).json({ 
      error: 'Erreur serveur',
      message: error.message
    });
  }
};

exports.getCommunesDistribution = async (req, res) => {
  try {
    const pool = await require('../db/pool');

    const query = `
      SELECT 
        com.name as commune,
        COUNT(c.id) as count
      FROM communes com
      LEFT JOIN complaints c ON com.id = c.commune_id
      GROUP BY com.name
      HAVING COUNT(c.id) > 0
      ORDER BY count DESC
    `;

    const result = await pool.query(query);

    console.log('📍 Communes distribution:', result.rows);

    res.json({
      success: true,
      data: result.rows.map(row => ({
        commune: row.commune,
        count: parseInt(row.count)
      }))
    });

  } catch (error) {
    console.error('❌ Erreur getCommunesDistribution:', error);
    res.status(500).json({ 
      error: 'Erreur serveur',
      message: error.message
    });
  }
};

exports.getRegionsStats = async (req, res) => {
  try {
    const pool = await require('../db/pool');

    const query = `
      SELECT 
        com.id,
        com.code_postal as code,
        com.name,
        '#3b82f6' as color_hex,
        0 as population,
        COUNT(c.id) as total_complaints,
        COUNT(CASE WHEN c.status = 'en_attente' THEN 1 END) as new_complaints,
        COUNT(CASE WHEN c.status = 'en_cours' THEN 1 END) as in_progress_complaints,
        COUNT(CASE WHEN c.status = 'resolue' THEN 1 END) as resolved_complaints,
        COUNT(CASE WHEN c.status IN ('en_attente', 'en_cours') THEN 1 END) as open_complaints
      FROM communes com
      LEFT JOIN complaints c ON com.id = c.commune_id
      GROUP BY com.id, com.code_postal, com.name
      HAVING COUNT(c.id) > 0
      ORDER BY total_complaints DESC
    `;

    const result = await pool.query(query);

    res.json({
      success: true,
      data: result.rows.map(row => ({
        ...row,
        total_complaints: parseInt(row.total_complaints) || 0,
        new_complaints: parseInt(row.new_complaints) || 0,
        in_progress_complaints: parseInt(row.in_progress_complaints) || 0,
        resolved_complaints: parseInt(row.resolved_complaints) || 0,
        open_complaints: parseInt(row.open_complaints) || 0
      }))
    });

  } catch (error) {
    console.error('❌ Erreur getRegionsStats:', error);
    res.status(500).json({ 
      success: false,
      error: 'Erreur serveur',
      message: error.message
    });
  }
};
