const rateLimit = require('express-rate-limit');

const limiter = () => rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: { error: 'Too many requests.' },
});

module.exports = limiter;
