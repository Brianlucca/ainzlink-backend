import 'dotenv/config';
import http from 'http';
import { Server } from 'socket.io';
import './config/firebase.js';
import { createApp, corsOptions } from './app.js';
import { env } from './config/env.js';
import initializeSocket from './websockets.js';

const app = createApp();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: corsOptions.origin,
    methods: ['GET', 'POST'],
  },
});

initializeSocket(io);

server.listen(env.port, '0.0.0.0', () => {
  console.log(`Servidor escutando em http://localhost:${env.port}`);
});
