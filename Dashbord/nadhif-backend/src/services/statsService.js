// src/services/statsService.js (mise à jour de getRegions et getTeams)
const pool = require('../db/pool');
const queryBuilder = require('./queryBuilder');

class StatsService {
  // ... (garder les autres méthodes)

  /**
   * Récupérer les régions depuis la base
   */
  async getRegions() {
    try {
      const result = await pool.query(`
        SELECT 
          id, 
          code, 
          name, 
          population,
          color_hex
        FROM regions
        ORDER BY name ASC
      `);
      return result.rows;
    } catch (error) {
      console.error('Erreur getRegions:', error);
      throw new Error('Erreur lors de la récupération des régions');
    }
  }

  /**
   * Récupérer les équipes depuis la base
   */
  async getTeams() {
    try {
      const result = await pool.query(`
        SELECT 
          t.id, 
          t.name, 
          t.vehicle_info,
          t.working_hours,
          r.name as region_name,
          COUNT(DISTINCT tm.id) as member_count
        FROM teams t
        LEFT JOIN regions r ON t.region_id = r.id
        LEFT JOIN team_members tm ON t.id = tm.team_id
        GROUP BY t.id, t.name, t.vehicle_info, t.working_hours, r.name
        ORDER BY t.name ASC
      `);
      return result.rows;
    } catch (error) {
      console.error('Erreur getTeams:', error);
      throw new Error('Erreur lors de la récupération des équipes');
    }
  }

  // ... (garder les autres méthodes)
}

module.exports = new StatsService();
