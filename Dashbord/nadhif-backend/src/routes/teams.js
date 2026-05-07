// src/routes/teams.js
const express = require('express');
const router = express.Router();

const isDev = true; // process.env.NODE_ENV === 'development';
const authMiddleware = isDev ? (req, res, next) => next() : require('../middleware/auth').requireAuth;

const teamsController = require('../controllers/teamsController');

// Liste des équipes
router.get('/', authMiddleware, teamsController.getTeams);

// Équipe par ID
router.get('/:id', authMiddleware, teamsController.getTeamById);

// Performance d'une équipe
router.get('/:team_id/performance', authMiddleware, teamsController.getTeamPerformance);

// Créer une équipe
router.post('/', authMiddleware, teamsController.createTeam);

// Modifier une équipe
router.put('/:id', authMiddleware, teamsController.updateTeam);

// Supprimer une équipe
router.delete('/:id', authMiddleware, teamsController.deleteTeam);

module.exports = router;
