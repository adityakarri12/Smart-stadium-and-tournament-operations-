import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import chatRoutes from './routes/chat';
import apiRoutes from './routes/api';
import analyticsRoutes from './routes/analytics';
import { errorHandler } from './middleware/error';

dotenv.config();

const app = express();

// Middleware
app.use(helmet());

const allowedOrigins = process.env.CLIENT_ORIGIN
  ? process.env.CLIENT_ORIGIN.split(',').map(o => o.trim())
  : ['http://localhost:5173', 'http://localhost:4173'];

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, curl, server-to-server)
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes('*') || allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    return callback(new Error(`CORS: Origin ${origin} not allowed`));
  },
  credentials: true
}));

app.use(express.json());

// Routes
app.use('/api/chat', chatRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api', apiRoutes); // schedules, facilities, etc.

// Global Error Handler
app.use(errorHandler);

export default app;
