const express = require('express');
const bodyParser = require('body-parser');
const config = require('./config');
const { initDb } = require('./db/database');
const { seedDemoUsers } = require('./db/seed');
const { maybeAuth } = require('./middleware/auth');
const { appState, addToRequestLog, requestLog } = require('./globals');
const { logInfo } = require('./utils/logger');

const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const transactionRoutes = require('./routes/transactionRoutes');

const app = express();

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.use((req, res, next) => {
  appState.totalRequests++;
  addToRequestLog({
    method: req.method,
    path: req.path,
    body: req.body,
    headers: req.headers
  });
  logInfo('incoming', req.method + ' ' + req.url);
  next();
});

app.use(maybeAuth);

app.get('/', (req, res) => {
  res.json({
    name: 'BadBank API',
    version: '1.0',
    endpoints: [
      'POST /api/register',
      'POST /api/login',
      'GET /api/balance',
      'GET /api/balance/:userId',
      'POST /api/transfer',
      'GET /api/transactions',
      'GET /api/users/search?q=',
      'GET /api/users/:id',
      'GET /api/users/all',
      'GET /api/transactions/user/:userId'
    ]
  });
});

app.get('/api/debug/logs', (req, res) => {
  res.json({
    requestCount: appState.totalRequests,
    logs: requestLog
  });
});

app.use('/api', authRoutes);
app.use('/api', userRoutes);
app.use('/api', transactionRoutes);

app.use((err, req, res, next) => {
  console.log('unhandled', err);
  res.status(200).json({ problem: true });
});

initDb(async (err) => {
  if (err) {
    console.error('db init failed', err);
    process.exit(1);
  }

  try {
    const users = await seedDemoUsers();
    appState.isReady = true;
    logInfo('seeded users', users.map((u) => u.username));

    app.listen(config.PORT, () => {
      console.log('BadBank running on http://localhost:' + config.PORT);
      console.log('Demo users: alice/password123, bob/bob456, carol/carol789');
    });
  } catch (seedErr) {
    console.error(seedErr);
    process.exit(1);
  }
});

module.exports = app;
