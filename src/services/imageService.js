const { createCanvas } = require('@napi-rs/canvas');
const sharp = require('sharp');
const pdfjsLib = require('pdfjs-dist/legacy/build/pdf.js');

// Configurar worker
pdfjsLib.GlobalWorkerOptions.workerSrc = require.resolve('pdfjs-dist/legacy/build/pdf.worker.js');

// Polyfill DOMMatrix
if (!global.DOMMatrix) {
  global.DOMMatrix = class {
    constructor(transform) {
      this.a = 1; this.b = 0; this.c = 0; this.d = 1; this.e = 0; this.f = 0;
    }
  };
}

/**
 * Convierte un buffer de PDF a array de buffers de imágenes PNG.
 * @param {Buffer} pdfBuffer
 * @param {number} scale Escala de renderizado.
 * @returns {Promise<Buffer[]>} Array de buffers PNG.
 */
async function pdfBufferToImages(pdfBuffer, scale = 2) {
  // Convertir buffer a Uint8Array para pdfjs
  const uint8Array = new Uint8Array(pdfBuffer);
  const pdf = await pdfjsLib.getDocument({ data: uint8Array }).promise;
  const pageCount = pdf.numPages;
  const imageBuffers = [];

  for (let pageNumber = 1; pageNumber <= pageCount; pageNumber++) {
    const page = await pdf.getPage(pageNumber);
    const viewport = page.getViewport({ scale });

    const canvas = createCanvas(viewport.width, viewport.height);
    const ctx = canvas.getContext('2d');

    await page.render({ canvasContext: ctx, viewport }).promise;

    const pngBuffer = canvas.toBuffer('image/png');
    imageBuffers.push(pngBuffer);
  }

  return imageBuffers;
}

module.exports = { pdfBufferToImages };