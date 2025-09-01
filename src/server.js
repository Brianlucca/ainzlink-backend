import express from 'express';
import cors from 'cors';
import 'dotenv/config';
import http from 'http';
import { Server } from 'socket.io';
import rateLimit from 'express-rate-limit';
import './config/firebase.js';
import initializeSocket from './websockets.js';
import urlRoutes from './routes/urlRoutes.js';
import redirectRoutes from './routes/redirectRoutes.js';

const app = express();
const server = http.createServer(app);

const corsOrigin = process.env.CORS_ORIGIN || "https://ainzlink.com";

const io = new Server(server, {
  cors: {
    origin: corsOrigin,
    methods: ["GET", "POST"]
  }
});

initializeSocket(io);

const PORT = process.env.PORT || 5001;

const apiLimiter = rateLimit({
	windowMs: 60 * 60 * 1000,
	max: 30,
	standardHeaders: true,
	legacyHeaders: false,
  message: { error: 'Muitas requisições a partir deste IP, por favor, tente novamente após 60 minutos.' }
});

app.use(cors({ origin: corsOrigin }));
app.use(express.json());

app.get('/', (req, res) => {
  res.status(200).json({ message: 'AinzLink API está no ar e operacional!' });
});

app.get('/favicon.ico', (req, res) => res.status(204).send());

app.use('/api/', apiLimiter);
app.use('/api/v1/urls', urlRoutes);
app.use('/', redirectRoutes);

server.listen(PORT, '0.0.0.0', () => {
  console.log(`Servidor escutando na porta ${PORT}`);
});