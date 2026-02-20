require('dotenv').config();
const http = require('http');
const app = require('./app');
const Utils = require('./utils/Utils');
const connectDB = require('./config/DataBase');

const port = Utils.normalizePort(process.env.PORT || '3000');
app.set('port', port);

if (!process.env.JWT_SECRET) {
  console.error("CRITICAL ERROR: JWT_SECRET is not defined in .env file");
  process.exit(1);
}

(async () => {
  try {
    await connectDB();
    const server = http.createServer(app);
    server.on('error', Utils.errorHandler(server, port));
    server.on('listening', () => {
      const address = server.address();
      const bind =
        typeof address === 'string'
          ? 'pipe ' + address
          : 'port ' + port;
      console.log('Listening on ' + bind);
    });
    server.listen(port);

  } catch (error) {
    console.error("Failed to start server:", error.message);
    process.exit(1);
  }
})();