import { Sequelize } from 'sequelize';
import dotenv from 'dotenv';

dotenv.config();

const sequelize = new Sequelize({
  database: process.env.DB_NAME!,
  username: process.env.DB_USER!,
  password: process.env.DB_PASS!,
  host: process.env.DB_HOST!,  // This should be just the domain
  port: Number(process.env.DB_PORT!), // Convert port to number
  dialect: 'mysql',
  logging: false,
});

export default sequelize;
