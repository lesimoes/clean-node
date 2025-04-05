#!/usr/bin/env node

import { readdir } from 'fs/promises';
import { resolve } from 'path';
import os from 'os';
import { Worker } from 'worker_threads';

// const root = resolve(os.homedir(), 'Work');
const root = process.cwd();

async function listSubdirs(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  return entries
    .filter(entry => entry.isDirectory())
    .map(entry => resolve(dir, entry.name));
}

function runWorker(root) {
  const scanWorkerPath = new URL('./scan.js', import.meta.url);

  return new Promise((resolve, reject) => {
    const worker = new Worker(scanWorkerPath, {
      workerData: { root }
    });

    worker.on('message', (data) => resolve(data));
    worker.on('error', reject);
    worker.on('exit', (code) => {
      if (code !== 0) reject(new Error(`Worker fails ${code}`));
    });
  });
}

(async () => {
  const subdirs = [root, ...(await listSubdirs(root))];
  console.log(`📁 Subdirectories scanned from ${root}: ${subdirs.length}`);

  const tasks = subdirs.map(runWorker);
  const allResults = await Promise.all(tasks);

  const flattened = allResults.flat();

  console.log(`🔍 Found ${flattened.length} node_modules:\n`);
  flattened
    .sort((a, b) => b.timeStamp - a.timeStamp)
    .forEach((found, index) => console.log(`📦 [${index + 1}]`, {
      path: found.path,
      modified: found.modified
    }))

})();
