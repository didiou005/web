// src/routes/employees.js
const express = require('express');
const router = express.Router();

const isDev = true; // process.env.NODE_ENV === 'development';
const authMiddleware = isDev ? (req, res, next) => next() : require('../middleware/auth').requireAuth;

const employeesController = require('../controllers/employeesController');

// Liste des employés
router.get('/', authMiddleware, employeesController.getAll);

// Créer un employé
router.post('/', authMiddleware, employeesController.create);

// Modifier un employé
router.put('/:id', authMiddleware, employeesController.update);

// Supprimer un employé
router.delete('/:id', authMiddleware, employeesController.delete);

module.exports = router;
