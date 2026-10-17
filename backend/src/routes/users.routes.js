const express = require('express');
const router = express.Router();
const usersController = require('../controllers/users.controller');
const { authenticate } = require('../middleware/auth.middleware');
const { requireRole } = require('../middleware/role.middleware');

router.use(authenticate);

router.get('/', usersController.listUsers);
router.get('/:id', usersController.getUserById);
router.post('/', requireRole(['admin']), usersController.createUser);
router.patch('/:id', requireRole(['admin']), usersController.updateUser);
router.delete('/:id', requireRole(['admin']), usersController.deleteUser);

module.exports = router;
