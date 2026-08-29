const { PDFDocument } = require('pdf-lib');
const sharp = require('sharp');
const pLimit = require('p-limit');
const { pdfBufferToImages } = require('./imageService');
const { isBlankPage } = require('./blankPageDetector');
const { detectAndRotate } = require('./rotationService');
const { cleanImage } = require('./cleanerService');

async function processSinglePdf(pdfBuffer, options) {
  console.log('Procesando PDF en memoria...');

  const imageBuffers = await pdfBufferToImages(pdfBuffer, 2);
  console.log(`Se generaron ${imageBuffers.length} imágenes`);

  const limit = pLimit(4); // procesar 4 páginas en paralelo

  const processedPages = await Promise.all(
    imageBuffers.map((buf, index) =>
      limit(async () => {
        let currentBuffer = buf;

        if (options.autoRotate) {
          const rotResult = await detectAndRotate(currentBuffer);
          currentBuffer = rotResult.buffer;
        }

        if (options.clean) {
          currentBuffer = await cleanImage(currentBuffer);
        }

        let isBlank = false;
        if (options.detectBlank !== false) {
          isBlank = await isBlankPage(currentBuffer);
        }

        return { buffer: currentBuffer, page: index + 1, blank: isBlank };
      })
    )
  );

  const blankPages = processedPages.filter(p => p.blank).map(p => p.page);
  blankPages.forEach(p => console.log(`Página ${p} detectada como en blanco`));

  const finalBuffers = processedPages.map(p => p.buffer);

  const pdfDoc = await PDFDocument.create();
  for (const buf of finalBuffers) {
    const jpegBuffer = await sharp(buf).jpeg({ quality: 85 }).toBuffer();
    const image = await pdfDoc.embedJpg(jpegBuffer);
    const page = pdfDoc.addPage([image.width, image.height]);
    page.drawImage(image, { x: 0, y: 0, width: image.width, height: image.height });
  }

  const outputBuffer = Buffer.from(await pdfDoc.save());

  return {
    originalName: 'documento.pdf',
    suggestedName: null,
    blankPagesDetected: blankPages,
    outputBuffer,
  };
}

module.exports = { processSinglePdf };
