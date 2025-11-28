import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import cors from 'cors';
import userRoutes from './routes/userRoutes.js';
import { updateUserLocationViaSocket } from './controllers/userController.js';

dotenv.config();

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: '*', // Change to your frontend domain in production
    methods: ['GET', 'POST']
  }
});


// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check endpoints (before routes)
app.get('/health', async (req, res) => {
  const dbStatus = mongoose.connection.readyState === 1 ? 'connected' : 'disconnected';
  res.json({ 
    status: 'healthy',
    timestamp: new Date().toISOString(),
    mongodb: dbStatus,
    socketClients: io.engine.clientsCount,
    uptime: process.uptime()
  });
});

app.get('/', (req, res) => {
  res.json({ 
    message: 'JWT Authentication and Real-Time Location Tracking API is running',
    health: '/health',
    docs: '/api/docs' 
  });
});

// MongoDB connection
mongoose.connect(process.env.MAIN_DB_URL)
  .then(() => console.log('MongoDB connected successfully'))
  .catch((err) => console.error('MongoDB connection error:', err));

// Socket.IO real-time handlers
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  socket.on('locationUpdate', async (data) => {
    const { userId, coords } = data; // Client must send userId + coords { latitude, longitude }
    if (userId && coords?.latitude != null && coords?.longitude != null) {
      await updateUserLocationViaSocket(userId, coords, io, socket);
    } else {
      console.warn('Invalid locationUpdate payload:', data);
    }
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

// Express routes
app.use('/api/users', userRoutes);

// Health check endpoint
app.get('/', (req, res) => {
  res.json({ message: 'JWT Authentication and Real-Time Location Tracking API is running' });
});

const PORT = process.env.PORT || 4000;
server.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});

export default app;
