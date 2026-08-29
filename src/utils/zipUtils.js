const AdmZip = require('adm-zip');

/**
 * Crea un buffer ZIP a partir de archivos en memoria.
 * @param {Array<{filename: string, data: Buffer}>} files
 * @returns {Promise<Buffer>} Buffer del ZIP
 */
async function createZipBuffer(files) {
  const zip = new AdmZip();
  files.forEach((file) => {
    zip.addFile(file.filename, file.data);
  });
  return zip.toBuffer();
}

module.exports = { createZipBuffer };