import admin from 'firebase-admin';
import '../src/config/firebase.js';
import { db } from '../src/config/firebase.js';

const snapshot = await db.collectionGroup('analytics').get();
const batchSize = 400;

for (let index = 0; index < snapshot.docs.length; index += batchSize) {
  const batch = db.batch();
  snapshot.docs.slice(index, index + batchSize).forEach((document) => {
    batch.update(document.ref, {
      ip: admin.firestore.FieldValue.delete(),
      userAgent: admin.firestore.FieldValue.delete(),
      city: admin.firestore.FieldValue.delete(),
      referrer: admin.firestore.FieldValue.delete(),
    });
  });
  await batch.commit();
}

console.log(`${snapshot.size} eventos de analytics revisados.`);
