const { z } = require('zod');

const stageInputSchema = z.object({
  id: z.union([z.number(), z.string()]).optional(),
  vaName: z.string().min(1, 'Virtual Assistant name is required').max(100),
  role: z.string().min(1, 'Stage role or deliverable description is required').max(150),
  deadline: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Stage deadline must be formatted YYYY-MM-DD').optional().nullable(),
  status: z.enum(['queued', 'active', 'in_review', 'revision', 'completed']).default('queued')
});

const createClientSchema = z.object({
  name: z.string().min(2, 'Client name must be at least 2 characters').max(150),
  contact: z.string().max(100).optional().nullable().default(''),
  serviceType: z.string().min(1, 'Service type is required'),
  deadline: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Deadline must be a valid date formatted YYYY-MM-DD').optional().nullable(),
  notes: z.string().max(400, 'Notes cannot exceed 400 characters').optional().nullable().default(''),
  stages: z.array(stageInputSchema).min(1, 'At least one pipeline stage is required')
});

const updateClientSchema = z.object({
  name: z.string().min(2, 'Client name must be at least 2 characters').max(150).optional(),
  contact: z.string().max(100).optional().nullable(),
  serviceType: z.string().min(1).optional(),
  deadline: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Deadline must be a valid date formatted YYYY-MM-DD').optional().nullable(),
  notes: z.string().max(400, 'Notes cannot exceed 400 characters').optional().nullable(),
  stages: z.array(stageInputSchema).optional()
});

module.exports = {
  createClientSchema,
  updateClientSchema
};
