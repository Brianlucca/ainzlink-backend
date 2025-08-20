import express from 'express';
import 'dotenv/config';

const app = express();
const PORT = process.env.PORT || 5001;

app.use(express.json());

app.get('/', (req, res) => {
  res.status(200).send({ message: 'API do AinzLink está no ar!' });
});

app.listen(PORT, () => {
  console.log(`Servidor rodando na porta http://localhost:${PORT}`);
});