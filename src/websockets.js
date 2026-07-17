import { urlRepository } from './repositories/urlRepository.js';
import { urlService } from './services/urlService.js';
import { auth } from './config/firebase.js';

export default function initializeSocket(io) {
  io.on('connection', (socket) => {
    let unsubscribe = null;

    socket.on('subscribeToLinkStats', async ({ shortCode, token, userToken }, acknowledge) => {
      try {
        if (unsubscribe) unsubscribe();
        const user = userToken ? await auth.verifyIdToken(userToken) : null;
        await urlService.authorizeAdmin(shortCode, token, user);

        unsubscribe = urlRepository.subscribe(
          shortCode,
          (link) => {
            if (link) {
              socket.emit('linkStatsUpdate', {
                clicks: link.clicks || 0,
                originalUrl: link.originalUrl,
              });
            }
          },
          (error) => console.error(`Erro ao observar ${shortCode}:`, error),
        );
        acknowledge?.({ ok: true });
      } catch (error) {
        acknowledge?.({ ok: false, error: error.message });
      }
    });

    socket.on('disconnect', () => {
      if (unsubscribe) unsubscribe();
    });
  });
}
