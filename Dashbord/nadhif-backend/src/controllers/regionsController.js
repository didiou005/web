// src/controllers/regionsController.js
const poolPromise = require('../db/pool');
const logsController = require('./logsController');
const BOUIRA_BOUNDARY = require('../utils/bouiraBoundary');

// Prepare the Bouira boundary as a WKT Polygon (lng lat format)
const bouiraWktCoords = BOUIRA_BOUNDARY.map(c => `${c[1]} ${c[0]}`).join(', ');
const bouiraWKT = `POLYGON((${bouiraWktCoords}))`;

exports.getRegions = async (req, res) => {
  const pool = await poolPromise;
  try {
    const query = `
      SELECT 
        id,
        code,
        name,
        commune_id,
        color_hex,
        population,
        ST_AsGeoJSON(geom) as geometry
      FROM regions
      ORDER BY name ASC
    `;

    const result = await pool.query(query);

    res.json({
      success: true,
      data: result.rows.map(row => ({
        id: row.id,
        code: row.code,
        name: row.name,
        commune_id: row.commune_id,
        color_hex: row.color_hex,
        population: row.population,
        geometry: row.geometry ? JSON.parse(row.geometry) : null
      }))
    });
  } catch (error) {
    console.error('Erreur getRegions:', error);
    res.status(500).json({ 
      error: 'Erreur serveur',
      message: error.message 
    });
  }
};

exports.getRegionById = async (req, res) => {
  const pool = await poolPromise;
  try {
    const { id } = req.params;

    const query = `
      SELECT 
        id,
        code,
        name,
        commune_id,
        color_hex,
        population,
        ST_AsGeoJSON(geom) as geometry
      FROM regions
      WHERE id = $1
    `;

    const result = await pool.query(query, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        error: 'Région introuvable'
      });
    }

    const row = result.rows[0];

    res.json({
      success: true,
      data: {
        id: row.id,
        code: row.code,
        name: row.name,
        commune_id: row.commune_id,
        color_hex: row.color_hex,
        population: row.population,
        geometry: row.geometry ? JSON.parse(row.geometry) : null
      }
    });
  } catch (error) {
    console.error('Erreur getRegionById:', error);
    res.status(500).json({ 
      error: 'Erreur serveur',
      message: error.message 
    });
  }
};

exports.getRegionStats = async (req, res) => {
  const pool = await poolPromise;
  try {
    const query = `
      SELECT 
        r.id,
        r.code,
        r.name,
        r.population,
        COUNT(c.id) as total_complaints,
        COUNT(CASE WHEN c.status IN ('en_attente', 'en_cours') OR c.status IS NULL THEN 1 END) as open_complaints,
        COUNT(CASE WHEN c.status = 'resolue' THEN 1 END) as resolved_complaints
      FROM regions r
      LEFT JOIN complaints c ON r.id = c.region_id
      GROUP BY r.id, r.code, r.name, r.population
      ORDER BY total_complaints DESC
    `;

    const result = await pool.query(query);

    res.json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    console.error('Erreur getRegionStats:', error);
    res.status(500).json({ 
      error: 'Erreur serveur',
      message: error.message 
    });
  }
};

exports.getRegionsMapData = async (req, res) => {
  const pool = await poolPromise;
  try {
    const query = `
      SELECT 
        r.id,
        r.name,
        r.color_hex,
        ST_AsGeoJSON(r.geom) as geometry,
        ST_AsGeoJSON(ST_Centroid(r.geom)) as centroid,
        t.name as team_name,
        (SELECT COUNT(*) FROM complaints c WHERE c.region_id = r.id AND (c.status IS NULL OR c.status != 'resolue')) as active_complaints
      FROM regions r
      LEFT JOIN teams t ON t.region_id = r.id
      ORDER BY r.name ASC
    `;

    const result = await pool.query(query);

    res.json({
      success: true,
      data: result.rows.map(row => ({
        id: row.id,
        name: row.name,
        color_hex: row.color_hex,
        team_name: row.team_name || 'En attente d\'équipe',
        active_complaints: parseInt(row.active_complaints, 10),
        geometry: row.geometry ? JSON.parse(row.geometry) : null,
        centroid: row.centroid ? JSON.parse(row.centroid).coordinates : null
      }))
    });
  } catch (error) {
    console.error('Erreur getRegionsMapData:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

exports.createRegion = async (req, res) => {
  const pool = await poolPromise;
  try {
    const { code, name, commune_id, color_hex, population, geometry } = req.body;
    
    // Nettoyage des données
    const cleanCommuneId = (commune_id === '' || commune_id === null || commune_id === undefined) ? null : parseInt(commune_id, 10);
    const cleanPopulation = (population === '' || population === null || population === undefined) ? null : parseInt(population, 10);
    
    if (Number.isNaN(cleanCommuneId)) throw new Error("ID Commune invalide");
    if (Number.isNaN(cleanPopulation) && cleanPopulation !== null) throw new Error("Population invalide");

    let geomString = null;
    
    if (geometry) {
      geomString = typeof geometry === 'object' ? JSON.stringify(geometry) : geometry;
      
      try {
        const geomResult = await pool.query(
          'SELECT ST_IsValid(ST_SetSRID(ST_GeomFromGeoJSON($1), 4326)) as valid',
          [geomString]
        );
        
        if (!geomResult.rows || geomResult.rows.length === 0 || !geomResult.rows[0].valid) {
          return res.status(400).json({ error: 'Géométrie invalide ou corrompue' });
        }
      } catch (geoError) {
        console.error('Erreur validation géométrie:', geoError);
        return res.status(400).json({ error: 'Erreur lors du traitement de la géométrie' });
      }
    }

    const result = await pool.query(
      `INSERT INTO regions (code, name, commune_id, color_hex, population, geom) 
      VALUES ($1, $2, $3, $4, $5, ${geomString ? `
        ST_GeometryN(
          ST_CollectionExtract(
            COALESCE(
              ST_Difference(
                ST_Intersection(ST_SetSRID(ST_GeomFromGeoJSON($6), 4326), ST_SetSRID(ST_GeomFromText($7), 4326)),
                (SELECT ST_Union(geom) FROM regions)
              ),
              ST_Intersection(ST_SetSRID(ST_GeomFromGeoJSON($6), 4326), ST_SetSRID(ST_GeomFromText($7), 4326))
            ),
            3
          ),
          1
        )
      ` : 'NULL'})
      RETURNING id, code, name, commune_id, color_hex, population, ST_AsGeoJSON(geom) as geometry`,
      [code, name, cleanCommuneId, color_hex, cleanPopulation, ...(geomString ? [geomString, bouiraWKT] : [])]
    );
    
    await logsController.logAction(req.user ? req.user.id : null, 'CREATE', 'REGION', result.rows[0].id, `Création région: ${name}`, req.body, req);

    res.json({
      success: true,
      data: {
        ...result.rows[0],
        geometry: result.rows[0].geometry ? JSON.parse(result.rows[0].geometry) : null
      }
    });
  } catch (error) {
    console.error('Erreur createRegion:', error);
    res.status(500).json({ 
      error: error.message.includes('null value in column "geom"') ? 'La région tracée est complètement en dehors des limites de Bouira.' : 'Erreur serveur',
      message: error.message 
    });
  }
};

exports.editRegion = async (req, res) => {
  const pool = await poolPromise;
  try{
    const { id } = req.params;
    const { code, name, commune_id, color_hex, population, geometry } = req.body;
    const fields = [];
    const values = [];
    let index = 1;

    if (code) { fields.push(`code = $${index++}`); values.push(code); }
    if (name) { fields.push(`name = $${index++}`); values.push(name); }
    
    if (commune_id !== undefined) { 
      fields.push(`commune_id = $${index++}`); 
      values.push(commune_id === '' || commune_id === null ? null : parseInt(commune_id, 10)); 
    }
    
    if (color_hex) { fields.push(`color_hex = $${index++}`); values.push(color_hex); }
    
    if (population !== undefined) { 
      fields.push(`population = $${index++}`); 
      values.push(population === '' || population === null ? null : parseInt(population, 10)); 
    }
    
    if (geometry) {
      const geomString = typeof geometry === 'object' ? JSON.stringify(geometry) : geometry;
      const geomResult = await pool.query(
        'SELECT ST_IsValid(ST_SetSRID(ST_GeomFromGeoJSON($1), 4326)) as valid',
        [geomString]
      );
      if (!geomResult.rows[0].valid) {
        return res.status(400).json({ error: 'Géométrie invalide' });
      }
      fields.push(`geom = ST_GeometryN(
        ST_CollectionExtract(
          COALESCE(
            ST_Difference(
              ST_Intersection(ST_SetSRID(ST_GeomFromGeoJSON($${index}), 4326), ST_SetSRID(ST_GeomFromText($${index + 1}), 4326)),
              (SELECT ST_Union(geom) FROM regions WHERE id != regions.id)
            ),
            ST_Intersection(ST_SetSRID(ST_GeomFromGeoJSON($${index}), 4326), ST_SetSRID(ST_GeomFromText($${index + 1}), 4326))
          ),
          3
        ),
        1
      )`);
      index += 2;
      values.push(geomString, bouiraWKT);
    }
    
    if (fields.length === 0) {
      return res.status(400).json({ error: 'Aucun champ à modifier' });
    }

    values.push(id);
    const query = `
      UPDATE regions
      SET ${fields.join(', ')}, created_at = NOW() -- Mise à jour de la date
      WHERE id = $${index}
      RETURNING id, code, name, commune_id, color_hex, population, ST_AsGeoJSON(geom) as geometry
    `;
    
    const result = await pool.query(query, values);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Région introuvable' });
    }
    await logsController.logAction(req.user.id, 'UPDATE', 'REGION', id, `Mise à jour région: ${result.rows[0].name}`, { updatedFields: Object.keys(req.body) }, req);

    res.json({
      success: true,
      data: {
        ...result.rows[0],
        geometry: result.rows[0].geometry ? JSON.parse(result.rows[0].geometry) : null
      }
    });
  }catch(error){
    console.error('Erreur editRegion:', error);
    res.status(500).json({ 
      error: 'Erreur serveur',
      message: error.message 
    });
  }
};

exports.deleteRegion = async (req, res) => {
  const pool = await poolPromise;
  try {
    const { id } = req.params;
    const usageCheck = await pool.query(
      `SELECT COUNT(*) as count FROM complaints WHERE region_id = $1
      UNION ALL
      SELECT COUNT(*) as count FROM teams WHERE region_id = $1`, [id]);
    const totalUsage = usageCheck.rows.reduce((sum, row) => sum + parseInt(row.count, 10), 0);
    if (totalUsage > 0) {
      return res.status(400).json({ error: 'Impossible de supprimer la région car elle est référencée dans d\'autres enregistrements.' });
    }
    const result = await pool.query(
      'DELETE FROM regions WHERE id = $1 RETURNING id',
      [id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Région introuvable' });
    }
    // Log deletion
    await logsController.logAction(req.user.id, 'DELETE', 'REGION', id, `Suppression région (ID: ${id})`, null, req);

    res.json({ success: true });

  }catch (error) {
    console.error('Erreur deleteRegion:', error);
    res.status(500).json({ 
      error: 'Erreur serveur',
      message: error.message 
    });
  }
};
