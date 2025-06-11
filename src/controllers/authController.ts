import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { pool } from '../db.js';

const JWT_SECRET = process.env.JWT_SECRET || 'default_secret';
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const register = async (req: Request, res: Response): Promise<void> => {
  const { email, password, username } = req.body;

  if (!email || !password || !username) {
    res.status(400).json({ message: 'Email, пароль и имя пользователя обязательны' });
    return;
  }

  if (!emailRegex.test(email)) {
    res.status(400).json({ message: 'Некорректный формат email' });
    return;
  }

  try {
    const existingUser = await pool.query(
      'SELECT id FROM users WHERE email = $1 OR username = $2',
      [email, username]
    );

    if (existingUser.rows.length > 0) {
      res.status(400).json({ message: 'Email или никнейм уже используется' });
      return;
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const result = await pool.query(
      'INSERT INTO users (email, password, username) VALUES ($1, $2, $3) RETURNING id, email, username',
      [email, hashedPassword, username]
    );

    const newUser = result.rows[0];
    const token = jwt.sign(
      { id: newUser.id, email: newUser.email, username: newUser.username },
      JWT_SECRET,
      { expiresIn: '1d' }
    );

    res.status(201).json({
      message: 'Регистрация прошла успешно',
      token,
      user: {
        id: newUser.id,
        email: newUser.email,
        username: newUser.username
      }
    });
  } catch (error) {
    console.error('Ошибка при регистрации:', error);
    res.status(500).json({ message: 'Ошибка регистрации', details: error });
  }
};

export const login = async (req: Request, res: Response): Promise<void> => {
  const { email, password } = req.body;

  if (!email || !password) {
    res.status(400).json({ message: 'Email и пароль обязательны' });
    return;
  }

  try {
    const userResult = await pool.query(
      'SELECT id, email, username, password FROM users WHERE email = $1',
      [email]
    );

    const user = userResult.rows[0];

    if (!user) {
      res.status(400).json({ message: 'Пользователь не найден' });
      return;
    }

    const passwordMatch = await bcrypt.compare(password, user.password);

    if (!passwordMatch) {
      res.status(401).json({ message: 'Неверный пароль' });
      return;
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, username: user.username },
      JWT_SECRET,
      { expiresIn: '1d' }
    );

    res.json({
      message: 'Вход выполнен успешно',
      token,
      user: {
        id: user.id,
        email: user.email,
        username: user.username
      }
    });
  } catch (error) {
    console.error('Ошибка при входе:', error);
    res.status(500).json({ message: 'Ошибка входа', details: error });
  }
};
