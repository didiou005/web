// src/utils/validators.js
const Joi = require('joi');

exports.validateStatsRequest = (data) => {
  const schema = Joi.object({
    metric: Joi.string()
      .valid('count', 'avg_resolution_time', 'backlog')
      .required(),
    
    dimension: Joi.string()
      .valid('date', 'region', 'status', 'team', 'complaint_type')
      .required(),
    
    filters: Joi.object({
      date_from: Joi.date().iso(),
      date_to: Joi.date().iso().min(Joi.ref('date_from')),
      region_ids: Joi.array().items(Joi.number().integer()),
      statuses: Joi.array().items(
        Joi.string().valid('new', 'assigned', 'in_progress', 'resolved', 'closed')
      ),
      complaint_type: Joi.string(),
      team_ids: Joi.array().items(Joi.number().integer())
    }).optional()
  });

  return schema.validate(data);
};
