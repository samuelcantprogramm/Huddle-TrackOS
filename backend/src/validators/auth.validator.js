const { z } = require('zod');

const loginSchema = z.object({
  email: z.string().email('Invalid email address format'),
  password: z.string().min(1, 'Password is required')
});

const registerSchema = z.object({
  fullName: z.string().min(2, 'Full name must be at least 2 characters').max(100),
  email: z.string().email('Invalid work email address'),
  password: z.string().min(4, 'Password must be at least 4 characters').max(100),
  role: z.enum(['admin', 'va']).default('va')
});

module.exports = {
  loginSchema,
  registerSchema
};
