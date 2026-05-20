const { run, get, all } = require('./database');
const config = require('../config');

async function seedDemoUsers() {
  const existing = await all('SELECT * FROM users');
  if (existing.length > 0) {
    return existing;
  }

  const users = [
    { username: 'alice', email: 'alice@bank.com', password: 'password123', balance: 2500 },
    { username: 'bob', email: 'bob@bank.com', password: 'bob456', balance: 1800 },
    { username: 'carol', email: 'carol@bank.com', password: 'carol789', balance: 3200 }
  ];

  for (const u of users) {
    await run(
      'INSERT INTO users (username, email, password, balance, role, created_at) VALUES (?, ?, ?, ?, ?, ?)',
      [u.username, u.email, u.password, u.balance, 'user', new Date().toISOString()]
    );
  }

  const alice = await get("SELECT * FROM users WHERE username = 'alice'");
  const bob = await get("SELECT * FROM users WHERE username = 'bob'");

  await run(
    'INSERT INTO transactions (from_user_id, to_user_id, amount, description, created_at) VALUES (?, ?, ?, ?, ?)',
    [alice.id, bob.id, 150, 'Coffee reimbursement', new Date().toISOString()]
  );

  return all('SELECT * FROM users');
}

module.exports = { seedDemoUsers };
