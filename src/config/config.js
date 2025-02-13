require('dotenv').config({
    path: process.env.NODE_ENV === 'production' ? '.env.production' : '.env.development',
  });
  
  module.exports = {
    development: {
      username: process.env.DB_USER,
      password: process.env.DB_PASS,
      database: process.env.DB_NAME,
      host: process.env.DB_HOST,
      port: process.env.DB_PORT,
      dialect: 'mysql',
    },
    production: {
      username: process.env.DB_USER,
      password: process.env.DB_PASS,
      database: process.env.DB_NAME,
      host: process.env.DB_HOST,
      port: process.env.DB_PORT,
      dialect: 'mysql',
    },
  };
  