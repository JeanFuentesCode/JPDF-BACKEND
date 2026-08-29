require('dotenv').config();

module.exports = {
  port: process.env.PORT || 3000,
  maxFileSize: parseInt(process.env.MAX_FILE_SIZE, 10) || 10 * 1024 * 1024,
  maxFilesPerRequest: parseInt(process.env.MAX_FILES_PER_REQUEST, 10) || 10,
  uploadDir: process.env.UPLOAD_DIR || 'uploads',
  outputDir: process.env.OUTPUT_DIR || 'outputs',
  ocrLang: process.env.OCR_LANG || 'spa',
};