const { z } = require('zod');

const createServiceSchema = z.object({
  serviceName: z.string().min(2, 'Service name is required').max(100),
  description: z.string().optional().nullable().default(''),
  isActive: z.boolean().optional().default(true)
});

module.exports = {
  createServiceSchema
};
