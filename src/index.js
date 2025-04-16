#!/usr/bin/env node

import { readdir } from 'fs/promises';
import { resolve } from 'path';
import { Worker } from 'worker_threads';
import chalk from 'chalk';
import fs from 'fs';
import inquirer from 'inquirer';

const root = process.cwd();

process.stdin.setRawMode(true);
process.stdin.resume();

const IGNORED_DIRECTORIES = ['.local', '.vscode'];

const ONE_MONTH = 30 * 24 * 60 * 60 * 1000;

const TIME_SPANS = [
  {
    name: '1 year',
    value: 12 * ONE_MONTH
  },
  {
    name: '9 months',
    value: 9 * ONE_MONTH
  },
  {
    name: '6 months',
    value: 6 * ONE_MONTH
  },
  {
    name: '3 months',
    value: 3 * ONE_MONTH
  },
  {
    name: '1 month',
    value: ONE_MONTH
  }
]

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

function parseDate(dateStr) {
  const [datePart, timePart] = dateStr.split(', ');
  const [day, month, year] = datePart.split('/');
  const [hours, minutes, seconds] = timePart.split(':');
  
  return new Date(year, month - 1, day, hours, minutes, seconds);
}

(async () => {
  const subdirs = [root, ...(await listSubdirs(root))];
  console.log(`📁 Subdirectories scanned from ${root}: ${subdirs.length}`);

  const tasks = subdirs.map(runWorker);
  const allResults = await Promise.all(tasks);

  const flattened = [...new Set(allResults.flat().map(item => JSON.stringify(item)))]
    .map(item => JSON.parse(item));

  console.log(`🔍 Found ${flattened.length} node_modules:\n`);
  flattened
    .sort((a, b) => b.timeStamp - a.timeStamp)
    .forEach((found, index) => console.log(`📦 [${index + 1}]`, {
      path: found.path,
      modified: found.modified
    }))

  console.log(chalk.blue("--------------------------------"))
  console.log(chalk.blue("Do you want to delete node_modules? (y/n)"));
  console.log(chalk.blue("--------------------------------"));

  process.stdin.once('data', async (data) => {
    const answer = data.toString().toLowerCase();
    
    if (answer === 'y') {
      const { timeSpan } = await inquirer.prompt({
        type: 'list',
        name: 'timeSpan',
        message: 'Select time span',
        choices: TIME_SPANS.map(timeSpan => ({
          name: timeSpan.name,
          value: timeSpan
        }))
      });

      console.log(chalk.green(`Deleting node_modules older than ${timeSpan.name}...`));            
      const now = new Date().getTime();
      flattened.forEach((found, index) => {
        const modifiedDate = parseDate(found.modified);
        const modifiedTime = modifiedDate.getTime();
        if (modifiedTime < (now - timeSpan.value) && !IGNORED_DIRECTORIES.some(ignored => found.path.includes(ignored))) {
          console.log(`[${index + 1}] Deleting ${found.path}`);          
          fs.rmdirSync(found.path, { recursive: true });
        }
      });
    } else {
      console.log(chalk.green('Exiting...'));
    }
    
    process.stdin.setRawMode(false);
    process.stdin.pause();
    process.exit(0);
  });

})();
