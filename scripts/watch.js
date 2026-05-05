import { spawn } from 'child_process';
import { watch } from 'fs';
import { readdir } from 'fs/promises';
import { join } from 'path';

const ROOT = new URL('..', import.meta.url).pathname;

async function findWatchTargets() {
  const rootEntries = await readdir(ROOT);
  const rootFiles = rootEntries
    .filter(f => f.endsWith('.yaml') || f.endsWith('.yml') || f.endsWith('.json'))
    .map(f => ({ path: join(ROOT, f), label: f }));

  const scriptsDir = join(ROOT, 'scripts');
  const scriptEntries = await readdir(scriptsDir);
  const scriptFiles = scriptEntries
    .map(f => ({ path: join(scriptsDir, f), label: `scripts/${f}` }));

  return [...rootFiles, ...scriptFiles];
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

  const targets = await findWatchTargets();
  console.log(`[watch] watching ${targets.length} file(s) for changes...`);
  for (const { path, label } of targets) {
    watch(path, () => onChange(label));
  }
}

main().catch(err => { console.error(err); process.exit(1); });
