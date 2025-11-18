const ActivityLog = require('../models/activityLog');

const getClientIp = (req) => {
  const forwarded = req.headers['x-forwarded-for'];
  if (forwarded) {
    const ips = forwarded.split(',');
    return ips[0].trim();
  }
  
  const realIp = req.headers['x-real-ip'];
  if (realIp) {
    return realIp.trim();
  }
  
  if (req.ip) {
    return req.ip;
  }
  
  if (req.connection && req.connection.remoteAddress) {
    return req.connection.remoteAddress;
  }
  
  if (req.socket && req.socket.remoteAddress) {
    return req.socket.remoteAddress;
  }
  
  return 'Unknown';
};

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
    const user = req.user ? req.user.username : (req.admin ? req.admin.username : 'System');
    const ipAddress = getClientIp(req);
    const userAgent = req.get('User-Agent') || 'Unknown';

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
