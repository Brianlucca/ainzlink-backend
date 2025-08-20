import express from 'express';
import 'dotenv/config';
import './config/firebase.js';

import urlRoutes from './routes/urlRoutes.js';
import redirectRoutes from './routes/redirectRoutes.js';

const app = express();
const PORT = process.env.PORT || 5001;

app.use(express.json());

app.use('/api/v1', urlRoutes);

app.use('/', redirectRoutes);

app.listen(PORT, () => {
  console.log(`Servidor rodando na porta http://localhost:${PORT}`);
});