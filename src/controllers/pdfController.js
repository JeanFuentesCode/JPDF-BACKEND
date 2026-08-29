const { processPdfs } = require('../services/pdfProcessor');
const { createZipBuffer } = require('../utils/zipUtils');

exports.process = async (req, res, next) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: 'No se subieron archivos' });
    }

    const pdfBuffers = req.files.map((f) => f.buffer);
    const originalNames = req.files.map((f) => f.originalname);
    const options = {
      autoRotate: req.body.autoRotate === 'true',
      clean: req.body.clean === 'true',
      detectBlank: req.body.detectBlank !== 'false',
      namingTemplate: req.body.namingTemplate || null,
      manualRotations: req.body.manualRotations ? JSON.parse(req.body.manualRotations) : {},
    };

    const processedFiles = await processPdfs(pdfBuffers, options);

    // Si es un solo archivo, devolver PDF directo
    if (processedFiles.length === 1) {
      const file = processedFiles[0];
      const outputName = file.suggestedName || `procesado_${Date.now()}.pdf`;
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="${outputName}"`);
      return res.send(file.outputBuffer);
    }

    // Si son varios, crear ZIP
    const zipFiles = processedFiles.map((file, index) => ({
      filename: file.suggestedName || `procesado_${index + 1}.pdf`,
      data: file.outputBuffer,
    }));

    const zipBuffer = await createZipBuffer(zipFiles);
    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('Content-Disposition', `attachment; filename="jpdf_resultados.zip"`);
    return res.send(zipBuffer);
  } catch (error) {
    next(error);
  }
};

exports.download = (req, res) => {
  res.status(410).json({ error: 'Endpoint obsoleto, usa /api/process' });
};
