const sharp = require('sharp');
const { pdfBufferToImages } = require('../services/imageService');
const { detectAndRotate } = require('../services/rotationService');
const { cleanImage } = require('../services/cleanerService');
const { isBlankPage } = require('../services/blankPageDetector');

exports.preview = async (req, res, next) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: 'No se subió ningún archivo' });
    }

    // Buscar el primer archivo PDF sin importar el nombre del campo
    const file = req.files.find(f => f.mimetype === 'application/pdf');
    if (!file) {
      return res.status(400).json({ error: 'No se encontró archivo PDF' });
    }

    const pdfBuffer = file.buffer;
    const options = {
      autoRotate: req.body.autoRotate === 'true',
      clean: req.body.clean === 'true',
      detectBlank: req.body.detectBlank !== 'false',
    };

    // Convertir PDF a imágenes (escala menor para velocidad)
    const imageBuffers = await pdfBufferToImages(pdfBuffer, 1.5);

    const pages = [];
    const blankPages = [];
    const appliedAngles = [];

    for (let i = 0; i < imageBuffers.length; i++) {
      let buf = imageBuffers[i];
      let angle = 0;

      // Rotación automática si está activada
      if (options.autoRotate) {
        const rotResult = await detectAndRotate(buf);
        buf = rotResult.buffer;
        angle = rotResult.angle;
      }

      // Limpieza si está activada
      if (options.clean) {
        buf = await cleanImage(buf);
      }

      // Detección de páginas en blanco
      if (options.detectBlank !== false) {
        if (await isBlankPage(buf)) {
          blankPages.push(i + 1);
        }
      }

      // Convertir a JPEG base64 para mostrar en frontend
      const jpegBuffer = await sharp(buf).jpeg({ quality: 60 }).toBuffer();
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
