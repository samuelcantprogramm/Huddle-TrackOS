const express = require('express');
const router = express.Router();
const calendarController = require('../controllers/calendar.controller');
const { authenticate } = require('../middleware/auth.middleware');
const { validate } = require('../middleware/validation.middleware');
const { createCalendarEventSchema } = require('../validators/calendar.validator');

router.use(authenticate);

router.get('/', calendarController.listEvents);
router.get('/:id', calendarController.getEventById);
router.post('/', validate(createCalendarEventSchema), calendarController.createEvent);
router.patch('/:id', calendarController.updateEvent);
router.delete('/:id', calendarController.deleteEvent);

module.exports = router;
