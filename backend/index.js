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

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
