const siniestrosService = require('../services/siniestros.service');

async function create(req, res, next) {
  try {
    const siniestro = await siniestrosService.create(req.body);
    res.status(201).json(siniestro);
  } catch (err) {
    next(err);
  }
}

async function list(req, res, next) {
  try {
    const result = await siniestrosService.list(req.validatedQuery);
    res.json(result);
  } catch (err) {
    next(err);
  }
}

async function getById(req, res, next) {
  try {
    const siniestro = await siniestrosService.getById(Number(req.params.id));
    res.json(siniestro);
  } catch (err) {
    next(err);
  }
}

async function updateEstado(req, res, next) {
  try {
    const siniestro = await siniestrosService.updateEstado(Number(req.params.id), req.body.estado);
    res.json(siniestro);
  } catch (err) {
    next(err);
  }
}

async function remove(req, res, next) {
  try {
    await siniestrosService.remove(Number(req.params.id));
    res.status(204).send();
  } catch (err) {
    next(err);
  }
}

module.exports = { create, list, getById, updateEstado, remove };
