const fs = require('fs');
const path = require('path');
const winston = require('winston');

// Création dossier logs si absent
const logDir = path.join(__dirname, '../logs');
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir);
}

const logger = winston.createLogger({
  level: 'info',

  format: winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.errors({ stack: true }),
    winston.format.printf(({ timestamp, level, message, stack }) => {
      return stack
        ? `[${timestamp}] ${level.toUpperCase()} : ${message}\n${stack}`
        : `[${timestamp}] ${level.toUpperCase()} : ${message}`;
    })
  ),

  transports: [
    // Log général
    new winston.transports.File({
      filename: path.join(logDir, 'logger.log'),
      level: 'info'
    }),

    // Log erreurs uniquement
    new winston.transports.File({
      filename: path.join(logDir, 'error.log'),
      level: 'error'
    })
  ]
});

// Console en dev
if (process.env.NODE_ENV !== 'production') {
  logger.add(
    new winston.transports.Console({
      format: winston.format.simple()
    })
  );
}

module.exports = logger;