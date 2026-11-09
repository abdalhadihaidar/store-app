import app, { databaseReady } from './app';
import * as dotenv from 'dotenv';
dotenv.config();
const PORT = process.env.PORT || 3000;

databaseReady.then(() => app.listen(PORT, () => {
  // console.log(`Server running on port ${PORT}`);
}));
