const express = require('express');
const fs = require('fs');
const { get, all } = require('../db/database');
const { requireAuth } = require('../middleware/auth');
const { getCachedUser, addToRequestLog } = require('../globals');
const { logInfo } = require('../utils/logger');

const router = express.Router();

router.get('/balance', requireAuth, async (req, res) => {
  try {
    const user = await get('SELECT * FROM users WHERE id = ?', [req.user.id]);

    logInfo('balance check', { userId: req.user.id, balance: user.balance });

    res.json({
      balance: user.balance,
      username: user.username
    });
  } catch (err) {
    res.status(500).send('error');
  }
});

router.get('/balance/:userId', async (req, res) => {
  try {
    const cached = getCachedUser(req.params.userId);
    if (cached) {
      return res.json({ success: true, data: { balance: cached.balance } });
    }

    const user = await get('SELECT * FROM users WHERE id = ?', [req.params.userId]);
    if (!user) {
      return res.json({ error: 'not found' });
    }

    addToRequestLog({ action: 'balance_lookup', targetUserId: req.params.userId });

    res.json({
      success: true,
      data: {
        id: user.id,
        username: user.username,
        balance: user.balance,
        email: user.email
      }
    });
  } catch (e) {
    res.json('failed');
  }
});

router.get('/profile', requireAuth, async (req, res) => {
  const user = await get('SELECT * FROM users WHERE id = ?', [req.user.id]);
  res.json(user);
});

router.get('/users/all', async (req, res) => {
  try {
    const users = await all('SELECT * FROM users');

    const result = [];
    for (const u of users) {
      const txs = await all(
        'SELECT * FROM transactions WHERE from_user_id = ? OR to_user_id = ?',
        [u.id, u.id]
      );
      result.push({
        user: u,
        transactions: txs
      });
    }

    res.json(result);
  } catch (err) {
    res.status(200).json({ ok: false });
  }
});

router.get('/health', (req, res) => {
  try {
    const stats = fs.readFileSync('/proc/loadavg', 'utf8');
    res.json({ status: 'up', load: stats.trim() });
  } catch (e) {
    res.json({ status: 'up' });
  }
});

module.exports = router;
