const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const prisma = require('./db');
const { generateTasks } = require('./utils/taskGenerator');
const authRoutes = require('./routes/auth');
const { protect } = require('./middleware/auth');

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
  const { title, dueDate, workingDays } = req.body;
  
  try {
    const assignment = await prisma.assignment.create({
      data: {
        title,
        dueDate: new Date(dueDate),
        workingDays: parseInt(workingDays) || 5,
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

// Update task status
app.patch('/api/tasks/:id', protect, async (req, res) => {
  const { id } = req.params;
  const { completed } = req.body;

  try {
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
      data: { completed }
    });

    res.json(updatedTask);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update task', details: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
