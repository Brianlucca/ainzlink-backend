import admin from 'firebase-admin';
import 'dotenv/config';

import serviceAccount from './firebase-credentials.json' with { type: 'json' };

try {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });

  console.log('Conexão com o Firebase estabelecida com sucesso!');
} catch (error) {
  console.error('Erro ao conectar com o Firebase:', error);
  process.exit(1);
}

export const db = admin.firestore();