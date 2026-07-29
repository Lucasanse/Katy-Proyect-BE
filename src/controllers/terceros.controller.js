const tercerosService = require('../services/terceros.service');

async function addToSiniestro(req, res, next) {
  try {
    const tercero = await tercerosService.addToSiniestro(Number(req.params.id), req.body);
    res.status(201).json(tercero);
  } catch (err) {
    next(err);
  }
}

async function listBySiniestro(req, res, next) {
  try {
    const terceros = await tercerosService.listBySiniestro(Number(req.params.id));
    res.json(terceros);
  } catch (err) {
    next(err);
  }
}

async function update(req, res, next) {
  try {
    const tercero = await tercerosService.update(Number(req.params.id), req.body, req.admin);
    res.json(tercero);
  } catch (err) {
    next(err);
  }
}

async function remove(req, res, next) {
  try {
    await tercerosService.remove(Number(req.params.id));
    res.status(204).send();
  } catch (err) {
    next(err);
  }
}

module.exports = { addToSiniestro, listBySiniestro, update, remove };
