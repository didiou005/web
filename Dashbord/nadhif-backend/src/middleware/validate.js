// src/middleware/validate.js
const Joi = require('joi');

/**
 * Middleware générique de validation
 */
exports.validate = (schema) => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.body, {
      abortEarly: false,
      stripUnknown: true
    });

    if (error) {
      const errors = error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message
      }));

      return res.status(400).json({
        error: 'Validation échouée',
        details: errors
      });
    }

    // Remplacer req.body par les données validées et nettoyées
    req.body = value;
    next();
  };
};

/**
 * Validation des paramètres de pagination
 */
exports.validatePagination = (req, res, next) => {
  const schema = Joi.object({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(20)
  });

  const { error, value } = schema.validate(req.query);

  if (error) {
    return res.status(400).json({
      error: 'Paramètres de pagination invalides',
      details: error.details
    });
  }

  req.pagination = value;
  next();
};

/**
 * Validation des filtres de date
 */
exports.validateDateRange = (req, res, next) => {
  const schema = Joi.object({
    date_from: Joi.date().iso(),
    date_to: Joi.date().iso().min(Joi.ref('date_from'))
  }).unknown(true);

  const { error } = schema.validate(req.query);

  if (error) {
    return res.status(400).json({
      error: 'Plage de dates invalide',
      details: error.details
    });
  }

  next();
};

/**
 * Sanitization des entrées
 */
exports.sanitize = (req, res, next) => {
  // Nettoyer les chaînes de caractères dangereuses
  const sanitizeString = (str) => {
    if (typeof str !== 'string') return str;
    
    return str
      .trim()
      .replace(/[<>]/g, '') // Enlever les balises HTML basiques
      .substring(0, 1000); // Limiter la longueur
  };

  const sanitizeObject = (obj) => {
    if (!obj || typeof obj !== 'object') return obj;
    
    const sanitized = {};
    for (const [key, value] of Object.entries(obj)) {
      if (typeof value === 'string') {
        sanitized[key] = sanitizeString(value);
      } else if (Array.isArray(value)) {
        sanitized[key] = value.map(item => 
          typeof item === 'string' ? sanitizeString(item) : item
        );
      } else if (typeof value === 'object') {
        sanitized[key] = sanitizeObject(value);
      } else {
        sanitized[key] = value;
      }
    }
    return sanitized;
  };

  req.body = sanitizeObject(req.body);
  req.query = sanitizeObject(req.query);
  
  next();
};
