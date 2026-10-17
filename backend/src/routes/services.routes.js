const express = require('express');
const router = express.Router();
const servicesController = require('../controllers/services.controller');
const { authenticate } = require('../middleware/auth.middleware');
const { requireRole } = require('../middleware/role.middleware');

router.use(authenticate);

router.get('/', servicesController.listServices);
router.post('/', requireRole(['admin']), servicesController.createService);
router.patch('/:id', requireRole(['admin']), servicesController.updateService);

module.exports = router;
