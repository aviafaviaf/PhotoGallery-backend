import { Request, Response } from 'express';
import { pool } from '../db.js';
import { AuthRequest } from '../middleware/authMiddleware.js';

export const uploadPhoto = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.file) {
      res.status(400).json({ message: 'No file uploaded' });
      return;
    }

    const { path: imageUrl } = req.file;
    const { title } = req.body;
    const userId = req.user?.id;
    const is_published = req.body.is_published === 'true';

    const result = await pool.query(
      'INSERT INTO photos (url, title, user_id, is_published) VALUES ($1, $2, $3, $4) RETURNING *',
      [imageUrl, title, userId, is_published]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Photo upload failed', details: err });
  }
};

export const getPhotos = async (req: Request, res: Response): Promise<void> => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 9;
  const offset = (page - 1) * limit;

  try {
    const result = await pool.query(
      `SELECT photos.id, photos.url, photos.title, photos.user_id, photos.is_published, users.username
       FROM photos
       JOIN users ON photos.user_id = users.id
       WHERE is_published = true
       ORDER BY photos.id DESC
       LIMIT $1 OFFSET $2;`,
      [limit, offset]
    );

    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch photos', details: err });
  }
};

export const getMyPhotos = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 9;
    const offset = (page - 1) * limit;
    const userId = req.user?.id;

    const result = await pool.query(
      `SELECT id, url, title, created_at, is_published
       FROM photos
       WHERE user_id = $1
       ORDER BY created_at DESC
       LIMIT $2 OFFSET $3`,
      [userId, limit, offset]
    );

    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch user photos', details: err });
  }
};

export const getPhotosByUser = async (req: Request, res: Response): Promise<void> => {
  const userId = req.params.id;
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 9;
  const offset = (page - 1) * limit;

  try {
    const result = await pool.query(
      `SELECT photos.*, users.username
       FROM photos
       JOIN users ON photos.user_id = users.id
       WHERE photos.is_published = true AND photos.user_id = $1
       ORDER BY photos.created_at DESC
       LIMIT $2 OFFSET $3`,
      [userId, limit, offset]
    );

    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ message: 'Ошибка при получении фотографий пользователя' });
  }
};

export const deletePhoto = async (req: AuthRequest, res: Response): Promise<void> => {
  const photoId = parseInt(req.params.id, 10);
  const userId = req.user?.id;

  try {
    const result = await pool.query('SELECT * FROM photos WHERE id = $1', [photoId]);
    const photo = result.rows[0];

    if (!photo) {
      res.status(404).json({ message: 'Фото не найдено' });
      return;
    }

    if (photo.user_id !== userId) {
      res.status(403).json({ message: 'У вас нет прав на удаление этого фото' });
      return;
    }

    await pool.query('DELETE FROM photos WHERE id = $1', [photoId]);
    res.status(200).json({ message: 'Фото успешно удалено' });
  } catch (error) {
    console.error('Ошибка при удалении фото:', error);
    res.status(500).json({ message: 'Ошибка сервера' });
  }
};

export const togglePublishStatus = async (req: AuthRequest, res: Response): Promise<void> => {
  const photoId = req.params.id;
  const userId = req.user?.id;
  const { is_published } = req.body;

  try {
    const result = await pool.query('SELECT * FROM photos WHERE id = $1', [photoId]);
    if (!result.rows.length) {
      res.status(404).json({ error: 'Фото не найдено' });
      return;
    }

    const photo = result.rows[0];
    if (photo.user_id !== userId) {
      res.status(403).json({ error: 'Нет доступа' });
      return;
    }

    await pool.query('UPDATE photos SET is_published = $1 WHERE id = $2', [is_published, photoId]);
    res.sendStatus(200);
  } catch (err) {
    res.status(500).json({ error: 'Ошибка при обновлении' });
  }
};

export const addFavorite = async (req: AuthRequest, res: Response): Promise<void> => {
  const userId = req.user?.id;
  const { photoId } = req.params;

  try {
    await pool.query(
      'INSERT INTO favorites (user_id, photo_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
      [userId, photoId]
    );
    res.sendStatus(200);
  } catch (err) {
    res.status(500).json({ error: 'Ошибка добавления в избранное' });
  }
};

export const removeFavorite = async (req: AuthRequest, res: Response): Promise<void> => {
  const userId = req.user?.id;
  const { photoId } = req.params;

  try {
    await pool.query('DELETE FROM favorites WHERE user_id = $1 AND photo_id = $2', [userId, photoId]);
    res.sendStatus(200);
  } catch (err) {
    res.status(500).json({ error: 'Ошибка удаления из избранного' });
  }
};

export const getFavorites = async (req: AuthRequest, res: Response): Promise<void> => {
  const userId = req.user?.id;

  try {
    const result = await pool.query(
      `SELECT photos.*
       FROM photos
       JOIN favorites ON photos.id = favorites.photo_id
       WHERE favorites.user_id = $1
         AND (photos.is_published = true OR photos.user_id = $1)`,
      [userId]
    );

    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Ошибка получения избранных фото' });
  }
};

export const addComment = async (req: AuthRequest, res: Response): Promise<void> => {
  const userId = req.user?.id;
  const { photoId } = req.params;
  const { content } = req.body;

  if (!content || content.trim() === '') {
    res.status(400).json({ error: 'Комментарий не может быть пустым' });
    return;
  }

  try {
    const result = await pool.query(
      'INSERT INTO comments (photo_id, user_id, content) VALUES ($1, $2, $3) RETURNING *',
      [photoId, userId, content]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Ошибка при добавлении комментария' });
  }
};

export const getCommentsByPhoto = async (req: Request, res: Response): Promise<void> => {
  const { photoId } = req.params;

  try {
    const result = await pool.query(
      `SELECT comments.*, users.username
       FROM comments
       JOIN users ON comments.user_id = users.id
       WHERE comments.photo_id = $1
       ORDER BY comments.created_at DESC`,
      [photoId]
    );

    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Ошибка при получении комментариев' });
  }
};

export const deleteComment = async (req: AuthRequest, res: Response): Promise<void> => {
  const commentId = parseInt(req.params.id, 10);
  const userId = req.user?.id;

  try {
    const result = await pool.query('SELECT * FROM comments WHERE id = $1', [commentId]);
    if (result.rows.length === 0) {
      res.status(404).json({ message: 'Комментарий не найден' });
      return;
    }

    const comment = result.rows[0];
    if (comment.user_id !== userId) {
      res.status(403).json({ message: 'Нет прав на удаление этого комментария' });
      return;
    }

    await pool.query('DELETE FROM comments WHERE id = $1', [commentId]);
    res.status(200).json({ message: 'Комментарий успешно удалён' });
  } catch (err) {
    res.status(500).json({ error: 'Ошибка при удалении комментария' });
  }
};

export const photoDetails = async (req: AuthRequest, res: Response): Promise<void> => {
  const photoId = parseInt(req.params.id, 10);
  const currentUserId = req.user?.id || null;

  try {
    const photoResult = await pool.query(
      `SELECT photos.id, photos.url, photos.title, photos.user_id, photos.is_published, users.username
       FROM photos
       JOIN users ON photos.user_id = users.id
       WHERE photos.id = $1`,
      [photoId]
    );

    if (photoResult.rows.length === 0) {
      res.status(404).json({ error: 'Фото не найдено' });
      return;
    }

    const photo = photoResult.rows[0];

    if (!photo.is_published && photo.user_id !== currentUserId) {
      res.status(403).json({ error: 'Доступ запрещён: фото не опубликовано' });
      return;
    }

    const commentsResult = await pool.query(
      `SELECT comments.id, comments.content, comments.created_at, users.username, comments.user_id
       FROM comments
       JOIN users ON comments.user_id = users.id
       WHERE comments.photo_id = $1
       ORDER BY comments.created_at DESC`,
      [photoId]
    );

    res.json({
      photo,
      comments: commentsResult.rows,
    });
  } catch (err) {
    res.status(500).json({ error: 'Ошибка при получении данных фото', details: err });
  }
};