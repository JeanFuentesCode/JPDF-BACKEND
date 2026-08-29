const { pdfBufferToImages } = require('../services/imageService');
const { detectAndRotate } = require('../services/rotationService');
const { cleanImage } = require('../services/cleanerService');
const { isBlankPage } = require('../services/blankPageDetector');

exports.preview = async (req, res, next) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: 'No se subieron archivos' });
    }

    // Solo se permite un PDF para vista previa
    const pdfBuffer = req.files[0].buffer;
    const options = {
      autoRotate: req.body.autoRotate === 'true',
      clean: req.body.clean === 'true',
      detectBlank: req.body.detectBlank !== 'false',
    };

    // Convertir a imágenes
    const imageBuffers = await pdfBufferToImages(pdfBuffer, 1.5); // escala menor para velocidad
    const pages = [];
    const blankPages = [];
    const appliedAngles = [];

    for (let i = 0; i < imageBuffers.length; i++) {
      let buf = imageBuffers[i];
      let angle = 0;

      if (options.autoRotate) {
        const rotResult = await detectAndRotate(buf);
        buf = rotResult.buffer;
        angle = rotResult.angle;
      }

      if (options.clean) {
        buf = await cleanImage(buf);
      }

      if (options.detectBlank !== false) {
        if (await isBlankPage(buf)) {
          blankPages.push(i + 1);
        }
      }

      // Convertir a JPEG base64 para enviar al frontend
      const jpegBuffer = await require('sharp')(buf).jpeg({ quality: 70 }).toBuffer();
      pages.push({
        pageNumber: i + 1,
        image: `data:image/jpeg;base64,${jpegBuffer.toString('base64')}`,
      });

      appliedAngles.push(angle);
    }

    res.json({
      success: true,
      pages,
      blankPages,
      appliedAngles,
    });
  } catch (error) {
    next(error);
  }
};
