const { z } = require('zod');

const createCalendarEventSchema = z.object({
  title: z.string().min(2, 'Event title is required').max(200),
  description: z.string().optional().nullable().default(''),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Start date must be formatted YYYY-MM-DD'),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'End date must be formatted YYYY-MM-DD').optional().nullable(),
  eventType: z.enum(['deadline', 'milestone', 'meeting', 'review']).default('deadline'),
  clientId: z.union([z.number(), z.string()]).optional().nullable(),
  serviceType: z.string().optional().nullable()
});

module.exports = {
  createCalendarEventSchema
};
