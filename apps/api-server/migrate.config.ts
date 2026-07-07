import 'dotenv/config';

export default {
  dbConnection: process.env.DATABASE_URL,
  direction: 'up',
  migrationsDir: 'migrations',
  verbose: true,
};