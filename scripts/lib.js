import { createHash } from 'node:crypto';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

export const ROOT = fileURLToPath(new URL('..', import.meta.url));
export const PLUGINS_DIR = join(ROOT, 'plugins');
export const DIST_DIR = join(ROOT, 'dist');
export const REVOKED_FILE = join(ROOT, 'revoked.json');

export const style = {
  bold: (t) => `\u001b[1m${t}\u001b[0m`,
  dim: (t) => `\u001b[2m${t}\u001b[0m`,
  red: (t) => `\u001b[31m${t}\u001b[0m`,
  green: (t) => `\u001b[32m${t}\u001b[0m`,
  yellow: (t) => `\u001b[33m${t}\u001b[0m`,
};

export const ok = (text) => console.log(style.green(`✔ ${text}`));
export const warn = (text) => console.log(style.yellow(`! ${text}`));
export const bad = (text) => console.log(style.red(`✖ ${text}`));
export const info = (text) => console.log(style.dim(`  ${text}`));

export function sha256(data) {
  return createHash('sha256').update(data).digest('hex');
}

export function readJSON(file) {
  return JSON.parse(readFileSync(file, 'utf8'));
}

/** Every listed plugin: one directory under plugins/, named after its id. */
export function listEntries({ only = null } = {}) {
  if (!existsSync(PLUGINS_DIR)) return [];
  return readdirSync(PLUGINS_DIR, { withFileTypes: true })
    .filter((item) => item.isDirectory() && !item.name.startsWith('.'))
    .map((item) => item.name)
    .filter((id) => !only || id === only)
    .sort()
    .map((id) => {
      const dir = join(PLUGINS_DIR, id);
      return { id, dir, entryFile: join(dir, 'entry.json'), pluginFile: join(dir, 'plugin.js') };
    });
}

/** The revocation list, or an empty one. */
export function readRevoked() {
  if (!existsSync(REVOKED_FILE)) return { version: 1, revoked: [] };
  return readJSON(REVOKED_FILE);
}

/**
 * Exits with 1 if anything failed, after printing a count. Used by every script so CI reports the
 * same way whichever one ran.
 */
export function finish(label, { failed, checked }) {
  if (failed.length) {
    bad(`${label}: ${failed.length} of ${checked} failed (${failed.join(', ')})`);
    process.exitCode = 1;
    return false;
  }
  ok(`${label}: ${checked} ${checked === 1 ? 'entry' : 'entries'} fine`);
  return true;
}
