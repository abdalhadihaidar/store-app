import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import routes from './routes';
import sequelize from './config/database';
import { setupSwagger } from './config/swagger';
import { errorHandler } from './middleware/error.middleware';

dotenv.config();

const app = express();

app.use(cors({
  origin: '*',  // Allow all origins (not recommended for production)
  methods: ['GET', 'POST', 'PUT', 'DELETE','patch'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));
app.use(express.urlencoded({ extended: true })); // ✅ Supports form submissions
app.use(express.json()); // ✅ Correctly parse JSON data

app.use('/uploads', express.static('uploads')); // ✅ Serve images from the uploads folder



// ❌ DO NOT use bodyParser.json() before file uploads (multer handles it)
// app.use(bodyParser.json()); // ❌ REMOVE THIS

app.use('/api', routes);
setupSwagger(app);
app.use(errorHandler); // ✅ Add error handler last

export default app;


// Sync database

//sequelize.sync({ alter: true }).then(() => {
//  console.log('✅ Database schema updated!');
//});

