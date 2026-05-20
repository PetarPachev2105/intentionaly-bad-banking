# BadBank API

A mini banking backend for interview training and code review exercises.

## Setup

```bash
npm install
npm start
```

The server starts on `http://localhost:3131`.

Demo users are created automatically on first run:

| Username | Password    | Starting balance |
|----------|-------------|------------------|
| alice    | password123 | 2500             |
| bob      | bob456      | 1800             |
| carol    | carol789    | 3200             |

## Sample API Endpoints

### Register

```bash
curl -X POST http://localhost:3000/api/register \
  -H "Content-Type: application/json" \
  -d '{"username":"dave","email":"dave@bank.com","password":"secret99"}'
```

### Login

```bash
curl -X POST http://localhost:3000/api/login \
  -H "Content-Type: application/json" \
  -d '{"username":"alice","password":"password123"}'
```

Save the `token` from the response for authenticated requests.

### Check balance (authenticated)

```bash
curl http://localhost:3000/api/balance \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

### Check balance by user ID

```bash
curl http://localhost:3000/api/balance/1
```

### Transfer money

```bash
curl -X POST http://localhost:3000/api/transfer \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -d '{"toUsername":"bob","amount":100,"note":"Lunch"}'
```

### View transaction history

```bash
curl http://localhost:3000/api/transactions \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

### Search users

```bash
curl "http://localhost:3000/api/users/search?q=al"
```

### Get user by ID

```bash
curl http://localhost:3000/api/users/1
```

### List all users with transactions

```bash
curl http://localhost:3000/api/users/all
```

### View any user's transaction history

```bash
curl http://localhost:3000/api/transactions/user/2
```

### Health check

```bash
curl http://localhost:3000/api/health
```
