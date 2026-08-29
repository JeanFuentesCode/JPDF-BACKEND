const { PDFDocument } = require('pdf-lib');
const sharp = require('sharp');
const { pdfBufferToImages } = require('./imageService');
const { isBlankPage } = require('./blankPageDetector');
const { detectAndRotate } = require('./rotationService');
const { cleanImage } = require('./cleanerService');

async function processSinglePdf(pdfBuffer, options) {
  console.log('Procesando PDF en memoria...');

  // 1. Convertir PDF a imágenes (buffers)
  const imageBuffers = await pdfBufferToImages(pdfBuffer, 2);
  console.log(`Se generaron ${imageBuffers.length} imágenes`);

  // 2. Procesar cada imagen independientemente
  const processedPages = [];
  const blankPagesDetected = [];

  for (let i = 0; i < imageBuffers.length; i++) {
    let currentBuffer = imageBuffers[i];

    // Rotación automática (solo si está activada)
    if (options.autoRotate) {
      const rotResult = await detectAndRotate(currentBuffer);
      currentBuffer = rotResult.buffer;
      if (rotResult.rotated) console.log(`Página ${i + 1}: rotada ${rotResult.angle}°`);
    }

    // Limpieza (solo si está activada)
    if (options.clean) {
      currentBuffer = await cleanImage(currentBuffer);
      console.log(`Página ${i + 1}: limpiada`);
    }

    // Detección de páginas en blanco (solo informativa)
    if (options.detectBlank !== false) { // por defecto detecta
      const blank = await isBlankPage(currentBuffer);
      if (blank) {
        blankPagesDetected.push(i + 1);
        console.log(`Página ${i + 1}: detectada como en blanco`);
      }
    }

    processedPages.push(currentBuffer);
  }

  // 3. Crear PDF final (incluye todas las páginas, el usuario decidirá si elimina)
  const pdfDoc = await PDFDocument.create();
  for (const buf of processedPages) {
    const jpegBuffer = await sharp(buf).jpeg({ quality: 90 }).toBuffer();
    const image = await pdfDoc.embedJpg(jpegBuffer);
    const page = pdfDoc.addPage([image.width, image.height]);
    page.drawImage(image, { x: 0, y: 0, width: image.width, height: image.height });
  }

  const pdfBytes = await pdfDoc.save();
  const outputBuffer = Buffer.from(pdfBytes);

  return {
    originalName: 'documento.pdf',
    suggestedName: null,
    blankPagesDetected,
    outputBuffer,
  };
}

module.exports = { processSinglePdf };