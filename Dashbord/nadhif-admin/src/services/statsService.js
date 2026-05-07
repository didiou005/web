// src/services/statsService.js
class StatsService {
  async getRegions() {
    try {
      const pool = await require('../db/pool');
      const result = await pool.query(`
        SELECT 
          id, 
          code, 
          name, 
          population
        FROM communes
        ORDER BY name ASC
      `);
      return result.rows;
    } catch (error) {
      console.error('Erreur getRegions:', error);
      return [];
    }
  }

  async getTeams() {
    try {
      const pool = await require('../db/pool');
      const result = await pool.query(`
        SELECT 
          t.id, 
          t.name, 
          t.vehicle_info,
          t.working_hours,
          COUNT(DISTINCT tm.id) as member_count
        FROM teams t
        LEFT JOIN teams_members tm ON t.team_id = tm.team_id
        GROUP BY t.id, t.name, t.vehicle_info, t.working_hours
        ORDER BY t.name ASC
      `);
      return result.rows;
    } catch (error) {
      console.error('Erreur getTeams:', error);
      return [];
    }
  }
}

module.exports = new StatsService();
