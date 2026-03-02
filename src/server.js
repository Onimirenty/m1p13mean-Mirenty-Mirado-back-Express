require('dotenv').config();
const http = require('http');
const app = require('./app');
const Utils = require('./utils/Utils');
const connectDB = require('./config/DataBase');
const logger = require('./utils/logger')
const { verifyCloudinaryConnection } = require('./config/Cloudinary');


const port = Utils.normalizePort(process.env.PORT || '3000');
app.set('port', port);

if (!process.env.JWT_SECRET) {
  console.error("CRITICAL ERROR: JWT_SECRET is not defined in .env file");
  process.exit(1);
}
if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
  console.error("CRITICAL ERROR: CLOUDINARY_* variables are not defined in .env file");
  process.exit(1);
}
(async () => {
  try {
    await connectDB();
    await verifyCloudinaryConnection();
    
    const server = http.createServer(app);
    server.on('error', Utils.errorHandler(server, port));
    server.on('listening', () => {
      const address = server.address();
      const bind =
        typeof address === 'string'
          ? 'pipe ' + address
          : 'port ' + port;
      logger.info('Listening on ' + bind);
    });
    server.listen(port);

  } catch (error) {
    console.error("Failed to start server:", error.message);
    process.exit(1);
  }
})();

