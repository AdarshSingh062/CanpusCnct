const Notification = require('../models/Notification');
const { getIO, getOnlineSocketIds } = require('../sockets/socketManager');

/**
 * Creates a notification in the DB and pushes it in real time to the
 * recipient's connected sockets (if any). Safe to call even if the
 * recipient is offline — it will just be waiting for them on next login.
 */
const notify = async ({ recipient, sender = null, type, message, link = '', meta = {} }) => {
  if (recipient?.toString() === sender?.toString()) return null; // don't notify yourself

  const notification = await Notification.create({ recipient, sender, type, message, link, meta });

  try {
    const io = getIO();
    const socketIds = getOnlineSocketIds(recipient.toString());
    socketIds.forEach((socketId) => {
      io.to(socketId).emit('notification:new', notification);
    });
  } catch (err) {
    // Socket layer may not be initialized (e.g. in tests) — that's fine.
  }

  return notification;
};

module.exports = notify;
