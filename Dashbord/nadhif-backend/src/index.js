// src/index.js
const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();

app.use(cors({
  origin: [
    'https://web-ekfg.vercel.app',
  ],

  methods: [
    'GET',
    'POST',
    'PUT',
    'PATCH',
    'DELETE',
    'OPTIONS'
  ],

  credentials: true,
}));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

const routes = require('./routes');

app.use('/api', routes);

const PORT = process.env.PORT || 5000;

// Démarre après initialisation du pool
(async () => {
  try {
    await require('./db/pool');
    await require('./controllers/logsController').logAction(null, 'INFO', 'SYSTEM', null, 'Démarrage du serveur (Test Log)', null, null);
    app.listen(PORT,'0.0.0.0', () => {
      console.log(`✅ Serveur démarré : http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error('❌ Erreur démarrage:', error);
    process.exit(1);
  }
})();
