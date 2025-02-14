import express from 'express';
import dotenv from 'dotenv';
import bodyParser from 'body-parser';
import cors from 'cors';
import routes from './routes';
import sequelize from './config/database';
import { setupSwagger } from './config/swagger';
import { errorHandler } from './middleware/error.middleware'; // Import error handler

dotenv.config();

const app = express();
app.use('/uploads', express.static('uploads')); // ✅ Serve images from the uploads folder
app.use(cors({
  origin: '*',  // Allow all origins (not recommended for production)
  methods: ['GET', 'POST', 'PUT', 'DELETE','patch'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

app.use(bodyParser.json());
app.use('/api', routes);

// Setup Swagger
setupSwagger(app);

// Error Handling Middleware (MUST be placed after routes)
app.use(errorHandler);

export default app;

// Sync database

sequelize.sync({ alter: true }).then(() => {
  console.log('✅ Database schema updated!');
});
