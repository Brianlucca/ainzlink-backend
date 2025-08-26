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
      const date = new Date(expiresAt);
      date.setUTCHours(23, 59, 59, 999);
      urlData.expiresAt = date;
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
      return res.status(410).json({ error: 'Este link expirou.' });
    }
    
    const isApiRequest = req.query.json === 'true';

    if (!isApiRequest && !urlData.passwordHash) {
      await urlDocRef.update({ clicks: (urlData.clicks || 0) + 1 });
    }
    
    if (urlData.passwordHash) {
      return res.status(200).json({ passwordProtected: true });
    } else {
      if (isApiRequest) {
        return res.status(200).json({ originalUrl: urlData.originalUrl });
      } else {
        return res.redirect(urlData.originalUrl);
      }
    }
  } catch (error) {
    console.error('Erro ao buscar URL:', error);
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
      return res.status(401).json({ error: 'Senha incorreta.' });
    }
  } catch (error) {
    console.error('Erro ao verificar senha:', error);
    return res.status(500).json({ error: 'Erro interno no servidor.' });
  }
};

export const getUrlStats = async (req, res) => {
  try {
    const { shortCode } = req.params;
    const { token } = req.query;
    if (!token) {
      return res.status(401).json({ error: 'Token de administração é obrigatório.' });
    }
    const urlDoc = await db.collection('urls').doc(shortCode).get();
    if (!urlDoc.exists) {
      return res.status(404).json({ error: 'Link não encontrado.' });
    }
    const urlData = urlDoc.data();
    if (urlData.adminToken !== token) {
      return res.status(403).json({ error: 'Acesso negado. Token inválido.' });
    }
    return res.status(200).json({
      originalUrl: urlData.originalUrl,
      shortUrl: `${process.env.BASE_URL}/${urlData.shortCode}`,
      clicks: urlData.clicks,
      createdAt: urlData.createdAt.toDate(),
      expiresAt: urlData.expiresAt ? urlData.expiresAt.toDate() : null,
      passwordProtected: !!urlData.passwordHash,
    });
  } catch (error) {
    console.error('Erro ao buscar estatísticas:', error);
    return res.status(500).json({ error: 'Erro interno no servidor.' });
  }
};

export const updateUrl = async (req, res) => {
  try {
    const { shortCode } = req.params;
    const { token } = req.query;
    const { originalUrl, password } = req.body;
    if (!token) {
      return res.status(401).json({ error: 'Token de administração é obrigatório.' });
    }
    const urlDocRef = db.collection('urls').doc(shortCode);
    const urlDoc = await urlDocRef.get();
    if (!urlDoc.exists) {
      return res.status(404).json({ error: 'Link não encontrado.' });
    }
    const urlData = urlDoc.data();
    if (urlData.adminToken !== token) {
      return res.status(403).json({ error: 'Acesso negado. Token inválido.' });
    }
    const updates = {};
    if (originalUrl) {
      updates.originalUrl = originalUrl;
    }
    if (password) {
      const saltRounds = 10;
      updates.passwordHash = await bcrypt.hash(password, saltRounds);
    } else if (password === null || password === '') {
      updates.passwordHash = null;
    }
    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ error: 'Nenhuma informação para atualizar foi fornecida.' });
    }
    await urlDocRef.update(updates);
    return res.status(200).json({ message: 'Link atualizado com sucesso.' });
  } catch (error) {
    console.error('Erro ao atualizar link:', error);
    return res.status(500).json({ error: 'Erro interno no servidor.' });
  }
};

export const deleteUrl = async (req, res) => {
  try {
    const { shortCode } = req.params;
    const { token } = req.query;
    if (!token) {
      return res.status(401).json({ error: 'Token de administração é obrigatório.' });
    }
    const urlDocRef = db.collection('urls').doc(shortCode);
    const urlDoc = await urlDocRef.get();
    if (!urlDoc.exists) {
      return res.status(404).json({ error: 'Link não encontrado.' });
    }
    const urlData = urlDoc.data();
    if (urlData.adminToken !== token) {
      return res.status(403).json({ error: 'Acesso negado. Token inválido.' });
    }
    await urlDocRef.delete();
    return res.status(200).json({ message: 'Link deletado com sucesso.' });
  } catch (error) {
    console.error('Erro ao deletar link:', error);
    return res.status(500).json({ error: 'Erro interno no servidor.' });
  }
};