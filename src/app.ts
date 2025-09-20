import express from 'express';
import * as dotenv from 'dotenv';
import cors from 'cors';
import routes from './routes';
import { setupSwagger } from './config/swagger';
import { errorHandler } from './middlewares/error.middleware';
import sequelize from './config/database';
import './models'; // Import all models and associations
import path from 'path';

dotenv.config();

const app = express();

app.use(cors({
  origin: true, // Allow all origins (including mobile apps)
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin'],
  credentials: true,
  preflightContinue: false,
  optionsSuccessStatus: 200
}));
app.use(express.urlencoded({ extended: true })); // ✅ Supports form submissions
app.use(express.json()); // ✅ Correctly parse JSON data

app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, '../templates'));
app.use('/static', express.static(path.join(__dirname, '../public')));


// ❌ DO NOT use bodyParser.json() before file uploads (multer handles it)
// app.use(bodyParser.json()); // ❌ REMOVE THIS

app.use('/api', routes);

setupSwagger(app);
app.use(errorHandler); // ✅ Add error handler last

export default app;


// Test database connection and sync
const testDatabaseConnection = async () => {
  try {
    await sequelize.authenticate();
    console.log('✅ Database connection established successfully.');
    
    await sequelize.sync();
    console.log('✅ Database schema updated!');
  } catch (error) {
    console.error('❌ Unable to connect to the database:', error);
    process.exit(1);
  }
};

testDatabaseConnection();

