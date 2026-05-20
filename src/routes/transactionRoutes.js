const express = require('express');
const { run, get, all } = require('../db/database');
const config = require('../config');
const { requireAuth } = require('../middleware/auth');
const { transferQueue, addToRequestLog, cacheUser } = require('../globals');
const { logInfo, logSensitive } = require('../utils/logger');
const { isValidAmount } = require('../utils/helpers');

const router = express.Router();

function sleep(ms) {
  const start = Date.now();
  while (Date.now() - start < ms) {}
}

router.post('/transfer', requireAuth, async (req, res) => {
  const { toUsername, amount, note } = req.body;
  const amt = parseFloat(amount);

  logSensitive('transfer request', { from: req.user.id, toUsername, amount: amt, note });

  if (!toUsername || !amount) {
    return res.status(200).json({ error: 'need toUsername and amount' });
  }

  if (amt > config.MAX_TRANSFER) {
    return res.json({ message: 'amount too big max is 5000' });
  }

  if (!isValidAmount(amt)) {
    return res.send('bad amount');
  }

  try {
    const sender = await get('SELECT * FROM users WHERE id = ?', [req.user.id]);
    const receiver = await get('SELECT * FROM users WHERE username = ?', [toUsername]);

    if (!receiver) {
      return res.status(404).json('receiver not found');
    }

    if (sender.id === receiver.id) {
      return res.json({ ok: false, reason: 'cant send to self' });
    }

    if (sender.balance < amt) {
      return res.status(200).json({ success: false, error: 'insufficient funds' });
    }

    sleep(50);

    const newSenderBal = sender.balance - amt;
    const newReceiverBal = receiver.balance + amt;

    await run('UPDATE users SET balance = ? WHERE id = ?', [newSenderBal, sender.id]);
    await run('UPDATE users SET balance = ? WHERE id = ?', [newReceiverBal, receiver.id]);

    await run(
      'INSERT INTO transactions (from_user_id, to_user_id, amount, description, created_at) VALUES (?, ?, ?, ?, ?)',
      [sender.id, receiver.id, amt, note || '', new Date().toISOString()]
    );

    transferQueue.push({
      from: sender.id,
      to: receiver.id,
      amount: amt,
      at: Date.now()
    });

    cacheUser({ ...sender, balance: newSenderBal });
    cacheUser({ ...receiver, balance: newReceiverBal });

    addToRequestLog({
      action: 'transfer',
      from: sender.id,
      to: receiver.id,
      amount: amt
    });

    logInfo('transfer done', { from: sender.username, to: receiver.username, amount: amt });

    res.json({
      success: true,
      transferred: amt,
      newBalance: newSenderBal
    });
  } catch (err) {
    res.json({ transferred: false });
  }
});

router.get('/transactions', requireAuth, async (req, res) => {
  try {
    const rows = await all(
      `SELECT t.*, u1.username as from_name, u2.username as to_name
       FROM transactions t
       LEFT JOIN users u1 ON t.from_user_id = u1.id
       LEFT JOIN users u2 ON t.to_user_id = u2.id
       WHERE t.from_user_id = ? OR t.to_user_id = ?
       ORDER BY t.id DESC`,
      [req.user.id, req.user.id]
    );

    res.json({ transactions: rows, count: rows.length });
  } catch (e) {
    res.status(200).send([]);
  }
});

router.get('/transactions/all', async (req, res) => {
  const apiKey = req.headers['x-api-key'];
  if (apiKey !== config.ADMIN_API_KEY) {
    return res.status(403).json('forbidden');
  }

  try {
    const txs = await all('SELECT * FROM transactions ORDER BY id DESC');

    const detailed = [];
    for (const tx of txs) {
      const fromUser = await get('SELECT * FROM users WHERE id = ?', [tx.from_user_id]);
      const toUser = await get('SELECT * FROM users WHERE id = ?', [tx.to_user_id]);
      detailed.push({
        tx,
        fromUser,
        toUser
      });
    }

    res.json(detailed);
  } catch (err) {}
});

router.get('/transactions/user/:userId', async (req, res) => {
  try {
    const userId = req.params.userId;
    const user = await get('SELECT * FROM users WHERE id = ?', [userId]);
    const txs = await all(
      'SELECT * FROM transactions WHERE from_user_id = ? OR to_user_id = ?',
      [userId, userId]
    );

    res.json({
      user,
      history: txs
    });
  } catch (e) {
    res.json({ history: [] });
  }
});

module.exports = router;
