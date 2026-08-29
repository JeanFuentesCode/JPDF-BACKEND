require('module-alias/register');

const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const upload = require('./middlewares/upload');
const pdfController = require('./controllers/pdfController');

const app = express();
const port = process.env.PORT || 3000;

// Configuración para proxies (Render)
app.set('trust proxy', 1);

// Seguridad
app.use(helmet());
app.use(cors());
app.use(express.json());

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: 'Demasiadas peticiones, intenta más tarde.',
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api', limiter);

// Rutas
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'J PDF backend funcionando' });
});

app.post('/api/process', upload.array('pdfs', 50), pdfController.process);
app.get('/api/download/:fileName', pdfController.download);

// Manejo de errores
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: err.message || 'Error interno del servidor' });
});

app.listen(port, () => {
  console.log(`Servidor escuchando en http://localhost:${port}`);

app.post('/api/preview', upload.array('pdfs', 1), previewController.preview);
  
});
