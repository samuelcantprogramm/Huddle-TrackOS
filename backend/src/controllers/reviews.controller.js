const reviewRepo = require('../repositories/review.repository');
const deliverableRepo = require('../repositories/deliverable.repository');
const { success, error } = require('../utils/response.utils');

async function createReview(req, res, next) {
  try {
    const { deliverableId, decision, feedback } = req.body;
    if (!deliverableId || !decision) {
      return error(res, 'Deliverable ID and decision are required', 400);
    }

    if (!['approved', 'revision_requested'].includes(decision)) {
      return error(res, 'Invalid decision. Must be "approved" or "revision_requested"', 400);
    }

    await reviewRepo.recordReview({
      deliverableId,
      reviewerId: req.user.id,
      reviewerName: req.user.fullName || 'Admin Reviewer',
      decision,
      feedback: feedback || ''
    });

    const updatedDeliverable = await deliverableRepo.findById(deliverableId);

    return success(res, updatedDeliverable, `Deliverable ${decision === 'approved' ? 'approved' : 'marked for revision'}`);
  } catch (err) {
    next(err);
  }
}

module.exports = {
  createReview
};
