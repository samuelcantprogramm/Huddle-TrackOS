const activityRepo = require('../repositories/activity.repository');
const { success } = require('../utils/response.utils');

async function listActivity(req, res, next) {
  try {
    const {
      type = 'all',
      actionType = 'all',
      va = 'all',
      client = 'all',
      search = '',
      limit = 50,
      offset = 0
    } = req.query;

    const filterType = actionType !== 'all' ? actionType : type;

    const result = await activityRepo.findAll({
      actionType: filterType,
      va,
      client,
      search,
      limit: parseInt(limit, 10) || 50,
      offset: parseInt(offset, 10) || 0
    });

    return success(res, result.data, 'Activity retrieved', 200, {
      total: result.total
    });
  } catch (err) {
    next(err);
  }
}

async function exportJson(req, res, next) {
  try {
    const data = await activityRepo.getAllForExport();
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', 'attachment; filename=vatrackos_audit_log.json');
    return res.status(200).send(JSON.stringify(data, null, 2));
  } catch (err) {
    next(err);
  }
}

module.exports = {
  listActivity,
  exportJson
};
