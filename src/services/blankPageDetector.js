const sharp = require('sharp');

/**
 * Determina si una imagen es blanca.
 * @param {Buffer} imageBuffer
 * @param {number} darkPixelThreshold Porcentaje máximo de píxeles oscuros (default 0.5%).
 * @returns {Promise<boolean>}
 */
async function isBlankPage(imageBuffer, darkPixelThreshold = 0.5) {
  const { data, info } = await sharp(imageBuffer)
    .greyscale()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const totalPixels = info.width * info.height;
  let darkPixels = 0;

  for (let i = 0; i < data.length; i++) {
    if (data[i] < 200) darkPixels++;
  }

  const darkPercentage = (darkPixels / totalPixels) * 100;
  return darkPercentage < darkPixelThreshold;
}

module.exports = { isBlankPage };