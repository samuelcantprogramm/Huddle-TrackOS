const pingRepo = require('../repositories/ping.repository');
const activityRepo = require('../repositories/activity.repository');
const { success, error } = require('../utils/response.utils');

async function listPings(req, res, next) {
  try {
    const isVa = req.user.role === 'va';
    const targetVa = isVa ? req.user.fullName : (req.query.va || null);
    const targetId = isVa ? req.user.id : null;

    const pings = await pingRepo.findForUser(targetVa, targetId);
    return success(res, pings);
  } catch (err) {
    next(err);
  }
}

async function getUnreadCount(req, res, next) {
  try {
    const isVa = req.user.role === 'va';
    const targetVa = isVa ? req.user.fullName : (req.query.va || null);
    const targetId = isVa ? req.user.id : null;

    const unreadCount = await pingRepo.getUnreadCount(targetVa, targetId);
    return success(res, { unreadCount });
  } catch (err) {
    next(err);
  }
}

async function createPing(req, res, next) {
  try {
    const { clientId, stageId, targetVaName, message, isUrgent = false } = req.body;

    const ping = await pingRepo.create({
      clientId,
      stageId,
      senderId: req.user.id,
      targetVaName,
      message,
      isUrgent
    });

    // Record activity
    await activityRepo.record({
      actorId: req.user.id,
      actorName: req.user.fullName || 'Admin',
      actorRole: req.user.role || 'admin',
      actionType: 'ping',
      clientId: ping.clientId ? parseInt(String(ping.clientId).replace('cli-', ''), 10) : null,
      clientName: ping.clientName || 'General Pipeline',
      stageName: ping.stageName || null,
      targetVa: targetVaName,
      title: `Ping sent to ${targetVaName}`,
      summary: `Admin pinged ${targetVaName} with message: "${message.slice(0, 80)}${message.length > 80 ? '...' : ''}"`,
      details: message
    });

    return success(res, ping, 'Ping sent successfully', 201);
  } catch (err) {
    next(err);
  }
}

async function markAsRead(req, res, next) {
  try {
    const updated = await pingRepo.markAsRead(req.params.id);
    if (!updated) {
      return error(res, 'Ping alert not found', 404);
    }
    return success(res, null, 'Marked as read');
  } catch (err) {
    next(err);
  }
}

module.exports = {
  listPings,
  getUnreadCount,
  createPing,
  markAsRead
};
