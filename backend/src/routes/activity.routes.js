const express = require('express');
const router = express.Router();
const activityController = require('../controllers/activity.controller');
const { authenticate } = require('../middleware/auth.middleware');

router.use(authenticate);

router.get('/', activityController.listActivity);
router.get('/export/json', activityController.exportJson);

module.exports = router;
