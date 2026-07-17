import admin from 'firebase-admin';
import 'dotenv/config';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

let serviceAccount;

if (process.env.FIREBASE_CREDENTIALS_JSON) {
  serviceAccount = JSON.parse(process.env.FIREBASE_CREDENTIALS_JSON);
} else {
  const credentialsPath = process.env.FIREBASE_CREDENTIALS_FILE
    || resolve('firebase-credentials.json');
  try {
    serviceAccount = JSON.parse(readFileSync(credentialsPath, 'utf8'));
  } catch {
    throw new Error(
      `Credenciais Firebase ausentes. Configure FIREBASE_CREDENTIALS_JSON ou o arquivo ${credentialsPath}.`,
    );
  }
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
export const auth = admin.auth();
