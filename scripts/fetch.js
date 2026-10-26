/**
 * Confirms each committed copy still matches the address the author publishes it at, so an entry
 * whose `sourceUrl` has started serving something else is noticed rather than assumed.
 *
 *   node scripts/fetch.js [--only <id>] [--allow-offline]
 *
 * Downloads are untrusted input: each one is written into its own empty folder under the system temp
 * directory, compared as bytes, and never imported, executed or passed to a build tool.
 */
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { parseArgs } from 'node:util';
import { bad, finish, info, listEntries, ok, readJSON, sha256, warn } from './lib.js';

const MAX_BYTES = 1_000_000;
const TIMEOUT = 20_000;

async function download(url) {
  const response = await fetch(url, { redirect: 'follow', signal: AbortSignal.timeout(TIMEOUT) });
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  const body = Buffer.from(await response.arrayBuffer());
  if (body.length > MAX_BYTES) throw new Error(`over ${Math.round(MAX_BYTES / 1000)} kB`);
  return body;
}

const { values } = parseArgs({ options: { only: { type: 'string' }, 'allow-offline': { type: 'boolean' } }, allowPositionals: true });
const entries = listEntries({ only: values.only });
if (!entries.length) info('Nothing to fetch.');

const failed = [];
let compared = 0;
let skipped = 0;

for (const item of entries) {
  const entry = readJSON(item.entryFile);
  const url = entry.sourceUrl ?? entry.downloadUrl;
  if (!url) {
    warn(`${item.id}: no sourceUrl, so there's nothing to compare against`);
    skipped++;
    continue;
  }
  // Its own empty directory, away from any script or manifest an interpreter might pick up.
  const sandbox = mkdtempSync(join(tmpdir(), 'yapin-registry-download-'));
  try {
    const body = await download(url);
    writeFileSync(join(sandbox, 'downloaded.bin'), body);
    const committed = readFileSync(item.pluginFile);
    if (body.equals(committed)) {
      ok(`${item.id} matches ${url}`);
      compared++;
    } else {
      bad(`${item.id} does NOT match ${url} (served ${sha256(body)}, committed ${sha256(committed)})`);
      info('Either the author published a new build without opening a pull request, or that address is serving something else.');
      failed.push(item.id);
    }
  } catch (error) {
    const message = `${item.id}: couldn't fetch ${url}: ${error.message}`;
    if (values['allow-offline']) {
      warn(message);
      skipped++;
    } else {
      bad(message);
      failed.push(item.id);
    }
  } finally {
    rmSync(sandbox, { recursive: true, force: true });
  }
}

// Say what was actually compared. "fine" for entries nothing could be fetched for would be a lie.
if (failed.length || compared) finish('fetch', { failed, checked: compared + failed.length });
if (skipped) warn(`fetch: ${skipped} ${skipped === 1 ? 'entry was' : 'entries were'} not compared`);
