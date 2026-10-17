const clientRepo = require('../repositories/client.repository');
const activityRepo = require('../repositories/activity.repository');
const { success, error } = require('../utils/response.utils');

async function listClients(req, res, next) {
  try {
    const {
      search = '',
      service = 'all',
      va = 'all',
      status = 'all',
      sortBy = 'date-desc',
      page = 1,
      pageSize = 5
    } = req.query;

    const result = await clientRepo.findAll({
      search,
      service,
      va,
      status,
      sortBy,
      page: parseInt(page, 10) || 1,
      pageSize: parseInt(pageSize, 10) || 5
    });

    return success(res, result.items, 'Clients retrieved', 200, {
      pagination: {
        page: result.page,
        pageSize: result.pageSize,
        total: result.total,
        totalPages: result.totalPages
      }
    });
  } catch (err) {
    next(err);
  }
}

async function getClientById(req, res, next) {
  try {
    const client = await clientRepo.findById(req.params.id);
    if (!client) {
      return error(res, 'Client not found', 404);
    }
    return success(res, client);
  } catch (err) {
    next(err);
  }
}

async function createClient(req, res, next) {
  try {
    const createdBy = req.user ? req.user.id : null;
    const newClientId = await clientRepo.createClientWithStages(req.body, createdBy);
    const client = await clientRepo.findById(newClientId);

    // Record lifecycle activity
    await activityRepo.record({
      actorId: createdBy,
      actorName: req.user ? req.user.fullName : 'Administrator',
      actorRole: req.user ? req.user.role : 'admin',
      actionType: 'lifecycle',
      clientId: client.numericId,
      clientName: client.name,
      title: `New Client Created: ${client.name}`,
      summary: `Client account created under ${client.serviceType} with ${client.stages.length} workflow stages.`,
      details: client.notes || 'Pipeline initialised.'
    });

    return success(res, client, 'Client created successfully', 201);
  } catch (err) {
    next(err);
  }
}

async function updateClient(req, res, next) {
  try {
    const client = await clientRepo.findById(req.params.id);
    if (!client) {
      return error(res, 'Client not found', 404);
    }

    await clientRepo.updateClientWithStages(req.params.id, req.body);
    const updated = await clientRepo.findById(req.params.id);

    await activityRepo.record({
      actorId: req.user ? req.user.id : null,
      actorName: req.user ? req.user.fullName : 'Administrator',
      actorRole: req.user ? req.user.role : 'admin',
      actionType: 'lifecycle',
      clientId: updated.numericId,
      clientName: updated.name,
      title: `Client Updated: ${updated.name}`,
      summary: `Client details and pipeline stages were updated by ${req.user ? req.user.fullName : 'Admin'}.`
    });

    return success(res, updated, 'Client updated successfully');
  } catch (err) {
    next(err);
  }
}

async function deleteClient(req, res, next) {
  try {
    const client = await clientRepo.findById(req.params.id);
    if (!client) {
      return error(res, 'Client not found', 404);
    }

    await clientRepo.remove(req.params.id);

    await activityRepo.record({
      actorId: req.user ? req.user.id : null,
      actorName: req.user ? req.user.fullName : 'Administrator',
      actorRole: req.user ? req.user.role : 'admin',
      actionType: 'lifecycle',
      clientId: client.numericId,
      clientName: client.name,
      title: `Client Removed: ${client.name}`,
      summary: `Client pipeline for ${client.name} was removed from the system.`
    });

    return success(res, null, 'Client deleted successfully');
  } catch (err) {
    next(err);
  }
}

module.exports = {
  listClients,
  getClientById,
  createClient,
  updateClient,
  deleteClient
};
