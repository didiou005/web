const jwt = require('jsonwebtoken');
const poolPromise = require('../db/pool');

/**
 * Middleware pour vérifier le token JWT
 */
exports.requireAuth = async (req, res, next) => {
  const pool = await poolPromise;
  try {
    // Récupérer le token du header Authorization
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        error: 'Non autorisé',
        message: 'Token manquant ou invalide'
      });
    }

    const token = authHeader.substring(7); // Enlever "Bearer "

    // Vérifier et décoder le token (utiliser le même secret/fallback que dans authController)
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'nadhif_secret_key_2026');

    // Vérifier si l'utilisateur existe toujours
    const result = await pool.query(
      'SELECT id, email, role, is_active FROM admin_users WHERE id = $1',
      [decoded.userId]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({
        error: 'Non autorisé',
        message: 'Utilisateur introuvable'
      });
    }

    const user = result.rows[0];

    // Vérifier si le compte est actif
    if (!user.is_active) {
      return res.status(403).json({
        error: 'Accès interdit',
        message: 'Compte désactivé'
      });
    }

    // Ajouter l'utilisateur à la requête
    req.user = {
      id: user.id,
      email: user.email,
      role: user.role
    };

    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        error: 'Non autorisé',
        message: 'Token invalide'
      });
    }

    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        error: 'Non autorisé',
        message: 'Token expiré'
      });
    }

    console.error('Erreur authentification:', error);
    res.status(500).json({
      error: 'Erreur serveur',
      message: 'Erreur lors de la vérification du token'
    });
  }
};

/**
 * Middleware pour vérifier le rôle de l'utilisateur
 */
exports.requireRole = (allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        error: 'Non autorisé',
        message: 'Authentification requise'
      });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        error: 'Accès interdit',
        message: 'Permissions insuffisantes'
      });
    }

    next();
  };
};

/**
 * Middleware optionnel pour logger les accès
 */
exports.logAccess = async (req, res, next) => {
  if (req.user) {
    try {
      await pool.query(
        `INSERT INTO login_audit (admin_id, ip_address, user_agent, success)
         VALUES ($1, $2, $3, $4)`,
        [
          req.user.id,
          req.ip,
          req.get('user-agent'),
          true
        ]
      );
    } catch (error) {
      console.error('Erreur log audit:', error);
      // Ne pas bloquer la requête si le log échoue
    }
  }
  next();
};
