const { z } = require('zod');

const registerSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

const assignmentSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters"),
  dueDate: z.string().refine((val) => !isNaN(Date.parse(val)), {
    message: "Invalid date format",
  }),
  workingDays: z.union([z.number(), z.string()]).transform((val) => parseInt(val)).pipe(z.number().min(1).max(7)),
});

const taskUpdateSchema = z.object({
  completed: z.boolean().optional(),
  title: z.string().min(1).optional(),
  duration: z.string().optional(),
  category: z.string().optional(),
  date: z.string().refine((val) => !isNaN(Date.parse(val))).optional(),
});

module.exports = {
  registerSchema,
  loginSchema,
  assignmentSchema,
  taskUpdateSchema,
};
