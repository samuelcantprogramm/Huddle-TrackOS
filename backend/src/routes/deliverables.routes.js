const express = require('express');
const router = express.Router();
const deliverablesController = require('../controllers/deliverables.controller');
const { authenticate } = require('../middleware/auth.middleware');
const { upload } = require('../middleware/upload.middleware');

router.use(authenticate);

router.get('/', deliverablesController.listDeliverables);
router.get('/:id', deliverablesController.getDeliverableById);

// Middleware to accept either 'proofFile' or 'file'
const uploadProofMiddleware = (req, res, next) => {
  upload.fields([{ name: 'proofFile', maxCount: 1 }, { name: 'file', maxCount: 1 }])(req, res, (err) => {
    if (err) return next(err);
    if (req.files) {
      if (req.files.proofFile && req.files.proofFile.length > 0) {
        req.file = req.files.proofFile[0];
      } else if (req.files.file && req.files.file.length > 0) {
        req.file = req.files.file[0];
      }
    }
    next();
  });
};

router.post('/submit', uploadProofMiddleware, deliverablesController.submitDeliverable);

module.exports = router;
