import { spawn } from 'child_process';
import { watch } from 'fs';
import { readdir } from 'fs/promises';
import { join } from 'path';

const ROOT = new URL('..', import.meta.url).pathname;

async function findYamlFiles() {
  const entries = await readdir(ROOT);
  return entries
    .filter(f => f.endsWith('.yaml') || f.endsWith('.yml'))
    .map(f => join(ROOT, f));
}

function run(cmd, args, opts = {}) {
  const proc = spawn(cmd, args, { stdio: 'inherit', ...opts });
  return proc;
}

async function generate() {
  return new Promise((resolve, reject) => {
    const proc = run('npm', ['run', 'generate'], { cwd: ROOT });
    proc.on('close', code => (code === 0 ? resolve() : reject(new Error(`generate exited ${code}`))));
  });
}

let serveProc = null;

function startServe() {
  serveProc = run('npx', ['serve', 'dist'], { cwd: ROOT });
  serveProc.on('close', code => {
    if (code !== null && code !== 0) console.error(`serve exited with code ${code}`);
  });
}

function stopServe() {
  if (serveProc) {
    serveProc.kill();
    serveProc = null;
  }
}

async function cycle() {
  console.log('\n[watch] running generate...');
  try {
    await generate();
  } catch (e) {
    console.error('[watch] generate failed:', e.message);
    return;
  }
  console.log('[watch] starting serve...');
  startServe();
}

let debounceTimer = null;

async function onChange(filename) {
  console.log(`\n[watch] change detected: ${filename}`);
  clearTimeout(debounceTimer);
  debounceTimer = setTimeout(async () => {
    stopServe();
    await cycle();
  }, 300);
}

async function main() {
  await cycle();

  const yamlFiles = await findYamlFiles();
  if (yamlFiles.length === 0) {
    console.log('[watch] no yaml files found to watch');
    return;
  }

  console.log(`[watch] watching ${yamlFiles.length} yaml file(s) for changes...`);
  for (const file of yamlFiles) {
    watch(file, () => onChange(file));
  }
}

main().catch(err => { console.error(err); process.exit(1); });
