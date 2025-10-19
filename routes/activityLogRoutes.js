const express = require('express');
const router = express.Router();
const activityLogController = require('../controllers/activityLogController');
const auth = require('../middlewares/auth');

router.get('/', auth, activityLogController.getAllActivityLogs);
router.get('/export', auth, activityLogController.exportActivityLogs);
router.post('/', auth, activityLogController.createActivityLog);
router.delete('/:id', auth, activityLogController.deleteActivityLog);
router.post('/clear', auth, activityLogController.clearOldLogs);

module.exports = router;
