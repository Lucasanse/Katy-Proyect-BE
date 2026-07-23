const evidenciaService = require('../services/evidencia.service');

async function upload(req, res, next) {
  try {
    const evidencia = await evidenciaService.upload({
      siniestroId: req.body.siniestroId,
      tipoDocumento: req.body.tipoDocumento,
      file: req.file,
    });
    res.status(201).json(evidencia);
  } catch (err) {
    next(err);
  }
}

async function remove(req, res, next) {
  try {
    await evidenciaService.remove(Number(req.params.id));
    res.status(204).send();
  } catch (err) {
    next(err);
  }
}

module.exports = { upload, remove };
