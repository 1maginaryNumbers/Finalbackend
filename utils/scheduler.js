const cron = require('node-cron');
const ActivityLog = require('../models/activityLog');

const clearOldActivityLogs = async () => {
  try {
    const cutoffDate = new Date();
    cutoffDate.setMonth(cutoffDate.getMonth() - 1);
    cutoffDate.setDate(1);
    cutoffDate.setHours(0, 0, 0, 0);
    
    const result = await ActivityLog.deleteMany({
      timestamp: { $lt: cutoffDate }
    });
    
    console.log(`[SCHEDULER] Cleared ${result.deletedCount} activity logs older than 1 month (before ${cutoffDate.toISOString()})`);
  } catch (error) {
    console.error('[SCHEDULER] Error clearing old activity logs:', error.message);
  }
};

const startScheduler = () => {
  console.log('[SCHEDULER] Starting activity log cleanup scheduler...');
  
  cron.schedule('0 2 1 * *', async () => {
    console.log('[SCHEDULER] Running monthly activity log cleanup...');
    await clearOldActivityLogs();
  }, {
    scheduled: true,
    timezone: "Asia/Jakarta"
  });
  
  console.log('[SCHEDULER] Activity log cleanup scheduled to run monthly on the 1st at 2:00 AM Jakarta time');
};

module.exports = {
  startScheduler,
  clearOldActivityLogs
};
