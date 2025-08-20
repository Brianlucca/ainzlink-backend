import admin from 'firebase-admin';
import 'dotenv/config';

const firebaseCredentials = process.env.FIREBASE_CREDENTIALS_JSON;

if (!firebaseCredentials) {
  throw new Error('As credenciais do Firebase não foram encontradas nas variáveis de ambiente.');
}

const serviceAccount = JSON.parse(firebaseCredentials);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

console.log('Firebase conectado com sucesso!');

export const db = admin.firestore();