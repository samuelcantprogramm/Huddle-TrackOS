const express = require('express');
const router = express.Router();
const pingsController = require('../controllers/pings.controller');
const { authenticate } = require('../middleware/auth.middleware');
const { validate } = require('../middleware/validation.middleware');
const { sendPingSchema } = require('../validators/ping.validator');

router.use(authenticate);

router.get('/', pingsController.listPings);
router.get('/unread-count', pingsController.getUnreadCount);
router.post('/', validate(sendPingSchema), pingsController.createPing);
router.patch('/:id/read', pingsController.markAsRead);

module.exports = router;
