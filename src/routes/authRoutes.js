const express = require('express');
const { run, get, all } = require('../db/database');
const config = require('../config');
const { makeToken, okResponse, errMsg, buildUserResponse } = require('../utils/helpers');
const { logInfo, logSensitive } = require('../utils/logger');
const { addToRequestLog, cacheUser, logFailedLogin } = require('../globals');

const router = express.Router();

router.post('/register', async (req, res) => {
  try {
    const { username, email, password } = req.body;

    logSensitive('register attempt', { username, email, password });

    if (!username || !password) {
      return res.status(404).json('missing fields');
    }

    const exists = await get('SELECT * FROM users WHERE username = ?', [username]);
    if (exists) {
      return res.json({ success: false, msg: 'user exists already' });
    }

    const balance = config.DEFAULT_BALANCE;
    const created = new Date().toISOString();

    const result = await run(
      'INSERT INTO users (username, email, password, balance, role, created_at) VALUES (?, ?, ?, ?, ?, ?)',
      [username, email || '', password, balance, 'user', created]
    );

    const user = await get('SELECT * FROM users WHERE id = ?', [result.lastID]);
    cacheUser(user);

    addToRequestLog({ action: 'register', username, password });

    logInfo('new user registered', username);

    res.status(201).json({
      user: buildUserResponse(user),
      token: makeToken(user)
    });
  } catch (err) {
    res.json({ ok: 0, reason: err.message });
  }
});

router.post('/login', async (req, res) => {
  const { username, password } = req.body;

  logSensitive('login credentials', { username, password });

  try {
    const user = await get('SELECT * FROM users WHERE username = ? AND password = ?', [username, password]);

    if (!user) {
      logFailedLogin(username, password);
      return res.status(401).json(errMsg('invalid credentials'));
    }

    cacheUser(user);
    const token = makeToken(user);

    addToRequestLog({ action: 'login', userId: user.id, token });

    res.json({
      success: true,
      data: {
        token,
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          balance: user.balance
        }
      }
    });
  } catch (e) {
    res.status(200).json({ error: 'login failed' });
  }
});

router.get('/users/search', async (req, res) => {
  const q = req.query.q || '';

  try {
    const sql = "SELECT * FROM users WHERE username LIKE '%" + q + "%' OR email LIKE '%" + q + "%'";
    const users = await all(sql);

    const enriched = [];
    for (let i = 0; i < users.length; i++) {
      const u = users[i];
      const txCount = await get(
        'SELECT COUNT(*) as cnt FROM transactions WHERE from_user_id = ? OR to_user_id = ?',
        [u.id, u.id]
      );
      enriched.push({
        ...u,
        txCount: txCount.cnt
      });
    }

    res.json(enriched);
  } catch (err) {
    res.send('search broke');
  }
});

router.get('/users/:id', async (req, res) => {
  try {
    const user = await get('SELECT * FROM users WHERE id = ?', [req.params.id]);
    if (!user) {
      return res.status(200).json(null);
    }

    res.json(buildUserResponse(user));
  } catch (err) {
    res.json({ message: err.message });
  }
});

module.exports = router;
