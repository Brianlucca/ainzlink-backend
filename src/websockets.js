import { db } from './config/firebase.js';

export default function initializeSocket(io) {
  io.on('connection', (socket) => {
    console.log('Um cliente se conectou via WebSocket:', socket.id);

    let unsubscribe = null;

    socket.on('subscribeToLinkStats', (shortCode) => {
      if (!shortCode) return;
      
      console.log(`Cliente ${socket.id} está observando o link: ${shortCode}`);
      
      unsubscribe = db.collection('urls').doc(shortCode).onSnapshot((snapshot) => {
        if (snapshot.exists) {
          const urlData = snapshot.data();
          socket.emit('linkStatsUpdate', {
            clicks: urlData.clicks,
            originalUrl: urlData.originalUrl,
          });
        }
      }, (error) => {
        console.error(`Erro ao observar o link ${shortCode}:`, error);
      });
    });

    socket.on('disconnect', () => {
      console.log('Um cliente se desconectou:', socket.id);
      if (unsubscribe) {
        unsubscribe();
      }
    });
  });
}