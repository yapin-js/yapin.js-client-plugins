/**
 * Persistence: one JSON file per collection, written atomically. Enough for the volume this will see
 * for a long while, and it keeps the platform deployable anywhere Node runs with no database.
 *
 * Swap this module for a real database when concurrent writes start to matter. Every caller goes
 * through the functions below, so nothing else has to change.
 */
import 'server-only';
import { createHash, randomBytes, timingSafeEqual } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, renameSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { config } from './config.js';

const dir = resolve(config.dataDir);

function file(name) {
  return join(dir, `${name}.json`);
}

function read(name, fallback) {
  try {
    return JSON.parse(readFileSync(file(name), 'utf8'));
  } catch {
    return fallback;
  }
}

/** Through a temporary file and a rename, so a crash mid-write never leaves half a file. */
function write(name, value) {
  mkdirSync(dir, { recursive: true });
  const target = file(name);
  const temp = `${target}.${process.pid}.tmp`;
  writeFileSync(temp, `${JSON.stringify(value, null, 2)}\n`);
  renameSync(temp, target);
}

export function ensureDataDir() {
  mkdirSync(dir, { recursive: true });
  return dir;
}

// --- publishers ----------------------------------------------------------------------------------

/**
 * Records the account on first sign-in, and keeps `firstSeen`. Account age is the main abuse signal
 * available, so it's worth having from the start even before any limits use it.
 */
export function upsertPublisher(user) {
  const all = read('publishers', {});
  const now = new Date().toISOString();
  const existing = all[user.id];
  all[user.id] = {
    id: user.id,
    username: user.username,
    displayName: user.displayName,
    avatarUrl: user.avatarUrl ?? null,
    firstSeen: existing?.firstSeen ?? now,
    lastSeen: now,
  };
  write('publishers', all);
  return all[user.id];
}

export function getPublisher(id) {
  return read('publishers', {})[id] ?? null;
}

// --- submissions ---------------------------------------------------------------------------------

/**
 * A submitted plugin or theme awaiting review. `state` is one of pending | verified | rejected, and
 * maps onto the trust tiers the client runtime understands: only `verified` is ever signed.
 */
export function listSubmissions({ publisherId = null } = {}) {
  const all = Object.values(read('submissions', {}));
  const mine = publisherId ? all.filter((s) => s.publisherId === publisherId) : all;
  return mine.sort((a, b) => b.submittedAt.localeCompare(a.submittedAt));
}

export function getSubmission(key) {
  return read('submissions', {})[key] ?? null;
}

/** The id a plugin is published under is owned by whoever first had it verified. */
export function ownerOf(kind, id) {
  for (const submission of Object.values(read('submissions', {}))) {
    if (submission.kind === kind && submission.id === id && submission.state === 'verified') return submission.publisherId;
  }
  return null;
}

export function addSubmission({ kind, id, version, publisherId, sha256, bytes, meta, sourceUrl }) {
  const all = read('submissions', {});
  const key = `${kind}:${id}:${version}`;
  all[key] = {
    key,
    kind,
    id,
    version,
    publisherId,
    sha256,
    bytes,
    meta,
    sourceUrl: sourceUrl ?? null,
    state: 'pending',
    submittedAt: new Date().toISOString(),
    reviewedAt: null,
    reviewNote: null,
  };
  write('submissions', all);
  return all[key];
}

export function setSubmissionState(key, state, note = null) {
  const all = read('submissions', {});
  if (!all[key]) return null;
  all[key] = { ...all[key], state, reviewNote: note, reviewedAt: new Date().toISOString() };
  write('submissions', all);
  return all[key];
}

// --- API tokens ----------------------------------------------------------------------------------

/**
 * Tokens are stored as a sha256 of the token, never the token itself: a leak of this file doesn't
 * hand anyone a working credential. The plaintext is shown once, at creation.
 *
 * The `yapin_pub_` prefix is deliberate — register it with GitHub's secret scanning partner program
 * and GitHub will tell you when someone commits one to a public repository.
 */
const PREFIX = 'yapin_pub_';

function hash(token) {
  return createHash('sha256').update(token).digest('hex');
}

export function listTokens(publisherId) {
  return Object.values(read('tokens', {}))
    .filter((t) => t.publisherId === publisherId && !t.revokedAt)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export function createToken({ publisherId, label, scopes = ['publish'] }) {
  const all = read('tokens', {});
  const plaintext = `${PREFIX}${randomBytes(24).toString('base64url')}`;
  const id = randomBytes(8).toString('hex');
  all[id] = {
    id,
    publisherId,
    label: label || 'Untitled token',
    scopes,
    hash: hash(plaintext),
    // The first characters, so a listing can be matched against a token you still hold.
    preview: `${plaintext.slice(0, PREFIX.length + 4)}…`,
    createdAt: new Date().toISOString(),
    lastUsedAt: null,
    revokedAt: null,
  };
  write('tokens', all);
  return { token: all[id], plaintext };
}

export function revokeToken({ publisherId, id }) {
  const all = read('tokens', {});
  const token = all[id];
  // Scoped to the owner, so a guessed id can't revoke someone else's token.
  if (!token || token.publisherId !== publisherId || token.revokedAt) return false;
  all[id] = { ...token, revokedAt: new Date().toISOString() };
  write('tokens', all);
  return true;
}

/** Resolves a presented token, or null. Records when it was last used. */
export function useToken(plaintext) {
  if (typeof plaintext !== 'string' || !plaintext.startsWith(PREFIX)) return null;
  const given = Buffer.from(hash(plaintext), 'hex');
  const all = read('tokens', {});
  for (const token of Object.values(all)) {
    if (token.revokedAt) continue;
    const stored = Buffer.from(token.hash, 'hex');
    if (stored.length === given.length && timingSafeEqual(stored, given)) {
      all[token.id] = { ...token, lastUsedAt: new Date().toISOString() };
      write('tokens', all);
      return all[token.id];
    }
  }
  return null;
}
