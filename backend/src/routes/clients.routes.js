const express = require('express');
const router = express.Router();
const clientsController = require('../controllers/clients.controller');
const { authenticate } = require('../middleware/auth.middleware');
const { requireRole } = require('../middleware/role.middleware');
const { validate } = require('../middleware/validation.middleware');
const { createClientSchema, updateClientSchema } = require('../validators/client.validator');

router.use(authenticate);

router.get('/', clientsController.listClients);
router.get('/:id', clientsController.getClientById);
router.post('/', requireRole(['admin']), validate(createClientSchema), clientsController.createClient);
router.patch('/:id', requireRole(['admin']), validate(updateClientSchema), clientsController.updateClient);
router.delete('/:id', requireRole(['admin']), clientsController.deleteClient);

module.exports = router;
