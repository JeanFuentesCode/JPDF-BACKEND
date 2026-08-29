const sharp = require('sharp');

/**
 * Limpia imperfecciones de una imagen.
 * @param {Buffer} imageBuffer
 * @param {number} medianWindow Tamaño del filtro mediana.
 * @returns {Promise<Buffer>}
 */
async function cleanImage(imageBuffer, medianWindow = 3) {
  const cleanedBuffer = await sharp(imageBuffer)
    .median(medianWindow)
    .greyscale()
    .threshold(180)
    .png()
    .toBuffer();
  return cleanedBuffer;
}

module.exports = { cleanImage };