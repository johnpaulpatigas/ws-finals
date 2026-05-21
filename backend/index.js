const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const prisma = require('./db');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

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

// Create a new assignment
app.post('/api/assignments', async (req, res) => {
  const { title, dueDate, workingDays } = req.body;
  
  try {
    const assignment = await prisma.assignment.create({
      data: {
        title,
        dueDate: new Date(dueDate),
        workingDays: parseInt(workingDays) || 5,
        // For now, we'll omit userId until auth is fully implemented
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
app.get('/api/assignments/:id', async (req, res) => {
  const { id } = req.params;
  
  try {
    const assignment = await prisma.assignment.findUnique({
      where: { id: parseInt(id) },
      include: { tasks: { orderBy: { date: 'asc' } } }
    });

    if (!assignment) {
      return res.status(404).json({ error: 'Assignment not found' });
    }

    res.json(assignment);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch assignment', details: error.message });
  }
});

// Update task status
app.patch('/api/tasks/:id', async (req, res) => {
  const { id } = req.params;
  const { completed } = req.body;

  try {
    const task = await prisma.task.update({
      where: { id: parseInt(id) },
      data: { completed }
    });

    res.json(task);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update task', details: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
