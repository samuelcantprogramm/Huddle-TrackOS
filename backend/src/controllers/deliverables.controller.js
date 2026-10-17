const deliverableRepo = require('../repositories/deliverable.repository');
const { success, error } = require('../utils/response.utils');

async function listDeliverables(req, res, next) {
  try {
    const { status = 'all' } = req.query;
    const deliverables = await deliverableRepo.findAll(status);
    return success(res, deliverables);
  } catch (err) {
    next(err);
  }
}

async function getDeliverableById(req, res, next) {
  try {
    const deliverable = await deliverableRepo.findById(req.params.id);
    if (!deliverable) {
      return error(res, 'Deliverable not found', 404);
    }
    return success(res, deliverable);
  } catch (err) {
    next(err);
  }
}

async function submitDeliverable(req, res, next) {
  try {
    const { stageId, reportText, externalLink } = req.body;
    if (!stageId || !reportText) {
      return error(res, 'Stage ID and report text are required', 400);
    }

    const deliverableId = await deliverableRepo.submitDeliverable({
      stageId,
      submittedBy: req.user.id,
      submitterName: req.user.fullName,
      reportText,
      externalLink,
      file: req.file || null
    });

    const created = await deliverableRepo.findById(deliverableId);
    return success(res, created, 'Deliverable submitted for review', 201);
  } catch (err) {
    next(err);
  }
}

module.exports = {
  listDeliverables,
  getDeliverableById,
  submitDeliverable
};
