import { Sequelize } from 'sequelize';
import dotenv from 'dotenv';

dotenv.config();

const sequelize = new Sequelize(process.env.DB_NAME!, process.env.DB_USER!, process.env.DB_PASS!, {
  host: process.env.DB_HOST!,
  port: Number(process.env.DB_PORT!),  // Add port 3900
  dialect: 'mysql',
  logging: false,
});

export default sequelize;
