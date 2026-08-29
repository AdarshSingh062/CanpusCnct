const ActivityLog = require('../models/ActivityLog');

/** Fire-and-forget activity logger — never throws into the request path. */
const logActivity = async (userId, action, description, meta = {}) => {
  try {
    await ActivityLog.create({ user: userId, action, description, meta });
  } catch (err) {
    console.error('[ActivityLog] failed to record:', err.message);
  }
};

module.exports = logActivity;
