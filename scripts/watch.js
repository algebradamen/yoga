import { spawn } from 'child_process';
import { watch } from 'fs';
import { join } from 'path';

const ROOT = new URL('..', import.meta.url).pathname;
const SCRIPTS_DIR = join(ROOT, 'scripts');

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

function onChange(label) {
  console.log(`\n[watch] change detected: ${label}`);
  clearTimeout(debounceTimer);
  debounceTimer = setTimeout(async () => {
    stopServe();
    await cycle();
  }, 300);
}

async function main() {
  await cycle();

  // Watch directories so atomic-save editors (write-then-rename) don't drop the watcher
  watch(ROOT, (_, filename) => {
    if (!filename) return;
    if (filename.endsWith('.yaml') || filename.endsWith('.yml') || filename.endsWith('.json')) {
      onChange(filename);
    }
  });

  watch(SCRIPTS_DIR, (_, filename) => {
    if (filename) onChange(`scripts/${filename}`);
  });

  console.log('[watch] watching root (yaml/json) and scripts/ for changes...');
}

main().catch(err => { console.error(err); process.exit(1); });
