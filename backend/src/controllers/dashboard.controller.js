const clientRepo = require('../repositories/client.repository');
const { success } = require('../utils/response.utils');

async function getMetrics(req, res, next) {
  try {
    const isVa = req.user.role === 'va';
    const currentVaUser = isVa ? req.user.fullName : null;
    const metrics = await clientRepo.getDashboardMetrics(currentVaUser);
    return success(res, metrics);
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getMetrics
};
