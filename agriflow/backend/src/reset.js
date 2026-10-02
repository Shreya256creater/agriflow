import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const dbFile = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'data', 'farmshare.sqlite');
fs.rmSync(dbFile, { force: true });
console.log('Removed database. It will be recreated with seed data on the next start.');
