// src/routes/auth.js
const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { requireAuth } = require('../middleware/auth');

// Route publique pour la connexion
router.post('/login', authController.login);

// Routes protégées
router.get('/me', requireAuth, authController.getMe);
router.put('/update-profile', requireAuth, authController.updateProfile);
router.put('/change-password', requireAuth, authController.changePassword);

// Gestion des admins (Super Admin uniquement)
router.get('/list', requireAuth, authController.getAllAdmins);
router.post('/register', requireAuth, authController.createAdmin);
router.put('/:id', requireAuth, authController.updateAdmin);
router.delete('/:id', requireAuth, authController.deleteAdmin);

module.exports = router;
