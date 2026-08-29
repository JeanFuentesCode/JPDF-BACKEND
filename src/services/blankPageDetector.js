const sharp = require('sharp');

async function isBlankPage(imageBuffer, minPixelThreshold = 250) {
  const stats = await sharp(imageBuffer).stats();
  const min = stats.channels[0].min;
  return min >= minPixelThreshold;
}

module.exports = { isBlankPage };
