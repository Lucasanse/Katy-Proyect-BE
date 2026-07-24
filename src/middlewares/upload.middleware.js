const multer = require('multer');
const { ApiError } = require('./error.middleware');

const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'application/pdf'];

const storage = multer.memoryStorage();

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
      return cb(new ApiError(400, `Tipo de archivo no soportado: ${file.mimetype}`));
    }
    cb(null, true);
  },
});

module.exports = { upload };
