const logger = require('./logger')

const normalizePort = (val) => {
  const port = parseInt(val, 10);

  if (isNaN(port)) return val;
  if (port >= 0) return port;
  return false;
};

const errorHandler = (server, port) => (error) => {
  if (error.syscall !== 'listen') {
    throw error;
  }

  const address = server.address();
  const bind =
    typeof address === 'string'
      ? 'pipe ' + address
      : 'port ' + port;

  switch (error.code) {
    case 'EACCES':
      console.error(bind + ' requires elevated privileges.');
      process.exit(1);
      break;
    case 'EADDRINUSE':
      console.error(bind + ' is already in use.');
      process.exit(1);
      break;
    default:
      throw error;
  }
};
const fs = require('fs/promises');
const path = require("path");

function formatTimestamp(timestamp) {
  const date = new Date(timestamp);

  const ss = String(date.getSeconds()).padStart(2, '0');
  const mm = String(date.getMinutes()).padStart(2, '0');
  const hh = String(date.getHours()).padStart(2, '0');
  const jj = String(date.getDate()).padStart(2, '0');
  const MM = String(date.getMonth() + 1).padStart(2, '0'); // +1 car 0-11
  const YY = String(date.getFullYear()).slice(-2);

  return `${jj}-${MM}-${YY}_${hh}h-${mm}m-${ss}s`;
}


async function writeJsonFile(dirPath, filename, fileExtension, ObjectData) {
  try {
    let fileExtensionWithDot = fileExtension.startsWith('.') ? fileExtension : `.${fileExtension}`;
    const fullPath = path.join(dirPath, filename + fileExtensionWithDot);
    await fs.writeFile(
      fullPath,
      JSON.stringify(ObjectData, null, 2),
      'utf8'
    );
    logger.info('Fichier écrit avec succès');
  } catch (error) {
    logger.error('Erreur :', error);
  }
}

module.exports = {
  normalizePort,
  errorHandler,
  writeJsonFile,
  formatTimestamp
};