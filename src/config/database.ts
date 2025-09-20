import { Sequelize } from 'sequelize';
import * as dotenv from 'dotenv';
import path from 'path';

// ✅ Load the correct `.env` file based on NODE_ENV
const envFile = process.env.NODE_ENV === 'production' ? '.env.production' : '.env.development';
dotenv.config({ path: path.resolve(__dirname, `../../${envFile}`) });

// ✅ Ensure all required environment variables are set
if (!process.env.DB_NAME || !process.env.DB_USER || !process.env.DB_PASS || !process.env.DB_HOST || !process.env.DB_PORT) {
  throw new Error('❌ Missing required database environment variables. Check your .env file.');
}

const sequelize = new Sequelize({
  database: process.env.DB_NAME,
  username: process.env.DB_USER,
  password: process.env.DB_PASS,
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT),
  dialect: 'mysql',
  logging: false,
  pool: {
    max: 20,
    min: 2,
    acquire: 60000,
    idle: 30000,
    evict: 1000
  },
  dialectOptions: {
    // Use correct MySQL2 options
    charset: 'utf8mb4',
    supportBigNumbers: true,
    bigNumberStrings: true,
    // Connection timeout options - use correct MySQL2 option names
    connectTimeout: 60000,
    // Keep connection alive
    keepAliveInitialDelay: 0,
    enableKeepAlive: true,
    // Query timeout to prevent long-running queries
    queryTimeout: 30000
  },
  retry: {
    match: [
      /ETIMEDOUT/,
      /EHOSTUNREACH/,
      /ECONNRESET/,
      /ECONNREFUSED/,
      /ESOCKETTIMEDOUT/,
      /EPIPE/,
      /EAI_AGAIN/,
      /SequelizeConnectionError/,
      /SequelizeConnectionRefusedError/,
      /SequelizeHostNotFoundError/,
      /SequelizeHostNotReachableError/,
      /SequelizeInvalidConnectionError/,
      /SequelizeConnectionTimedOutError/,
      /read ECONNRESET/
    ],
    max: 3
  }
});

export default sequelize;
