
import { readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const DATA_DIR = resolve(process.cwd(), 'data');

export async function readJson(file) {
  const path = resolve(DATA_DIR, file);
  try {
    const raw = await readFile(path, 'utf-8');
    return JSON.parse(raw);
  } catch (err) {
    if (err.code === 'ENOENT') return [];
    throw err;
  }
}

export async function writeJson(file, data) {
  const path = resolve(DATA_DIR, file);
  await writeFile(path, JSON.stringify(data, null, 2), 'utf-8');
}
