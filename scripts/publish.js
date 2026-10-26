/**
 * Builds the static index client apps fetch: signs each reviewed plugin with the registry key, writes
 * the signed copies, and emits index.json and revoked.json.
 *
 *   REGISTRY_KEY_ID=yapin-registry REGISTRY_KEY=<base64 pkcs8> node scripts/publish.js
 *   node scripts/publish.js --dry-run        # no key needed; writes nothing signed
 *
 * The hash in the index is of the *signed* file, because that is what gets served and what a client
 * will hash when it downloads.
 */
import { mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { parseArgs } from 'node:util';
import { generateKeys, signText, verifyText } from 'yapin.js-client';
import { DIST_DIR, bad, info, listEntries, ok, readJSON, readRevoked, sha256, warn } from './lib.js';

const { values } = parseArgs({
  options: { 'dry-run': { type: 'boolean' }, 'base-url': { type: 'string' } },
  allowPositionals: true,
});

const dryRun = Boolean(values['dry-run']);
const baseUrl = (values['base-url'] ?? process.env.REGISTRY_BASE_URL ?? 'https://yapin-js.github.io/yapin.js-client-plugins').replace(/\/+$/, '');
const keyId = process.env.REGISTRY_KEY_ID ?? 'yapin-registry';

let privateKey = process.env.REGISTRY_KEY;
let publicKey = process.env.REGISTRY_PUBLIC_KEY ?? null;
if (!privateKey) {
  if (!dryRun) {
    bad('REGISTRY_KEY is not set, so nothing can be signed.');
    info('Set it to the base64 private key (a repository secret in CI), or pass --dry-run.');
    process.exit(1);
  }
  // A throwaway key, so a dry run exercises the same path without touching the real one.
  const throwaway = generateKeys();
  privateKey = throwaway.privateKey;
  publicKey = throwaway.publicKey;
  warn('Dry run: signing with a throwaway key. The output is not publishable.');
}

rmSync(DIST_DIR, { recursive: true, force: true });
mkdirSync(join(DIST_DIR, 'p'), { recursive: true });

const plugins = [];
for (const item of listEntries()) {
  const entry = readJSON(item.entryFile);
  const unsigned = readFileSync(item.pluginFile, 'utf8');
  if (entry.sha256 !== sha256(unsigned)) {
    bad(`${item.id}: plugin.js doesn't match entry.json's sha256. Run "npm run check".`);
    process.exit(1);
  }

  const signed = signText(unsigned, { keyId, privateKey });
  // Never publish a signature that doesn't verify; a bad key would otherwise ship silently.
  const check = verifyText(signed, { [keyId]: publicKey ?? '' });
  if (publicKey && check.state !== 'valid') {
    bad(`${item.id}: the signature this just wrote doesn't verify against REGISTRY_PUBLIC_KEY (${check.state}). Check the key pair.`);
    process.exit(1);
  }

  const served = `p/${item.id}.plugin.js`;
  writeFileSync(join(DIST_DIR, served), signed);
  plugins.push({
    id: entry.id,
    name: entry.name,
    description: entry.description,
    version: entry.version,
    authors: entry.authors,
    license: entry.license ?? null,
    website: entry.website ?? null,
    tags: entry.tags ?? [],
    apiVersion: entry.apiVersion,
    minClientVersion: entry.minClientVersion ?? null,
    platforms: entry.platforms ?? [],
    dependencies: entry.dependencies ?? [],
    conflicts: entry.conflicts ?? [],
    notes: entry.notes ?? null,
    /** Where the reviewed, signed copy is served from. */
    downloadUrl: `${baseUrl}/${served}`,
    /** Where the author publishes it, for provenance. Not what clients download. */
    sourceUrl: entry.sourceUrl ?? entry.downloadUrl ?? null,
    sha256: sha256(signed),
    bytes: Buffer.byteLength(signed),
    signature: { algorithm: 'ed25519', keyId },
  });
  ok(`${entry.name} ${entry.version} → ${served}`);
}

const index = {
  version: 1,
  updated: new Date().toISOString(),
  baseUrl,
  /**
   * Listed so you can see which key signed what. A client must take the key it trusts from its own
   * config, never from here: an index that carries the key it is verified against proves nothing.
   */
  keys: publicKey ? [{ id: keyId, algorithm: 'ed25519', publicKey }] : [],
  plugins,
};

writeFileSync(join(DIST_DIR, 'index.json'), `${JSON.stringify(index, null, 2)}\n`);
writeFileSync(join(DIST_DIR, 'revoked.json'), `${JSON.stringify({ ...readRevoked(), updated: index.updated }, null, 2)}\n`);

ok(`dist/index.json (${plugins.length} ${plugins.length === 1 ? 'plugin' : 'plugins'}), dist/revoked.json`);
if (!publicKey) warn('REGISTRY_PUBLIC_KEY is not set, so the index lists no key and the signatures were not verified after writing.');
