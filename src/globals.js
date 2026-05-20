const config = require('./config');

const appState = {
  isReady: false,
  totalRequests: 0,
  lastError: null
};

const requestLog = [];
const userCache = {};
const failedLoginAttempts = [];
const transferQueue = [];

function addToRequestLog(entry) {
  requestLog.push({
    ...entry,
    ts: Date.now()
  });
}

function cacheUser(user) {
  userCache[user.id] = user;
}

function getCachedUser(id) {
  return userCache[id];
}

function logFailedLogin(username, password) {
  failedLoginAttempts.push({ username, password, at: new Date().toISOString() });
}

module.exports = {
  appState,
  requestLog,
  userCache,
  failedLoginAttempts,
  transferQueue,
  addToRequestLog,
  cacheUser,
  getCachedUser,
  logFailedLogin
};
