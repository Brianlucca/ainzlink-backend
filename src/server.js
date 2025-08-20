import express from 'express';
import 'dotenv/config';
import './config/firebase.js';
import urlRoutes from './routes/urlRoutes.js';

const app = express();
const PORT = process.env.PORT || 5001;

app.use(express.json());

app.get('/', (req, res) => {
  res.status(200).send({ message: 'API do AinzLink está no ar!' });
});

app.use('/api/v1', urlRoutes);

app.listen(PORT, () => {
  console.log(`Servidor rodando na porta http://localhost:${PORT}`);
});