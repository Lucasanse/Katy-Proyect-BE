const siniestrosService = require('../services/siniestros.service');

async function create(req, res, next) {
  try {
    const siniestro = await siniestrosService.create(req.body, req.admin);
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

async function update(req, res, next) {
  try {
    const siniestro = await siniestrosService.update(Number(req.params.id), req.body, req.admin);
    res.json(siniestro);
  } catch (err) {
    next(err);
  }
}

async function consultar(req, res, next) {
  try {
    const { numero, credencial } = req.validatedQuery;
    const resultado = await siniestrosService.consultarPorNumeroYCredencial(numero, credencial);
    res.json(resultado);
  } catch (err) {
    next(err);
  }
}

async function getAuditoria(req, res, next) {
  try {
    const auditoria = await siniestrosService.getAuditoria(Number(req.params.id));
    res.json(auditoria);
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

module.exports = { create, list, getById, updateEstado, update, remove, getAuditoria, consultar };
