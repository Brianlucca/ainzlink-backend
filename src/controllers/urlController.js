import { nanoid } from 'nanoid';
import { db } from '../config/firebase.js';

export const shortenUrl = async (req, res) => {
  try {
    const { originalUrl } = req.body;

    if (!originalUrl) {
      return res.status(400).json({ error: 'URL original é obrigatória.' });
    }

    const shortCode = nanoid(8);

    const urlData = {
      originalUrl,
      shortCode,
      createdAt: new Date(),
    };

    await db.collection('urls').doc(shortCode).set(urlData);

    const baseUrl = process.env.BASE_URL;

    const shortUrl = `${baseUrl}/${shortCode}`;

    return res.status(201).json({ shortUrl });
  } catch (error) {
    console.error('Erro ao encurtar URL:', error);
    return res.status(500).json({ error: 'Erro interno no servidor.' });
  }
};