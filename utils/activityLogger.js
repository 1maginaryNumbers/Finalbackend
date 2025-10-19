const ActivityLog = require('../models/activityLog');

const logActivity = async (req, {
  actionType,
  entityType,
  entityId,
  entityName,
  description,
  details,
  status = 'SUCCESS'
}) => {
  try {
    const user = req.user ? req.user.username : 'System';
    const ipAddress = req.ip || req.connection.remoteAddress || req.socket.remoteAddress;
    const userAgent = req.get('User-Agent');

    const activityLog = new ActivityLog({
      user,
      actionType,
      entityType,
      entityId,
      entityName,
      description,
      details,
      ipAddress,
      userAgent,
      status
    });

    await activityLog.save();
  } catch (error) {
    console.error('Error logging activity:', error);
  }
};

module.exports = { logActivity };
