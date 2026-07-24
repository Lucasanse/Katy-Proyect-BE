const multer = require('multer');
const { ApiError } = require('./error.middleware');

// Solo JPG/JPEG, PNG y PDF. Al no incluir video/*, cualquier video queda rechazado.
const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'application/pdf'];
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

const storage = multer.memoryStorage();

const upload = multer({
  storage,
  limits: { fileSize: MAX_FILE_SIZE },
  fileFilter: (req, file, cb) => {
    if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
      return cb(new ApiError(400, `Tipo de archivo no soportado: ${file.mimetype}`));
    }
    cb(null, true);
  },
});

module.exports = { upload };
