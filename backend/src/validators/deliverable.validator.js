const { z } = require('zod');

const submitDeliverableSchema = z.object({
  report: z.string().min(2, 'Completion report text is required'),
  link: z.string().url('External link must be a valid URL starting with http:// or https://').optional().or(z.literal('')),
  fileName: z.string().optional().nullable(),
  filePath: z.string().optional().nullable(),
  fileType: z.string().optional().nullable(),
  fileSize: z.union([z.number(), z.string()]).optional().nullable()
});

const reviewDeliverableSchema = z.object({
  decision: z.enum(['approved', 'revision_requested']),
  feedback: z.string().optional().nullable()
}).refine(data => {
  if (data.decision === 'revision_requested' && (!data.feedback || !data.feedback.trim())) {
    return false;
  }
  return true;
}, {
  message: 'Feedback instructions are required when requesting a revision.',
  path: ['feedback']
});

module.exports = {
  submitDeliverableSchema,
  reviewDeliverableSchema
};
