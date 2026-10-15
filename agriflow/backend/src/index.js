import path from 'path';
import fs from 'fs';
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { seedIfEmpty } from './seed.js';
import { registerRoutes } from './routes.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '..', '.env') });
const PORT = Number(process.env.PORT) || 4000;

seedIfEmpty();

const app = express();
app.use(cors());
app.use(express.json({ limit: '2mb' }));

app.use((req, res, next) => {
  const started = Date.now();
  res.on('finish', () => {
    if (req.path.startsWith('/api')) {
      console.log(`${req.method} ${req.path} ${res.statusCode} ${Date.now() - started}ms`);
    }
  });
  next();
});

registerRoutes(app);

const clientDist = path.join(__dirname, '..', '..', 'frontend', 'dist');
if (fs.existsSync(clientDist)) {
  app.use(express.static(clientDist));
  app.use((req, res, next) => {
    if (req.method !== 'GET' || req.path.startsWith('/api')) return next();
    res.sendFile(path.join(clientDist, 'index.html'));
  });
}

const server = app.listen(PORT, () => {
  console.log(`AgriFlow API on http://localhost:${PORT}`);
  console.log('Demo password for every sample account: demo123');
});

server.on('error', (error) => {
  if (error.code === 'EADDRINUSE') {
    console.error(`Port ${PORT} is already in use. Stop the other app or set PORT.`);
  } else {
    console.error(error);
  }
  process.exit(1);
});
