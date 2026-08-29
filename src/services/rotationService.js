const sharp = require('sharp');

/**
 * Calcula la varianza de las sumas por fila de una imagen en escala de grises.
 */
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
 * Detecta el mejor ángulo de rotación basado en varianza horizontal.
 * Si el mejor ángulo es 180 pero la diferencia con 0 es mínima, devuelve 0.
 */
async function detectBestRotation(imageBuffer) {
  const scores = {};

  for (const angle of [0, 90, 180, 270]) {
    const rotatedBuffer = await sharp(imageBuffer).rotate(angle).png().toBuffer();
    scores[angle] = await horizontalVariance(rotatedBuffer);
    console.log(`  Ángulo ${angle}° => varianza: ${scores[angle].toFixed(2)}`);
  }

  // Si la diferencia entre 0 y 180 es menor al 5% de la varianza máxima, elegimos 0
  const maxScore = Math.max(scores[0], scores[90], scores[180], scores[270]);
  const diff0_180 = Math.abs(scores[0] - scores[180]) / maxScore;

  if (scores[180] > scores[0] && diff0_180 < 0.05) {
    console.log('  Diferencia 0/180 insignificante, se asume 0°');
    return 0;
  }

  // Elegir el ángulo con mayor varianza
  let bestAngle = 0;
  let bestScore = -Infinity;
  for (const angle of [0, 90, 180, 270]) {
    if (scores[angle] > bestScore) {
      bestScore = scores[angle];
      bestAngle = angle;
    }
  }

  return bestAngle;
}

/**
 * Función principal: detecta y rota la imagen si es necesario.
 */
async function detectAndRotate(imageBuffer) {
  console.log('Detectando orientación...');
  const angle = await detectBestRotation(imageBuffer);

  if (angle === 0) {
    console.log('No se requiere rotación.');
    return { rotated: false, buffer: imageBuffer, angle: 0 };
  }

  const rotatedBuffer = await sharp(imageBuffer).rotate(angle).png().toBuffer();
  console.log(`Rotada ${angle}°`);
  return { rotated: true, buffer: rotatedBuffer, angle };
}

module.exports = { detectAndRotate };
