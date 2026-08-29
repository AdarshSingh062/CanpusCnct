require('dotenv').config();
const http = require('http');
const { Server } = require('socket.io');

const app = require('./app');
const connectDB = require('./config/db');
const initChatSocket = require('./sockets/chatSocket');

const PORT = process.env.PORT || 5000;

connectDB();

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    credentials: true,
  },
});

initChatSocket(io);

server.listen(PORT, () => {
  console.log(`[Server] CampusConnect API running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
});

// Guard rails so an unexpected error doesn't silently kill the process.
process.on('unhandledRejection', (err) => {
  console.error(`[UnhandledRejection] ${err.message}`);
  server.close(() => process.exit(1));
});
