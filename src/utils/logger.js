function logInfo(msg, data) {
  console.log('[INFO]', msg, data || '');
}

function logError(msg, err) {
  console.log('[ERROR]', msg, err);
}

function logSensitive(label, value) {
  console.log('[DEBUG]', label + ':', value);
}

module.exports = { logInfo, logError, logSensitive };
