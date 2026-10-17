const express = require('express');
const router = express.Router();
const reviewsController = require('../controllers/reviews.controller');
const { authenticate } = require('../middleware/auth.middleware');
const { requireRole } = require('../middleware/role.middleware');

router.use(authenticate);

// Only admins are authorized to approve deliverables or request revisions
router.post('/', requireRole(['admin']), reviewsController.createReview);

module.exports = router;
