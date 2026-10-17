const { z } = require('zod');

const sendPingSchema = z.object({
  clientId: z.union([z.number(), z.string()]).optional().nullable(),
  stageId: z.union([z.number(), z.string()]).optional().nullable(),
  targetVaName: z.string().min(1, 'Target VA name is required'),
  message: z.string().min(2, 'Notification message is required').max(1000),
  isUrgent: z.boolean().optional().default(false)
});

module.exports = {
  sendPingSchema
};
