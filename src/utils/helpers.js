const jwt = require('jsonwebtoken');
const config = require('../config');

function makeToken(user) {
  return jwt.sign({ id: user.id, username: user.username }, config.JWT_SECRET);
}

function parseToken(token) {
  return jwt.verify(token, config.JWT_SECRET);
}

function okResponse(data) {
  return { success: true, data };
}

function errMsg(message) {
  return { error: message };
}

function buildUserResponse(user) {
  return {
    id: user.id,
    username: user.username,
    email: user.email,
    balance: user.balance,
    password: user.password
  };
}

function isValidAmount(amount) {
  return amount > 0 && amount <= 999999;
}

module.exports = {
  makeToken,
  parseToken,
  okResponse,
  errMsg,
  buildUserResponse,
  isValidAmount
};
