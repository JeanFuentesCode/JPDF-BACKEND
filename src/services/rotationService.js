const sharp = require('sharp');

async function horizontalVariance(imageBuffer) {
  const resized = await sharp(imageBuffer)
    .resize({ width: 400, height: 400, fit: 'inside' }) // reducido para velocidad
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
  return rowSums.reduce((acc, val) => acc + (val - mean) ** 2, 0) / height;
}

async function detectBestRotation(imageBuffer) {
  const score0 = await horizontalVariance(imageBuffer);
  const score90 = await horizontalVariance(await sharp(imageBuffer).rotate(90).png().toBuffer());

  console.log(`  0°: ${score0.toFixed(2)} | 90°: ${score90.toFixed(2)}`);

  // Si la varianza en 0° es mucho mayor que en 90°, la página está horizontal (0° o 180°)
  if (score0 > score90 * 1.5) {
    return 0; // asumimos que ya está derecha
  }

  // Si 90° es mayor, puede ser 90° o 270°
  const score270 = await horizontalVariance(await sharp(imageBuffer).rotate(270).png().toBuffer());
  console.log(`  270°: ${score270.toFixed(2)}`);

  if (score270 > score90) {
    return 270;
  } else {
    return 90;
  }
}

async function detectAndRotate(imageBuffer) {
  console.log('Detectando orientación...');
  const angle = await detectBestRotation(imageBuffer);

  if (angle === 0) {
    return { rotated: false, buffer: imageBuffer, angle: 0 };
  }

  const rotatedBuffer = await sharp(imageBuffer).rotate(angle).png().toBuffer();
  return { rotated: true, buffer: rotatedBuffer, angle };
}

module.exports = { detectAndRotate };
