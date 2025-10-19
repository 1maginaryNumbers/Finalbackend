const cron = require('node-cron');
const ActivityLog = require('../models/activityLog');

const clearOldActivityLogs = async () => {
  try {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - 30);
    
    const result = await ActivityLog.deleteMany({
      timestamp: { $lt: cutoffDate }
    });
    
    console.log(`[SCHEDULER] Cleared ${result.deletedCount} activity logs older than 30 days`);
  } catch (error) {
    console.error('[SCHEDULER] Error clearing old activity logs:', error.message);
  }
};

const startScheduler = () => {
  console.log('[SCHEDULER] Starting activity log cleanup scheduler...');
  
  cron.schedule('0 2 * * *', async () => {
    console.log('[SCHEDULER] Running daily activity log cleanup...');
    await clearOldActivityLogs();
  }, {
    scheduled: true,
    timezone: "Asia/Jakarta"
  });
  
  console.log('[SCHEDULER] Activity log cleanup scheduled to run daily at 2:00 AM Jakarta time');
};

module.exports = {
  startScheduler,
  clearOldActivityLogs
};
