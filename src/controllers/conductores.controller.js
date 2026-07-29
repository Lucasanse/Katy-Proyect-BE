const conductoresService = require('../services/conductores.service');

async function addToSiniestro(req, res, next) {
  try {
    const conductor = await conductoresService.addToSiniestro(Number(req.params.id), req.body);
    res.status(201).json(conductor);
  } catch (err) {
    next(err);
  }
}

async function update(req, res, next) {
  try {
    const conductor = await conductoresService.update(Number(req.params.id), req.body, req.admin);
    res.json(conductor);
  } catch (err) {
    next(err);
  }
}

module.exports = { addToSiniestro, update };
