const titularesService = require('../services/titulares.service');

async function update(req, res, next) {
  try {
    const titular = await titularesService.update(Number(req.params.id), req.body, req.admin);
    res.json(titular);
  } catch (err) {
    next(err);
  }
}

module.exports = { update };
