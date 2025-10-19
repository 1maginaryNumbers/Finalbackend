const ActivityLog = require('../models/activityLog');

exports.getAllActivityLogs = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 40;
    const skip = (page - 1) * limit;
    
    const totalLogs = await ActivityLog.countDocuments();
    const totalPages = Math.ceil(totalLogs / limit);
    
    const logs = await ActivityLog.find()
      .sort({ timestamp: -1 })
      .skip(skip)
      .limit(limit);
    
    res.json({
      logs,
      pagination: {
        currentPage: page,
        totalPages: totalPages,
        totalLogs: totalLogs,
        logsPerPage: limit,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1
      }
    });
  } catch (err) {
    res.status(500).json({
      message: "Error fetching activity logs",
      error: err.message
    });
  }
};

exports.getActivityLogsByUser = async (req, res) => {
  try {
    const { username } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;
    
    const totalLogs = await ActivityLog.countDocuments({ user: username });
    const totalPages = Math.ceil(totalLogs / limit);
    
    const logs = await ActivityLog.find({ user: username })
      .sort({ timestamp: -1 })
      .skip(skip)
      .limit(limit);
    
    res.json({
      logs,
      pagination: {
        currentPage: page,
        totalPages: totalPages,
        totalLogs: totalLogs,
        logsPerPage: limit,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1
      }
    });
  } catch (err) {
    res.status(500).json({
      message: "Error fetching user activity logs",
      error: err.message
    });
  }
};

exports.getActivityLogsByEntity = async (req, res) => {
  try {
    const { entityType, entityId } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;
    
    const query = { entityType: entityType.toUpperCase() };
    if (entityId && entityId !== 'all') {
      query.entityId = entityId;
    }
    
    const totalLogs = await ActivityLog.countDocuments(query);
    const totalPages = Math.ceil(totalLogs / limit);
    
    const logs = await ActivityLog.find(query)
      .sort({ timestamp: -1 })
      .skip(skip)
      .limit(limit);
    
    res.json({
      logs,
      pagination: {
        currentPage: page,
        totalPages: totalPages,
        totalLogs: totalLogs,
        logsPerPage: limit,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1
      }
    });
  } catch (err) {
    res.status(500).json({
      message: "Error fetching entity activity logs",
      error: err.message
    });
  }
};

exports.createActivityLog = async (req, res) => {
  try {
    const {
      user,
      actionType,
      entityType,
      entityId,
      entityName,
      description,
      details,
      ipAddress,
      userAgent,
      status = 'SUCCESS'
    } = req.body;

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
    res.status(201).json(activityLog);
  } catch (err) {
    res.status(500).json({
      message: "Error creating activity log",
      error: err.message
    });
  }
};

exports.deleteActivityLog = async (req, res) => {
  try {
    const { id } = req.params;
    await ActivityLog.findByIdAndDelete(id);
    res.json({ message: "Activity log deleted successfully" });
  } catch (err) {
    res.status(500).json({
      message: "Error deleting activity log",
      error: err.message
    });
  }
};

exports.exportActivityLogs = async (req, res) => {
  try {
    const { format = 'csv', startDate, endDate, actionType, entityType } = req.query;
    
    let query = {};
    
    if (startDate && endDate) {
      query.timestamp = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }
    
    if (actionType) {
      query.actionType = actionType;
    }
    
    if (entityType) {
      query.entityType = entityType;
    }
    
    const logs = await ActivityLog.find(query)
      .sort({ timestamp: -1 });
    
    if (format === 'csv') {
      const csvHeader = 'Timestamp,User,Action Type,Entity Type,Entity Name,Description,Status,IP Address\n';
      const csvData = logs.map(log => {
        const timestamp = new Date(log.timestamp).toISOString();
        const user = (log.user || '').replace(/,/g, ';');
        const actionType = (log.actionType || '').replace(/,/g, ';');
        const entityType = (log.entityType || '').replace(/,/g, ';');
        const entityName = (log.entityName || '').replace(/,/g, ';');
        const description = (log.description || '').replace(/,/g, ';');
        const status = (log.status || '').replace(/,/g, ';');
        const ipAddress = (log.ipAddress || '').replace(/,/g, ';');
        
        return `${timestamp},${user},${actionType},${entityType},${entityName},${description},${status},${ipAddress}`;
      }).join('\n');
      
      const csvContent = csvHeader + csvData;
      
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="activity_logs_${new Date().toISOString().split('T')[0]}.csv"`);
      res.send(csvContent);
    } else if (format === 'json') {
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', `attachment; filename="activity_logs_${new Date().toISOString().split('T')[0]}.json"`);
      res.json(logs);
    } else {
      res.status(400).json({ message: 'Invalid format. Supported formats: csv, json' });
    }
  } catch (err) {
    res.status(500).json({
      message: "Error exporting activity logs",
      error: err.message
    });
  }
};

exports.clearOldLogs = async (req, res) => {
  try {
    const { days = 30 } = req.body;
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);
    
    const result = await ActivityLog.deleteMany({
      timestamp: { $lt: cutoffDate }
    });
    
    res.json({
      message: `Cleared ${result.deletedCount} activity logs older than ${days} days`
    });
  } catch (err) {
    res.status(500).json({
      message: "Error clearing old activity logs",
      error: err.message
    });
  }
};
