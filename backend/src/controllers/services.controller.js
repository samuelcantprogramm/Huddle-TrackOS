const serviceRepo = require('../repositories/service.repository');
const { success, error } = require('../utils/response.utils');

async function listServices(req, res, next) {
  try {
    const services = await serviceRepo.findAll();
    return success(res, services);
  } catch (err) {
    next(err);
  }
}

async function createService(req, res, next) {
  try {
    const { serviceName, description, isActive = true } = req.body;
    if (!serviceName) {
      return error(res, 'Service name is required', 400);
    }
    const slug = serviceName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    const service = await serviceRepo.create({ serviceName, slug, description, isActive });
    return success(res, service, 'Service created successfully', 201);
  } catch (err) {
    next(err);
  }
}

async function updateService(req, res, next) {
  try {
    const updated = await serviceRepo.update(req.params.id, req.body);
    if (!updated) {
      return error(res, 'Service not found or no changes made', 404);
    }
    return success(res, updated, 'Service updated successfully');
  } catch (err) {
    next(err);
  }
}

module.exports = {
  listServices,
  createService,
  updateService
};
