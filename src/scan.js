import { readdir, stat } from 'fs/promises';
import { join } from 'path';
import { workerData, parentPort } from 'worker_threads';

async function findNodeModulesDirs(dir, found = []) {
  let entries;

  try {
    entries = await readdir(dir, { withFileTypes: true });
  } catch {
    return found;
  }

  for (const entry of entries) {
    const fullPath = join(dir, entry.name);

    if (entry.isDirectory()) {
      if (entry.name === 'node_modules') {
        try {
          const stats = await stat(fullPath);
          found.push({
            path: fullPath,
            modified: stats.mtime.toLocaleString('pt-BR'),
            timeStamp: stats.mtime.getTime(),

          });
        } catch {
        }
      } else {
        await findNodeModulesDirs(fullPath, found);
      }
    }
  }

  return found;
}

(async () => {
  const results = await findNodeModulesDirs(workerData.root);
  parentPort.postMessage(results);
})();
