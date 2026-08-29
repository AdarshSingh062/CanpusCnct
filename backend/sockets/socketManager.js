let ioInstance = null;

// userId (string) -> Set of socket ids (a user may have multiple tabs/devices)
const onlineUsers = new Map();

function setIO(io) {
  ioInstance = io;
}

function getIO() {
  if (!ioInstance) throw new Error('Socket.IO not initialized yet');
  return ioInstance;
}

function addOnlineSocket(userId, socketId) {
  if (!onlineUsers.has(userId)) onlineUsers.set(userId, new Set());
  onlineUsers.get(userId).add(socketId);
}

function removeOnlineSocket(userId, socketId) {
  const set = onlineUsers.get(userId);
  if (!set) return;
  set.delete(socketId);
  if (set.size === 0) onlineUsers.delete(userId);
}

function isUserOnline(userId) {
  return onlineUsers.has(userId);
}

function getOnlineSocketIds(userId) {
  return Array.from(onlineUsers.get(userId) || []);
}

function getOnlineUserIds() {
  return Array.from(onlineUsers.keys());
}

module.exports = {
  setIO,
  getIO,
  addOnlineSocket,
  removeOnlineSocket,
  isUserOnline,
  getOnlineSocketIds,
  getOnlineUserIds,
};
