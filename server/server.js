const express = require('express');
const { Pool } = require('pg');
const multer = require('multer');
const path = require('path');
const cors = require('cors');
require('dotenv').config();

const app = express();
const port = 3000;


// Configuration de la base de données
const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
});

// Middleware
app.use(cors());
app.use(express.json({ limit: '100mb' }));
app.use(express.urlencoded({ limit: '100mb', extended: true }));
app.use(express.static(path.join(__dirname))); // Sert les fichiers statiques (index.html, css, js)
app.use('/uploads', express.static('uploads')); // Sert les images uploadées

// Configuration de l'upload d'images
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/')
    },
    filename: function (req, file, cb) {
        cb(null, 'plainte-' + Date.now() + path.extname(file.originalname))
    }
});

const upload = multer({ 
    storage: storage,
    limits: { fileSize: 100 * 1024 * 1024 }, // Limite 100MB pour tout accepter
    fileFilter: (req, file, cb) => {
        console.log(`📡 Réception d'un fichier : ${file.originalname} (${file.size} octets)`);
        if (file.mimetype.startsWith('image/')) {
            cb(null, true);
        } else {
            cb(new Error('Seules les images sont autorisées'));
        }
    }
});

// Route API pour récupérer les communes
app.get('/api/communes', async (req, res) => {
    const client = await pool.connect();
    try {
        const result = await client.query('SELECT id, name FROM communes ORDER BY name ASC');
        res.json(result.rows);
    } catch (error) {
        console.error('Erreur récupération communes:', error);
        res.status(500).json({ error: 'Erreur serveur récupération communes' });
    } finally {
        client.release();
    }
});

// Route API pour soumettre une plainte
app.post('/api/complaints', upload.array('photos', 5), async (req, res) => {
    const client = await pool.connect();
    
    try {
        await client.query('BEGIN');

        const {
            adresse,
            waste_type,
            complaint_type,
            comment,
            lat,
            lng
        } = req.body;

        // Validation
        if (!waste_type || !lat || !lng) {
            throw new Error('Champs obligatoires manquants (Type, GPS)');
        }

        // Conversion des valeurs vides en NULL pour PostgreSQL
        const cleanComplaintType = complaint_type || null;
        
        // 1. Insertion de la plainte
        // IMPORTANT: On passe NULL pour 'commune_id' et 'region_id' 
        // Les TRIGGERS de la base de données (automation.sql) vont automatiquement:
        // - Trouver la région via GPS
        // - Assigner la commune de la région
        // - Générer le code
        
        const insertComplaintQuery = `
            INSERT INTO complaints (
                address_text, 
                waste_type, 
                complaint_type, 
                comment, 
                gps_location,
                commune_id,
                status
            )
            VALUES ($1, $2, $3, $4, ST_SetSRID(ST_MakePoint($5, $6), 4326), NULL, 'en_attente')
            RETURNING id, code;
        `;

        const complaintResult = await client.query(insertComplaintQuery, [
            adresse,
            waste_type,
            cleanComplaintType,
            comment,
            parseFloat(lng), 
            parseFloat(lat)
        ]);

        const complaintId = complaintResult.rows[0].id;
        const complaintCode = complaintResult.rows[0].code;

        // 2. Insertion des photos (s'il y en a)
        if (req.files && req.files.length > 0) {
            const insertPhotoQuery = `
                INSERT INTO complaint_photos (complaint_id, url)
                VALUES ($1, $2)
            `;

            for (const file of req.files) {
                // Dans un vrai projet, uploadez sur S3/Cloudinary et stockez l'URL réelle
                // Ici on stocke le chemin local
                const fileUrl = '/uploads/' + file.filename;
                await client.query(insertPhotoQuery, [complaintId, fileUrl]);
            }
        }

        await client.query('COMMIT');

        res.status(201).json({
            success: true,
            message: 'Plainte enregistrée avec succès',
            data: {
                id: complaintId,
                code: complaintCode
            }
        });

    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Erreur lors de l\'enregistrement de la plainte:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur serveur lors de l\'enregistrement',
            error: error.message
        });
    } finally {
        client.release();
    }
});

// Route API pour récupérer une plainte par son code
app.get('/api/complaints/:code', async (req, res) => {
    const { code } = req.params;
    const client = await pool.connect();
    try {
        const query = `
            SELECT 
                c.id,
                c.code, 
                c.created_at,
                c.updated_at,
                c.waste_type,
                c.complaint_type,
                com.name as commune_name,
                c.address_text,
                c.comment as description,
                c.status,
                ST_X(c.gps_location::geometry) as lng,
                ST_Y(c.gps_location::geometry) as lat
            FROM complaints c
            LEFT JOIN communes com ON c.commune_id = com.id
            WHERE c.code = $1
        `;
        const result = await client.query(query, [code]);
        
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Plainte non trouvée' });
        }
        
        const complaint = result.rows[0];
        
        // Récupérer les photos
        const photosResult = await client.query(
            'SELECT url FROM complaint_photos WHERE complaint_id = $1',
            [complaint.id]
        );
        complaint.photos = photosResult.rows;
        
        res.json(complaint);
    } catch (error) {
        console.error('Erreur récupération plainte:', error);
        res.status(500).json({ error: 'Erreur serveur lors de la récupération de la plainte' });
    } finally {
        client.release();
    }
});

// Test de connexion DB au démarrage
pool.query('SELECT NOW()', (err, res) => {
    if (err) {
        console.error('Erreur de connexion à la base de données:', err);
    } else {
        console.log('Connecté à PostgreSQL avec succès');
    }
});



app.listen(port, "0.0.0.0", () => {
  console.log(`Serveur démarré sur http://localhost:${port}`);
});
