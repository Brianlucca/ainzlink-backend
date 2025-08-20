import admin from 'firebase-admin';
import 'dotenv/config';

let serviceAccount;

if (process.env.NODE_ENV === 'production') {
  if (!process.env.FIREBASE_CREDENTIALS_JSON) {
    throw new Error('A variável de ambiente FIREBASE_CREDENTIALS_JSON não está definida.');
  }
  serviceAccount = JSON.parse(process.env.FIREBASE_CREDENTIALS_JSON);
} else {
  const { default: localCredentials } = await import('./firebase-credentials.json', {
    with: { type: 'json' },
  });
  serviceAccount = localCredentials;
}

try {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
  console.log('Conexão com o Firebase estabelecida com sucesso!');
} catch (error) {
  console.error('Erro ao conectar com o Firebase:', error.message);
  process.exit(1);
}

export const db = admin.firestore();