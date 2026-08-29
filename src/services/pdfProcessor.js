const pLimit = require('p-limit');
const { processSinglePdf } = require('./singlePdfProcessor');

const limit = pLimit(2);

async function processPdfs(pdfBuffers, options) {
  const results = await Promise.all(
    pdfBuffers.map((buf, index) =>
      limit(() => processSinglePdf(buf, options))
    )
  );
  return results;
}

module.exports = { processPdfs };