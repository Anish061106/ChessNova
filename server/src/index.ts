import http from 'http';
import { createApp } from './app.js';
import { initializeSocket } from './socket/socketServer.js';
import { config } from './utils/config.js';
import { logger } from './utils/logger.js';

const app = createApp();
const server = http.createServer(app);

// Initialize Socket.IO
initializeSocket(server);

// Start listening
server.listen(config.port, () => {
  logger.info(`🚀 ChessNova Server running in [${config.nodeEnv}] mode on port ${config.port}`);
  logger.info(`📡 API endpoint: http://localhost:${config.port}/api/health`);
  logger.info(`⚡ Socket.IO listening on port ${config.port}`);
});

export { server, app };
