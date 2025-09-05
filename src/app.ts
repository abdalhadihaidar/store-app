import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import routes from './routes';
import { setupSwagger } from './config/swagger';
import { errorHandler } from './middlewares/error.middleware';
import sequelize from './config/database';
import path from 'path';

dotenv.config();

const app = express();

app.use(cors({
  origin: '*',  // Allow all origins (not recommended for production)
  methods: ['GET', 'POST', 'PUT', 'DELETE','patch'],
  allowedHeaders: ['Content-Type', 'Authorization'],
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


// Sync database

//sequelize.sync().then(() => {
  //console.log('✅ Database schema updated!');
//});

