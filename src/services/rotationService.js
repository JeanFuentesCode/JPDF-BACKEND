const sharp = require('sharp');

/**
 * Detecta el mejor ángulo de rotación usando varianza de filas.
 * @param {Buffer} imageBuffer
 * @returns {Promise<number>} Ángulo (0, 90, 180, 270)
 */
async function detectBestRotation(imageBuffer) {
  let bestAngle = 0;
  let bestScore = -Infinity;

  for (const angle of [0, 90, 180, 270]) {
    const rotatedBuffer = await sharp(imageBuffer).rotate(angle).png().toBuffer();
    const score = await horizontalVariance(rotatedBuffer);
    if (score > bestScore) {
      bestScore = score;
      bestAngle = angle;
    }
  }
  return bestAngle;
}

async function horizontalVariance(imageBuffer) {
  const resized = await sharp(imageBuffer)
    .resize({ width: 800, height: 800, fit: 'inside' })
    .greyscale()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const { data, info } = resized;
  const width = info.width;
  const height = info.height;
  const rowSums = new Array(height).fill(0);

  for (let y = 0; y < height; y++) {
    let sum = 0;
    for (let x = 0; x < width; x++) {
      sum += data[y * width + x];
    }
    rowSums[y] = sum / width;
  }

  const mean = rowSums.reduce((a, b) => a + b, 0) / height;
  const variance = rowSums.reduce((acc, val) => acc + (val - mean) ** 2, 0) / height;
  return variance;
}

/**
 * Rota la imagen si es necesario.
 * @param {Buffer} imageBuffer
 * @returns {Promise<{rotated: boolean, buffer: Buffer, angle: number}>}
 */
async function detectAndRotate(imageBuffer) {
  const angle = await detectBestRotation(imageBuffer);

  if (angle === 0) {
    return { rotated: false, buffer: imageBuffer, angle: 0 };
  }

  const rotatedBuffer = await sharp(imageBuffer).rotate(angle).png().toBuffer();
  return { rotated: true, buffer: rotatedBuffer, angle };
}

module.exports = { detectAndRotate };