const express = require("express");
const { Pool } = require("pg");
const multer = require("multer");
const path = require("path");
const cors = require("cors");
const fs = require("fs");

require("dotenv").config();

const app = express();


process.on("uncaughtException", (err) => {
  console.error("UNCAUGHT EXCEPTION:");
  console.error(err);
});

process.on("unhandledRejection", (err) => {
  console.error("UNHANDLED REJECTION:");
  console.error(err);
});

/* =========================================================
   DATABASE
========================================================= */

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false,
  },
});

/* =========================================================
   CREATE UPLOADS FOLDER IF NOT EXISTS
========================================================= */

const uploadsDir = path.join(__dirname, "uploads");

if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir);
}

/* =========================================================
   MIDDLEWARE
========================================================= */

app.use(
  cors({
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true,
  })
);

app.use(express.json({ limit: "100mb" }));

app.use(
  express.urlencoded({
    limit: "100mb",
    extended: true,
  })
);

app.use("/uploads", express.static(uploadsDir));

/* =========================================================
   HEALTHCHECK
========================================================= */

app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "Backend Railway opérationnel 🚀",
  });
});

/* =========================================================
   MULTER CONFIG
========================================================= */

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadsDir);
  },

  filename: function (req, file, cb) {
    cb(
      null,
      "plainte-" +
        Date.now() +
        path.extname(file.originalname)
    );
  },
});

const upload = multer({
  storage,

  limits: {
    fileSize: 100 * 1024 * 1024,
  },

  fileFilter: (req, file, cb) => {
    console.log(
      `📡 Réception fichier : ${file.originalname}`
    );

    if (file.mimetype.startsWith("image/")) {
      cb(null, true);
    } else {
      cb(new Error("Seules les images sont autorisées"));
    }
  },
});

/* =========================================================
   GET COMMUNES
========================================================= */

app.get("/api/communes", async (req, res) => {
  const client = await pool.connect();

  try {
    const result = await client.query(`
      SELECT id, name
      FROM communes
      ORDER BY name ASC
    `);

    res.json(result.rows);

  } catch (error) {

  console.error("❌ FULL ERROR:");
  console.error(error);

  console.error("MESSAGE:");
  console.error(error.message);

  console.error("STACK:");
  console.error(error.stack);

  if (error.detail) {
    console.error("DETAIL:");
    console.error(error.detail);
  }

  if (error.constraint) {
    console.error("CONSTRAINT:");
    console.error(error.constraint);
  }

  if (error.code) {
    console.error("PG CODE:");
    console.error(error.code);
  }

  res.status(500).json({
    success: false,
    message: "Erreur serveur",
  });

  } finally {
    client.release();
  }
});

/* =========================================================
   CREATE COMPLAINT
========================================================= */

app.post(
  "/api/complaints",
  //upload.array("photos", 5),
  (req, res, next) => next(),
  async (req, res) => {
    console.log("📥 POST /api/complaints reached");

    const client = await pool.connect();

    console.log("✅ Database client connected");

    try {
      await client.query("BEGIN");

      const {
        adresse,
        waste_type,
        complaint_type,
        comment,
        lat,
        lng,
      } = req.body;

      console.log("📦 Données reçues :", req.body);

      /* VALIDATION */

      if (!waste_type || !lat || !lng) {
        return res.status(400).json({
          success: false,
          message:
            "Champs obligatoires manquants",
        });
      }

      const cleanComplaintType =
        complaint_type || null;

      /* INSERT COMPLAINT */

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
        VALUES (
          $1,
          $2,
          $3,
          $4,
          ST_SetSRID(
            ST_MakePoint($5, $6),
            4326
          ),
          NULL,
          'en_attente'
        )
        RETURNING id, code;
      `;

      const complaintResult =
        await client.query(
          insertComplaintQuery,
          [
            adresse,
            waste_type,
            cleanComplaintType,
            comment,
            parseFloat(lng),
            parseFloat(lat),
          ]
        );

      const complaintId =
        complaintResult.rows[0].id;

      const complaintCode =
        complaintResult.rows[0].code;

      /* INSERT PHOTOS */

      if (
        req.files &&
        req.files.length > 0
      ) {
        const insertPhotoQuery = `
          INSERT INTO complaint_photos (
            complaint_id,
            url
          )
          VALUES ($1, $2)
        `;

        for (const file of req.files) {
          const fileUrl =
            "/uploads/" + file.filename;

          await client.query(
            insertPhotoQuery,
            [complaintId, fileUrl]
          );
        }
      }

      await client.query("COMMIT");

      res.status(201).json({
        success: true,
        message:
          "Plainte enregistrée avec succès",
        data: {
          id: complaintId,
          code: complaintCode,
        },
      });

    } catch (error) {
      await client.query("ROLLBACK");

      console.error(
        "❌ Erreur création plainte:",
        error
      );

      res.status(500).json({
        success: false,
        message:
          "Erreur serveur lors de l'enregistrement",
        error: error.message,
      });

    } finally {
      client.release();
    }
  }
);

/* =========================================================
   GET COMPLAINT BY CODE
========================================================= */

app.get(
  "/api/complaints/:code",

  async (req, res) => {
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
          com.name AS commune_name,
          c.address_text,
          c.comment AS description,
          c.status,
          ST_X(c.gps_location::geometry) AS lng,
          ST_Y(c.gps_location::geometry) AS lat

        FROM complaints c

        LEFT JOIN communes com
        ON c.commune_id = com.id

        WHERE c.code = $1
      `;

      const result =
        await client.query(query, [code]);

      if (result.rows.length === 0) {
        return res.status(404).json({
          success: false,
          error: "Plainte non trouvée",
        });
      }

      const complaint = result.rows[0];

      const photosResult =
        await client.query(
          `
          SELECT url
          FROM complaint_photos
          WHERE complaint_id = $1
        `,
          [complaint.id]
        );

      complaint.photos =
        photosResult.rows;

      res.json({
        success: true,
        data: complaint,
      });

    } catch (error) {
      console.error(
        "❌ Erreur récupération plainte:",
        error
      );

      res.status(500).json({
        success: false,
        error:
          "Erreur serveur récupération plainte",
      });

    } finally {
      client.release();
    }
  }
);

/* =========================================================
   TEST DATABASE CONNECTION
========================================================= */

pool.query("SELECT NOW()")
  .then(() => {
    console.log(
      "✅ PostgreSQL connecté"
    );
  })
  .catch((err) => {
    console.error(
      "❌ Erreur PostgreSQL:",
      err
    );
  });

/* =========================================================
   START SERVER
========================================================= */

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`🚀 Serveur démarré sur le port ${PORT}`);
});