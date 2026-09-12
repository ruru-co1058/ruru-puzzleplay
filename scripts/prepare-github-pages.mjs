import { readFile, readdir, writeFile } from 'node:fs/promises';
import { extname, join } from 'node:path';

const root = 'dist/client';
const textFiles = new Set(['.html', '.js', '.css', '.json', '.rsc']);

async function rewrite(directory) {
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) await rewrite(path);
    else if (textFiles.has(extname(entry.name))) {
      const source = await readFile(path, 'utf8');
      const updated = source
        .replaceAll('/_next/', '/ruru-puzzleplay/_next/')
        .replaceAll('"_next/', '"ruru-puzzleplay/_next/')
        .replaceAll('/favicon.svg', '/ruru-puzzleplay/favicon.svg')
        .replaceAll('/default-puzzle.png', '/ruru-puzzleplay/default-puzzle.png');
      if (updated !== source) await writeFile(path, updated);
    }
  }
}

await rewrite(root);
