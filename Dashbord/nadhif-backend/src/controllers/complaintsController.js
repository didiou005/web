const poolPromise = require('../db/pool');
const ExcelJS = require('exceljs');
const logsController = require('./logsController');

/**
 * Helper to parse EWKB/WKB Hex String to Lat/Lng
 */
const parseGpsLocation = (hexString) => {
    if (!hexString || typeof hexString !== 'string') return null;
    try {
        const buffer = Buffer.from(hexString, 'hex');
        // Byte 0: Endianness
        const isLittle = buffer[0] === 1;
        // Byte 1-4: Type
        const type = isLittle ? buffer.readUInt32LE(1) : buffer.readUInt32BE(1);
        
        let offset = 5;
        // Check for SRID flag (EWKB: 0x20000000)
        if ((type & 0x20000000) !== 0) { 
            offset = 9; // Skip SRID (4 bytes)
        }

        // Point coordinates: X (Lng), Y (Lat)
        const lng = isLittle ? buffer.readDoubleLE(offset) : buffer.readDoubleBE(offset);
        const lat = isLittle ? buffer.readDoubleLE(offset + 8) : buffer.readDoubleBE(offset + 8);
        
        return { lat, lng };
    } catch (e) {
        console.error('Error parsing GPS hex:', e.message);
        return null; // Return null if parsing fails
    }
};

/**
 * POST /api/complaints
 */
/**
 * POST /api/complaints
 */
exports.createComplaint = async (req, res) => {
  const pool = await poolPromise;
  const client = await pool.connect();
  
  try {
    // 1. Extract Data from Body
    // Frontend sends: commune, adresse, waste_type, complaint_type, comment, lat, lng
    const { 
      code, 
      waste_type, 
      complaint_type, 
      comment, 
      lat, 
      lng,
      adresse, 
      commune,
      // Fallbacks if sent via other API clients
      gps_location,
      address_text,
      commune_id: providedCommuneId,
      region_id
    } = req.body;

    // Consolidate values
    let finalLat = lat;
    let finalLng = lng;
    let finalCommuneId = commune || providedCommuneId;
    let finalAddress = adresse || address_text;
    
    // Handle GPS Object if passed
    if (!finalLat && gps_location && typeof gps_location === 'object') {
        finalLat = gps_location.lat;
        finalLng = gps_location.lng;
    }

    // 2. Validate GPS
    let geom = null;
    if (finalLat && finalLng) {
        geom = `SRID=4326;POINT(${finalLng} ${finalLat})`;
    } else {
        return res.status(400).json({ error: 'Localisation GPS requise' });
    }

    // 3. Determine Region (Spatial Query) if not provided
    // We prioritize using the GPS point to find the containing Region
    let finalRegionId = region_id;
    if (!finalRegionId && geom) {
        try {
            const regionQuery = `
                SELECT id, commune_id FROM regions 
                WHERE ST_Contains(geom, ST_GeomFromEWKT($1))
                LIMIT 1
            `;
            const regionRes = await pool.query(regionQuery, [geom]);
            if (regionRes.rows.length > 0) {
                finalRegionId = regionRes.rows[0].id;
                // If commune not provided, maybe use region's default commune?
                // But frontend should send commune.
            }
        } catch (e) {
            console.error("Spatial query error:", e);
        }
    }

    // 4. Validate/Fallback Commune
    if (!finalCommuneId) {
        // If we found a region and it has a commune_id
        if (finalRegionId) {
             const regionRes = await pool.query('SELECT commune_id FROM regions WHERE id = $1', [finalRegionId]);
             if (regionRes.rows.length > 0) finalCommuneId = regionRes.rows[0].commune_id;
        }
        
        // Final fallback: Default to first commune or strict error
        if (!finalCommuneId) {
            return res.status(400).json({ error: 'Commune non spécifiée.' });
        }
    }

    // 5. Generate Code
    const finalCode = code || `TSK-${Date.now().toString().slice(-6)}`;

    // 6. DB Transaction
    await client.query('BEGIN');

    // Insert Complaint
    const insertQuery = `
      INSERT INTO complaints (
        code, 
        commune_id, 
        address_text, 
        waste_type, 
        complaint_type, 
        comment, 
        region_id, 
        gps_location, 
        is_region_covered,
        status
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, ST_GeomFromEWKT($8), 
        CASE WHEN $7 IS NOT NULL THEN TRUE ELSE FALSE END,
        'en_attente'
      )
      RETURNING id, code
    `;

    const values = [
        finalCode,
        finalCommuneId,
        finalAddress,
        waste_type,
        complaint_type || null, // Handle empty string from form if menager not selected?
        comment,
        finalRegionId,
        geom
    ];

    const result = await client.query(insertQuery, values);
    const complaintId = result.rows[0].id;

    // 7. Handle Photos (req.files)
    if (req.files && req.files.length > 0) {
        const photoQuery = `INSERT INTO complaint_photos (complaint_id, url) VALUES ($1, $2)`;
        for (const file of req.files) {
            // In a real app, upload to S3/Cloudinary here and get URL.
            // For now, we store the local path relative to server root or public URL.
            // Assuming 'uploads' is served statically.
            const photoUrl = `/uploads/${file.filename}`;
            await client.query(photoQuery, [complaintId, photoUrl]);
        }
    }

    await client.query('COMMIT');
    
    res.status(201).json({
        success: true,
        data: result.rows[0]
    });

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Create Complaint Error:', error);
    res.status(500).json({ success: false, message: error.message || 'Erreur serveur interne' });
  } finally {
    client.release();
  }
};

/**
 * GET /api/complaints/coords
 * Used for the Map View
 */
exports.getComplaintsCoords = async (req, res) => {
  try {
    const pool = await poolPromise;
    const { status, regionId } = req.query;

    let query = `
      SELECT 
        c.id,
        c.code,
        c.gps_location,
        COALESCE(c.complaint_type, c.waste_type) as type,
        c.comment as description,
        c.status,
        c.created_at,
        r.name as region_name,
        t.name as team_name
      FROM complaints c
      LEFT JOIN regions r ON c.region_id = r.id
      LEFT JOIN teams t ON c.team_id = t.id
      WHERE c.gps_location IS NOT NULL
      AND (c.status IS NULL OR c.status != 'resolue')
    `;

    const params = [];
    let paramIndex = 1;

    if (regionId && regionId !== 'all') {
      query += ` AND c.region_id = $${paramIndex++}`;
      params.push(regionId);
    }

    if (status && status !== 'all') {
        // Even if status is passed, we already filtered out 'resolue' in the base query
        // But if someone explicitly asks for it via filter (if available), it won't show unless we change logic.
        // Given the requirement "must not be displayed", we keep the exclusion in the base query.
        if (status === 'en_cours') {
            query += ` AND c.status = 'en_cours'`;
        } else if (status === 'en_attente' || status === 'pending') {
            query += ` AND (c.status = 'en_attente' OR c.status IS NULL)`;
        }
    }

    query += ` ORDER BY c.created_at DESC LIMIT 2000`;

    const result = await pool.query(query, params);

    const formattedData = result.rows.map(row => {
      const coords = parseGpsLocation(row.gps_location);
      if (!coords) return null;

      return {
        id: row.id,
        code: row.code,
        lat: coords.lat,
        lng: coords.lng,
        type: row.type || 'Signalement',
        status: row.status || 'en_attente',
        description: row.description || '',
        created_at: row.created_at,
        region_name: row.region_name,
        team_name: row.team_name || 'Non assignée'
      };
    }).filter(item => item !== null);

    res.json({
      success: true,
      data: formattedData
    });

  } catch (error) {
    console.error('Error fetching complaint coords:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
};

/**
 * GET /api/complaints/heatmap
 */
exports.getHeatmapData = async (req, res) => {
  try {
    const pool = await poolPromise;
    // Exclude resolved complaints from heatmap too
    const query = `
        SELECT gps_location 
        FROM complaints 
        WHERE gps_location IS NOT NULL 
        AND (status IS NULL OR status != 'resolue')
        LIMIT 3000
    `;
    const result = await pool.query(query);

    const data = result.rows.map(row => {
        return parseGpsLocation(row.gps_location);
    }).filter(p => p !== null);

    res.json({ success: true, data });
  } catch (error) {
    console.error('Heatmap error:', error);
    res.status(500).json({ success: false, message: 'Erreur heatmap' });
  }
};

/**
 * GET /api/complaints
 * List view with filters and pagination
 */
exports.getComplaints = async (req, res) => {
  try {
    const pool = await poolPromise;
    const { 
      page = 1, 
      limit = 10, 
      status, 
      regionId, 
      search,
      wasteType,
      sortBy = 'created_at',
      order = 'desc'
    } = req.query;

    console.log('[getComplaints] Request Query:', req.query);

    const limitInt = parseInt(limit, 10);
    const pageInt = parseInt(page, 10);
    const offset = (pageInt - 1) * limitInt;

    const params = [];
    let paramIndex = 1;

    let whereClause = `WHERE 1=1`;

    if (status && status !== 'all') {
       whereClause += ` AND c.status = $${paramIndex++}`;
       params.push(status);
    }

    if (regionId && regionId !== 'all') {
      whereClause += ` AND c.region_id = $${paramIndex++}`;
      params.push(regionId);
    }
    
    if (wasteType && wasteType !== 'all') {
      whereClause += ` AND c.waste_type = $${paramIndex++}`;
      params.push(wasteType);
    }

    if (search) {
      whereClause += ` AND (c.code ILIKE $${paramIndex} OR c.comment ILIKE $${paramIndex})`;
      params.push(`%${search}%`);
      paramIndex++;
    }

    // Sorting Logic
    const sortFieldMap = {
        'date': 'c.created_at',
        'created_at': 'c.created_at',
        'status': 'c.status',
        'type': 'display_type',
        'commune': 'cm.name',
        'region': 'r.name'
    };
    const sortColumn = sortFieldMap[sortBy] || 'c.created_at';
    const sortOrder = order.toLowerCase() === 'asc' ? 'ASC' : 'DESC';

    // Count Total
    const countQuery = `
        FROM complaints c
        LEFT JOIN regions r ON c.region_id = r.id
        LEFT JOIN communes cm ON c.commune_id = cm.id
        ${whereClause}
    `;
    
    const countResult = await pool.query(`SELECT COUNT(*) ${countQuery}`, params);
    const total = parseInt(countResult.rows[0].count);

    // Fetch Data
    const dataQuery = `
      SELECT 
        c.id,
        c.code,
        c.waste_type,
        c.complaint_type,
        c.comment as description,
        c.status,
        c.created_at,
        c.address_text,
        r.name as region_name,
        cm.name as commune_name,
        COALESCE(c.complaint_type, c.waste_type) as display_type
      ${countQuery}
      ORDER BY ${sortColumn} ${sortOrder}
      LIMIT $${paramIndex++} OFFSET $${paramIndex++}
    `;

    params.push(limitInt, offset);

    const dataResult = await pool.query(dataQuery, params);
    // Fetch Counts by Status for Summary
    const countsQuery = `
        SELECT status, COUNT(*) 
        FROM complaints c
        ${whereClause}
        GROUP BY status
    `;
    const countsResult = await pool.query(countsQuery, params.slice(0, paramIndex - 3)); // Use filters but not pagination params
    
    const counts = {
        total,
        en_attente: 0,
        en_cours: 0,
        resolue: 0
    };
    countsResult.rows.forEach(row => {
        counts[row.status] = parseInt(row.count);
    });

    console.log(`[getComplaints] Found ${total} total, returning ${dataResult.rows.length} rows`);

    res.json({
      success: true,
      data: dataResult.rows,
      pagination: {
        total,
        page: pageInt,
        limit: limitInt,
        pages: Math.ceil(total / limitInt)
      },
      counts
    });

  } catch (error) {
    console.error('Error fetching complaints list:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur: ' + error.message });
  }
};

/**
 * GET /api/complaints/:id
 * Detailed view
 */
exports.getComplaintDetails = async (req, res) => {
  try {
    const pool = await poolPromise;
    const { id } = req.params;
    
    // Main Details
    const isCode = id.startsWith('TSK-');
    const query = `
      SELECT 
        c.*,
        r.name as region_name,
        cm.name as commune_name
      FROM complaints c
      LEFT JOIN regions r ON c.region_id = r.id
      LEFT JOIN communes cm ON c.commune_id = cm.id
      WHERE ${isCode ? 'c.code' : 'c.id'} = $1
    `;
    
    const result = await pool.query(query, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Plainte non trouvée' });
    }

    const complaint = result.rows[0];
    const internalId = complaint.id; // Correct UUID for other queries

    // Photos
    let photos = [];
    try {
        const photosRes = await pool.query(`SELECT * FROM complaint_photos WHERE complaint_id = $1`, [internalId]);
        photos = photosRes.rows;
    } catch (e) { /* Ignore */ }

    // History
    let history = [];
    try {
        const historyRes = await pool.query(`
            SELECT h.*, u.full_name as changed_by
            FROM complaint_status_history h
            LEFT JOIN admin_users u ON h.changed_by_id = u.id
            WHERE h.complaint_id = $1
            ORDER BY h.changed_at DESC
        `, [internalId]);
        history = historyRes.rows;
    } catch (e) { /* Ignore */ }
    
    // Parse GPS
    const gps = parseGpsLocation(complaint.gps_location);

    res.json({
      success: true,
      data: {
        ...complaint,
        photos,
        history,
        gps_parsed: gps
      }
    });

  } catch (error) {
    console.error('Error fetching complaint details:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
};

/**
 * PATCH /api/complaints/:id/status
 * Update Status
 */
exports.updateComplaintStatus = async (req, res) => {
  const pool = await poolPromise;
  const client = await pool.connect();
  try {
    const { id } = req.params;
    const { status, note, userId } = req.body; 

    // Validate status against schema
    if (!['en_attente', 'en_cours', 'resolue'].includes(status)) {
        return res.status(400).json({ success: false, message: 'Statut invalide' });
    }
    
    await client.query('BEGIN');

    // Get current
    const currentRes = await client.query('SELECT status, code FROM complaints WHERE id = $1', [id]);
    if (currentRes.rows.length === 0) {
        throw new Error('Complaint not found');
    }
    const { status: oldStatus, code } = currentRes.rows[0];

    // Update
    await client.query('UPDATE complaints SET status = $1, updated_at = NOW() WHERE id = $2', [status, id]);

    // History
    await client.query(`
        INSERT INTO complaint_status_history (complaint_id, old_status, new_status, changed_by_id, note)
        VALUES ($1, $2, $3, $4, $5)
    `, [id, oldStatus, status, userId || null, note]);

    await client.query('COMMIT');

    // Log status update
    await logsController.logAction(
        userId || (req.user ? req.user.id : null), 
        'UPDATE', 
        'COMPLAINT', 
        id, 
        `Statut du signalement ${code} modifié de ${oldStatus} vers ${status}. Note: ${note || 'Aucune'}`, 
        { oldStatus, newStatus: status, note, code }, 
        req
    );

    res.json({ success: true, message: 'Statut mis à jour' });

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error updating status:', error);
    res.status(500).json({ success: false, message: error.message || 'Erreur serveur' });
  } finally {
    client.release();
  }
};

/**
 * GET /api/complaints/export/excel
 * Export complaints to Excel
 */
exports.exportComplaintsExcel = async (req, res) => {
  try {
    const pool = await poolPromise;
    const { status, regionId, wasteType, search } = req.query;

    const params = [];
    let paramIndex = 1;
    let whereClause = `WHERE 1=1`;

    if (status && status !== 'all') {
       whereClause += ` AND c.status = $${paramIndex++}`;
       params.push(status);
    }

    if (regionId && regionId !== 'all') {
      whereClause += ` AND c.region_id = $${paramIndex++}`;
      params.push(regionId);
    }
    
    if (wasteType && wasteType !== 'all') {
      whereClause += ` AND c.waste_type = $${paramIndex++}`;
      params.push(wasteType);
    }

    if (search) {
      whereClause += ` AND (c.code ILIKE $${paramIndex} OR c.comment ILIKE $${paramIndex})`;
      params.push(`%${search}%`);
      paramIndex++;
    }

    if (req.query.dateFrom) {
        whereClause += ` AND c.created_at >= $${paramIndex++}`;
        params.push(req.query.dateFrom);
    }

    if (req.query.dateTo) {
        // Add 1 day to include the end date fully (if just date string provided)
        whereClause += ` AND c.created_at <= $${paramIndex++}`;
        const dateTo = new Date(req.query.dateTo);
        dateTo.setHours(23, 59, 59, 999);
        params.push(dateTo.toISOString());
    }

    const query = `
      SELECT 
        c.code,
        c.created_at,
        c.status,
        c.waste_type,
        c.complaint_type,
        c.address_text,
        c.comment,
        c.gps_location,
        r.name as region_name,
        cm.name as commune_name
      FROM complaints c
      LEFT JOIN regions r ON c.region_id = r.id
      LEFT JOIN communes cm ON c.commune_id = cm.id
      ${whereClause}
      ORDER BY c.created_at DESC
    `;

    const result = await pool.query(query, params);
    const complaints = result.rows;

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Signalements');

    // Add Title and Map Link at the top
    worksheet.addRow(['Rapport des Signalements - Wilaya de Bouira']);
    worksheet.addRow(['Voir sur la carte interactive : https://www.google.com/maps/search/Bouira+Waste+Reports']);
    worksheet.addRow([]); // Empty row
    
    worksheet.mergeCells('A1:J1');
    worksheet.getCell('A1').font = { size: 16, bold: true };
    worksheet.getCell('A1').alignment = { horizontal: 'center' };
    
    worksheet.mergeCells('A2:J2');
    worksheet.getCell('A2').font = { color: { argb: 'FF4F46E5' }, underline: true };
    worksheet.getCell('A2').alignment = { horizontal: 'center' };

    worksheet.columns = [
      { header: 'Code', key: 'code', width: 15 },
      { header: 'Date', key: 'date', width: 20 },
      { header: 'Statut', key: 'status', width: 15 },
      { header: 'Type', key: 'type', width: 20 },
      { header: 'Commune', key: 'commune', width: 15 },
      { header: 'Région', key: 'region', width: 15 },
      { header: 'Coordonnées', key: 'coords', width: 20 },
      { header: 'Adresse', key: 'address', width: 30 },
      { header: 'Description', key: 'comment', width: 40 },
      { header: 'Lien Carte', key: 'map_link', width: 50 },
    ];

    complaints.forEach(row => {
      const gps = parseGpsLocation(row.gps_location);
      const mapLink = gps ? `https://www.google.com/maps?q=${gps.lat},${gps.lng}` : '';
      const displayType = row.complaint_type || row.waste_type;

      worksheet.addRow({
        code: row.code,
        date: new Date(row.created_at).toLocaleString('fr-DZ'),
        status: row.status,
        type: displayType,
        commune: row.commune_name || '-',
        region: row.region_name || '-',
        coords: gps ? `${gps.lat}, ${gps.lng}` : '-',
        address: row.address_text || '',
        comment: row.comment || '',
        map_link: mapLink
      });
    });

    // Style header
    worksheet.getRow(1).font = { bold: true };
    worksheet.getRow(1).fill = {
        type: 'pattern',
        pattern:'solid',
        fgColor:{argb:'FFE0E0E0'}
    };

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=signalements.xlsx');

    await workbook.xlsx.write(res);
    
    // Log export if user is authenticated (usually this endpoint is protected)
    if (req.user) {
        await logsController.logAction(req.user.id, 'EXPORT', 'COMPLAINT', null, `Export Excel des signalements`, req.query, req);
    }
    
    res.end();

  } catch (error) {
    console.error('Export Excel Error:', error);
    res.status(500).json({ success: false, message: 'Erreur lors de l\'exportation' });
  }
};
