const crypto = require('crypto');

module.exports = () => crypto.randomBytes(3).toString('hex').toUpperCase();
