const aseguradorasService = require('../services/aseguradoras.service');

async function create(req, res, next) {
  try {
    const aseguradora = await aseguradorasService.create(req.body);
    res.status(201).json(aseguradora);
  } catch (err) {
    next(err);
  }
}

async function list(req, res, next) {
  try {
    const aseguradoras = await aseguradorasService.list();
    res.json(aseguradoras);
  } catch (err) {
    next(err);
  }
}

async function getById(req, res, next) {
  try {
    const aseguradora = await aseguradorasService.getById(Number(req.params.id));
    res.json(aseguradora);
  } catch (err) {
    next(err);
  }
}

async function update(req, res, next) {
  try {
    const aseguradora = await aseguradorasService.update(Number(req.params.id), req.body);
    res.json(aseguradora);
  } catch (err) {
    next(err);
  }
}

async function remove(req, res, next) {
  try {
    await aseguradorasService.remove(Number(req.params.id));
    res.status(204).send();
  } catch (err) {
    next(err);
  }
}

module.exports = { create, list, getById, update, remove };