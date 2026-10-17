const calendarRepo = require('../repositories/calendar.repository');
const clientRepo = require('../repositories/client.repository');
const { success, error } = require('../utils/response.utils');

async function listEvents(req, res, next) {
  try {
    const events = await calendarRepo.findAll();
    
    // Also retrieve all clients to automatically surface project deadlines on the calendar
    const allClientsResult = await clientRepo.findAll({ pageSize: 500 });
    const clientList = allClientsResult.data || [];

    // Map existing event titles or clientIds to avoid duplication
    const existingClientIds = new Set(events.filter(e => e.clientId).map(e => e.clientId));

    const combinedEvents = [...events];

    clientList.forEach(c => {
      if (c.deadline && !existingClientIds.has(c.id)) {
        combinedEvents.push({
          id: `dl-${c.id}`,
          numericId: c.numericId,
          title: `${c.name} Deadline`,
          description: `Deliverable milestone for ${c.serviceType}`,
          date: c.deadline,
          startDate: c.deadline,
          endDate: null,
          type: 'deadline',
          clientId: c.id,
          clientName: c.name,
          serviceType: c.serviceType,
          isSystemDeadline: true
        });
      }
    });

    return success(res, combinedEvents);
  } catch (err) {
    next(err);
  }
}

async function getEventById(req, res, next) {
  try {
    const event = await calendarRepo.findById(req.params.id);
    if (!event) {
      return error(res, 'Calendar event not found', 404);
    }
    return success(res, event);
  } catch (err) {
    next(err);
  }
}

async function createEvent(req, res, next) {
  try {
    const createdBy = req.user ? req.user.id : null;
    const event = await calendarRepo.create({
      ...req.body,
      createdBy
    });
    return success(res, event, 'Calendar event created', 201);
  } catch (err) {
    next(err);
  }
}

async function updateEvent(req, res, next) {
  try {
    const updated = await calendarRepo.update(req.params.id, req.body);
    if (!updated) {
      return error(res, 'Event not found or no changes made', 404);
    }
    return success(res, updated, 'Calendar event updated');
  } catch (err) {
    next(err);
  }
}

async function deleteEvent(req, res, next) {
  try {
    const removed = await calendarRepo.remove(req.params.id);
    if (!removed) {
      return error(res, 'Calendar event not found', 404);
    }
    return success(res, null, 'Calendar event removed');
  } catch (err) {
    next(err);
  }
}

module.exports = {
  listEvents,
  getEventById,
  createEvent,
  updateEvent,
  deleteEvent
};
