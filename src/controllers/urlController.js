import { nanoid } from 'nanoid';
import bcrypt from 'bcrypt';
import { db } from '../config/firebase.js';

export const shortenUrl = async (req, res) => {
  try {
    const { originalUrl, customCode, password, expiresAt } = req.body;
    if (!originalUrl) {
      return res.status(400).json({ error: 'URL original é obrigatória.' });
    }
    let shortCode;
    if (customCode) {
      const existingDoc = await db.collection('urls').doc(customCode).get();
      if (existingDoc.exists) {
        return res.status(409).json({ error: 'Este nome personalizado já está em uso.' });
      }
      shortCode = customCode;
    } else {
      shortCode = nanoid(8);
    }
    const adminToken = nanoid(32);
    const urlData = {
      originalUrl,
      shortCode,
      adminToken,
      createdAt: new Date(),
      clicks: 0,
    };
    if (password) {
      const saltRounds = 10;
      urlData.passwordHash = await bcrypt.hash(password, saltRounds);
    }
    if (expiresAt) {
      urlData.expiresAt = new Date(expiresAt);
    }
    await db.collection('urls').doc(shortCode).set(urlData);
    const baseUrl = process.env.BASE_URL;
    const shortUrl = `${baseUrl}/${shortCode}`;
    const adminUrl = `${baseUrl}/admin/${shortCode}?token=${adminToken}`;
    return res.status(201).json({ shortUrl, adminUrl });
  } catch (error) {
    console.error('Erro ao encurtar URL:', error);
    return res.status(500).json({ error: 'Erro interno no servidor.' });
  }
};

export const redirectToOriginalUrl = async (req, res) => {
  try {
    const { shortCode } = req.params;
    const urlDocRef = db.collection('urls').doc(shortCode);
    const urlDoc = await urlDocRef.get();

    if (!urlDoc.exists) {
      return res.status(404).json({ error: 'URL não encontrada.' });
    }

    const urlData = urlDoc.data();

    if (urlData.expiresAt && urlData.expiresAt.toDate() < new Date()) {
      return res.status(410).json({ error: 'Este link expirou.' }); // 410 Gone
    }

    if (urlData.passwordHash) {
      return res.status(200).json({ passwordProtected: true });
    }
    
    await urlDocRef.update({ clicks: (urlData.clicks || 0) + 1 });
    return res.redirect(urlData.originalUrl);

  } catch (error) {
    console.error('Erro ao redirecionar URL:', error);
    return res.status(500).json({ error: 'Erro interno no servidor.' });
  }
};

export const verifyPasswordAndRedirect = async (req, res) => {
  try {
    const { shortCode } = req.params;
    const { password } = req.body;

    if (!password) {
      return res.status(400).json({ error: 'Senha é obrigatória.' });
    }

    const urlDocRef = db.collection('urls').doc(shortCode);
    const urlDoc = await urlDocRef.get();

    if (!urlDoc.exists) {
      return res.status(404).json({ error: 'URL não encontrada.' });
    }

    const urlData = urlDoc.data();

    const isMatch = await bcrypt.compare(password, urlData.passwordHash);

    if (isMatch) {
      await urlDocRef.update({ clicks: (urlData.clicks || 0) + 1 });
      return res.status(200).json({ originalUrl: urlData.originalUrl });
    } else {
      return res.status(401).json({ error: 'Senha incorreta.' }); // 401 Unauthorized
    }

  } catch (error) {
    console.error('Erro ao verificar senha:', error);
    return res.status(500).json({ error: 'Erro interno no servidor.' });
  }
};