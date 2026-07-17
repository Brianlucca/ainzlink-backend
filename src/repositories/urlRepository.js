import admin from 'firebase-admin';
import { db } from '../config/firebase.js';

const collection = db.collection('urls');

const normalize = (snapshot) => (
  snapshot.exists ? { id: snapshot.id, ...snapshot.data() } : null
);

export const urlRepository = {
  async findByCode(shortCode) {
    return normalize(await collection.doc(shortCode).get());
  },

  async create(shortCode, data) {
    await collection.doc(shortCode).set(data);
  },

  async update(shortCode, data) {
    await collection.doc(shortCode).update(data);
  },

  async delete(shortCode) {
    await collection.doc(shortCode).delete();
  },

  async incrementClicks(shortCode) {
    await collection.doc(shortCode).update({
      clicks: admin.firestore.FieldValue.increment(1),
    });
  },

  async listByOwner(ownerId) {
    const snapshot = await collection.where('ownerId', '==', ownerId).get();
    return snapshot.docs.map(normalize);
  },

  async addAnalyticsEvent(shortCode, event) {
    await collection.doc(shortCode).collection('analytics').add(event);
  },

  async listAnalytics(shortCode) {
    const snapshot = await collection
      .doc(shortCode)
      .collection('analytics')
      .orderBy('createdAt', 'desc')
      .limit(1000)
      .get();
    return snapshot.docs.map(normalize);
  },

  async report(shortCode, report) {
    const linkRef = collection.doc(shortCode);
    await linkRef.collection('reports').add(report);
    await linkRef.update({
      reportCount: admin.firestore.FieldValue.increment(1),
    });
  },

  subscribe(shortCode, onChange, onError) {
    return collection.doc(shortCode).onSnapshot(
      (snapshot) => onChange(normalize(snapshot)),
      onError,
    );
  },
};
