const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const prisma = require('./db');
const { generateTasks } = require('./utils/taskGenerator');
const authRoutes = require('./routes/auth');
const { protect } = require('./middleware/auth');
const { assignmentSchema, taskUpdateSchema } = require('./middleware/validation');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);

// Health check route
app.get('/api/health', async (req, res) => {
  try {
    // Basic DB connectivity check
    await prisma.$queryRaw`SELECT 1`;
    res.json({ 
      status: 'UP', 
      database: 'CONNECTED',
      timestamp: new Date().toISOString() 
    });
  } catch (error) {
    res.status(503).json({ 
      status: 'DOWN', 
      database: 'DISCONNECTED',
      error: error.message 
    });
  }
});

// Get all assignments for the logged-in user
app.get('/api/assignments', protect, async (req, res) => {
  try {
    const assignments = await prisma.assignment.findMany({
      where: { userId: req.user.id },
      include: { 
        tasks: {
          orderBy: { date: 'asc' }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
    res.json(assignments);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch assignments', details: error.message });
  }
});

// Create a new assignment
app.post('/api/assignments', protect, async (req, res) => {
  try {
    const validatedData = assignmentSchema.parse(req.body);
    const { title, dueDate, workingDays } = validatedData;
    
    const assignment = await prisma.assignment.create({
      data: {
        title,
        dueDate: new Date(dueDate),
        workingDays: workingDays || 5,
        userId: req.user.id
      }
    });

    // Trigger task generation logic
    await generateTasks(assignment);
    
    // Fetch assignment again with tasks included
    const assignmentWithTasks = await prisma.assignment.findUnique({
      where: { id: assignment.id },
      include: { tasks: true }
    });
    
    res.status(201).json(assignmentWithTasks);
  } catch (error) {
    if (error.name === 'ZodError') {
      return res.status(400).json({ error: error.errors[0].message });
    }
    res.status(500).json({ error: 'Failed to create assignment', details: error.message });
  }
});

// Get assignment with tasks
app.get('/api/assignments/:id', protect, async (req, res) => {
  const { id } = req.params;
  
  try {
    const assignment = await prisma.assignment.findUnique({
      where: { id: parseInt(id) },
      include: { tasks: { orderBy: { date: 'asc' } } }
    });

    if (!assignment) {
      return res.status(404).json({ error: 'Assignment not found' });
    }

    // Check if user owns the assignment
    if (assignment.userId !== req.user.id) {
      return res.status(401).json({ error: 'Not authorized' });
    }

    res.json(assignment);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch assignment', details: error.message });
  }
});

// Update task details
app.patch('/api/tasks/:id', protect, async (req, res) => {
  const { id } = req.params;

  try {
    const validatedData = taskUpdateSchema.parse(req.body);
    const { completed, title, duration, category, date } = validatedData;

    // Fetch task first to check ownership
    const task = await prisma.task.findUnique({
      where: { id: parseInt(id) },
      include: { assignment: true }
    });

    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }

    if (task.assignment.userId !== req.user.id) {
      return res.status(401).json({ error: 'Not authorized' });
    }

    const updatedTask = await prisma.task.update({
      where: { id: parseInt(id) },
      data: { 
        completed: completed !== undefined ? completed : task.completed,
        title: title || task.title,
        duration: duration || task.duration,
        category: category || task.category,
        date: date ? new Date(date) : task.date
      }
    });

    res.json(updatedTask);
  } catch (error) {
    if (error.name === 'ZodError') {
      return res.status(400).json({ error: error.errors[0].message });
    }
    res.status(500).json({ error: 'Failed to update task', details: error.message });
  }
});

// Delete a task
app.delete('/api/tasks/:id', protect, async (req, res) => {
  const { id } = req.params;

  try {
    const task = await prisma.task.findUnique({
      where: { id: parseInt(id) },
      include: { assignment: true }
    });

    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }

    if (task.assignment.userId !== req.user.id) {
      return res.status(401).json({ error: 'Not authorized' });
    }

    await prisma.task.delete({
      where: { id: parseInt(id) }
    });

    res.json({ message: 'Task deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete task', details: error.message });
  }
});

// Get productivity stats for the user
app.get('/api/stats', protect, async (req, res) => {
  try {
    const userId = req.user.id;

    const assignments = await prisma.assignment.findMany({
      where: { userId },
      include: { tasks: true }
    });

    const allTasks = assignments.flatMap(a => a.tasks);
    const completedTasks = allTasks.filter(t => t.completed);
    
    // Calculate stats
    const totalAssignments = assignments.length;
    const totalTasks = allTasks.length;
    const completedTasksCount = completedTasks.length;
    const progressPercentage = totalTasks > 0 ? (completedTasksCount / totalTasks) * 100 : 0;

    // Group by category
    const categoryStats = allTasks.reduce((acc, task) => {
      acc[task.category] = (acc[task.category] || 0) + 1;
      return acc;
    }, {});

    // Most productive category (by completion)
    const categoryCompletion = completedTasks.reduce((acc, task) => {
      acc[task.category] = (acc[task.category] || 0) + 1;
      return acc;
    }, {});

    res.json({
      totalAssignments,
      totalTasks,
      completedTasksCount,
      progressPercentage,
      categoryStats,
      categoryCompletion,
      recentAssignments: assignments.slice(0, 5).map(a => ({
        id: a.id,
        title: a.title,
        progress: a.tasks.length > 0 ? (a.tasks.filter(t => t.completed).length / a.tasks.length) * 100 : 0
      }))
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch stats', details: error.message });
  }
});

// Delete an assignment
app.delete('/api/assignments/:id', protect, async (req, res) => {
  const { id } = req.params;

  try {
    // Check ownership first
    const assignment = await prisma.assignment.findUnique({
      where: { id: parseInt(id) }
    });

    if (!assignment) {
      return res.status(404).json({ error: 'Assignment not found' });
    }

    if (assignment.userId !== req.user.id) {
      return res.status(401).json({ error: 'Not authorized' });
    }

    // Delete associated tasks first (if not handled by cascade)
    // In our schema, we didn't specify onDelete: Cascade, so we should check.
    // Actually, Prisma schema shows: assignment Assignment @relation(fields: [assignmentId], references: [id])
    // If not specified, we should delete tasks manually or update schema.
    await prisma.task.deleteMany({
      where: { assignmentId: parseInt(id) }
    });

    await prisma.assignment.delete({
      where: { id: parseInt(id) }
    });

    res.json({ message: 'Assignment deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete assignment', details: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
