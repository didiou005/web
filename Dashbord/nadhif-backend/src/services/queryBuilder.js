// src/services/queryBuilder.js (CORRIGÉ selon ton schéma)
class QueryBuilder {
  build(metric, dimension, filters = {}) {
    const baseQuery = this.getBaseQuery(metric, dimension);
    const whereClause = this.buildWhereClause(filters);
    const groupByClause = this.buildGroupBy(dimension);
    const orderByClause = this.buildOrderBy(dimension);

    const sql = `
      ${baseQuery}
      ${whereClause.sql}
      ${groupByClause}
      ${orderByClause}
      LIMIT 100
    `;

    console.log('SQL Query:', sql);
    console.log('Params:', whereClause.params);

    return {
      sql: sql.trim().replace(/\s+/g, ' '),
      params: whereClause.params
    };
  }

  getBaseQuery(metric, dimension) {
    const metricColumn = this.getMetricColumn(metric);
    const dimensionColumn = this.getDimensionColumn(dimension);
    const fromClause = this.getFromClause(dimension, metric);

    return `
      SELECT 
        ${dimensionColumn} as label,
        ${metricColumn} as value
      ${fromClause}
    `;
  }

  getMetricColumn(metric) {
    const metrics = {
      'count': 'COUNT(c.id)',
      'avg_resolution_time': `
        ROUND(
          CAST(
            AVG(
              CASE 
                WHEN csh.new_status IN ('resolved', 'closed')
                THEN EXTRACT(EPOCH FROM (csh.changed_at - c.created_at)) / 3600 
              END
            ) AS NUMERIC
          ), 1
        )
      `,
      'backlog': `COUNT(CASE WHEN csh_last.new_status NOT IN ('resolved', 'closed') THEN 1 END)`,
      'sla_compliance': `
        ROUND(
          COUNT(CASE 
            WHEN csh.new_status = 'resolved'
            AND EXTRACT(EPOCH FROM (csh.changed_at - c.created_at)) / 3600 <= 48 
            THEN 1 
          END) * 100.0 / NULLIF(COUNT(CASE WHEN csh.new_status = 'resolved' THEN 1 END), 0),
          1
        )
      `
    };

    return metrics[metric] || metrics['count'];
  }

  getDimensionColumn(dimension) {
    const dimensions = {
      'date': "DATE(c.created_at)",
      'week': "TO_CHAR(c.created_at, 'IYYY-IW')",
      'month': "TO_CHAR(c.created_at, 'YYYY-MM')",
      'region': "COALESCE(r.name, 'Non assigné')",
      'status': "COALESCE(csh_last.new_status, 'new')",
      'team': "COALESCE(t.name, 'Non assignée')",
      'complaint_type': "COALESCE(c.complaint_type, 'Non défini')",
      'waste_type': "COALESCE(c.waste_type, 'Non défini')"
    };

    return dimensions[dimension] || dimensions['date'];
  }

  getFromClause(dimension, metric) {
    let from = 'FROM complaints c';

    // Jointures selon la dimension
    if (dimension === 'region') {
      from += ' LEFT JOIN regions r ON c.region_id = r.id';
    }
    
    if (dimension === 'team') {
      from += ' LEFT JOIN teams t ON c.team_id = t.id';
    }

    // Pour le statut, on doit récupérer le dernier statut
    if (dimension === 'status' || metric === 'avg_resolution_time' || metric === 'backlog') {
      from += `
        LEFT JOIN LATERAL (
          SELECT new_status, changed_at
          FROM complaint_status_history
          WHERE complaint_id = c.id
          ORDER BY changed_at DESC
          LIMIT 1
        ) csh_last ON true
      `;
    }

    // Pour les métriques de résolution
    if (metric === 'avg_resolution_time' || metric === 'sla_compliance') {
      from += `
        LEFT JOIN complaint_status_history csh 
          ON c.id = csh.complaint_id 
          AND csh.new_status IN ('resolved', 'closed')
      `;
    }

    return from;
  }

  buildWhereClause(filters) {
    const conditions = [];
    const params = [];
    let paramIndex = 1;

    if (filters.date_from) {
      conditions.push(`c.created_at >= $${paramIndex++}::timestamp`);
      params.push(filters.date_from);
    }

    if (filters.date_to) {
      conditions.push(`c.created_at <= $${paramIndex++}::timestamp`);
      params.push(filters.date_to + ' 23:59:59');
    }

    if (filters.region_ids && filters.region_ids.length > 0) {
      conditions.push(`c.region_id = ANY($${paramIndex++}::int[])`);
      params.push(filters.region_ids);
    }

    if (filters.team_ids && filters.team_ids.length > 0) {
      conditions.push(`c.team_id = ANY($${paramIndex++}::int[])`);
      params.push(filters.team_ids);
    }

    return {
      sql: conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '',
      params
    };
  }

  buildGroupBy(dimension) {
    return 'GROUP BY label';
  }

  buildOrderBy(dimension) {
    if (['date', 'week', 'month'].includes(dimension)) {
      return 'ORDER BY label ASC';
    }
    return 'ORDER BY value DESC';
  }
}

module.exports = new QueryBuilder();
