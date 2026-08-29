const multer = require('multer');
const env = require('../config/env');

const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  if (file.mimetype !== 'application/pdf') {
    return cb(new Error('Solo se permiten archivos PDF'));
  }
  cb(null, true);
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 20 * 1024 * 1024, // 20 MB
    files: 50, // máximo 50 archivos
  },
});

module.exports = upload;