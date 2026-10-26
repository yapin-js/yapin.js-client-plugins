/**
 * Checks every listed plugin the way a client will read it, plus the things only this index can
 * check: that the committed file is the one the entry describes, and that the entry and the file's
 * own header agree.
 *
 *   node scripts/check.js [--only <id>]
 *
 * The rules a client applies come from the framework itself (`checkFile`, `readSignature`), so this
 * can't drift from what the runtime does.
 */
import { existsSync, readFileSync } from 'node:fs';
import { parseArgs } from 'node:util';
import { checkFile, readSignature } from 'yapin.js-client';
import { apiVersion as currentApiVersion } from 'yapin.js-client';
import { bad, finish, info, listEntries, ok, readJSON, readRevoked, sha256, warn } from './lib.js';

const ID = /^[a-z0-9](?:[a-z0-9-]{0,62}[a-z0-9])?$/;
const VERSION = /^\d+\.\d+\.\d+(?:[-+][\w.-]+)?$/;
const PLATFORMS = ['win32', 'darwin', 'linux', 'web'];

const REQUIRED = ['id', 'name', 'description', 'version', 'authors', 'apiVersion', 'sha256'];
const ALLOWED = new Set([
  ...REQUIRED, 'license', 'website', 'tags', 'minClientVersion', 'platforms',
  'dependencies', 'conflicts', 'downloadUrl', 'sourceUrl', 'bytes', 'notes',
]);

function isHttps(value) {
  try {
    return new URL(value).protocol === 'https:';
  } catch {
    return false;
  }
}

function checkEntryShape(entry, id, problems) {
  for (const key of Object.keys(entry)) if (!ALLOWED.has(key)) problems.push(`entry.json: unknown field "${key}"`);
  for (const key of REQUIRED) if (entry[key] === undefined || entry[key] === null) problems.push(`entry.json: "${key}" is required`);

  if (entry.id !== id) problems.push(`entry.json: id "${entry.id}" doesn't match the folder name "${id}"`);
  else if (!ID.test(entry.id)) problems.push(`entry.json: id "${entry.id}" must be lowercase letters, digits and dashes`);
  if (entry.version !== undefined && !VERSION.test(String(entry.version))) problems.push(`entry.json: version "${entry.version}" must look like 1.2.3`);
  if (entry.minClientVersion && !VERSION.test(String(entry.minClientVersion))) problems.push(`entry.json: minClientVersion "${entry.minClientVersion}" must look like 1.2.3`);
  if (typeof entry.description === 'string' && entry.description.trim().length < 10) problems.push('entry.json: description is too short to tell anyone what this does');

  if (!Array.isArray(entry.authors) || !entry.authors.length) problems.push('entry.json: authors must list at least one person');
  else {
    for (const author of entry.authors) {
      if (!author?.name) problems.push('entry.json: every author needs a name');
      else if (author.url && !isHttps(author.url)) problems.push(`entry.json: ${author.name}'s url must be https`);
    }
  }

  if (entry.apiVersion !== undefined && (!Number.isInteger(entry.apiVersion) || entry.apiVersion < 1)) problems.push('entry.json: apiVersion must be a whole number');
  else if (entry.apiVersion > currentApiVersion) problems.push(`entry.json: apiVersion ${entry.apiVersion} is newer than the framework's (${currentApiVersion})`);

  for (const [field, value] of [['website', entry.website], ['downloadUrl', entry.downloadUrl], ['sourceUrl', entry.sourceUrl]]) {
    if (value && !isHttps(value)) problems.push(`entry.json: ${field} must be an https link`);
  }
  for (const field of ['tags', 'platforms', 'dependencies', 'conflicts']) {
    if (entry[field] !== undefined && !Array.isArray(entry[field])) problems.push(`entry.json: ${field} must be a list`);
  }
  for (const platform of entry.platforms ?? []) {
    if (!PLATFORMS.includes(platform)) problems.push(`entry.json: platforms "${platform}" isn't one of ${PLATFORMS.join(', ')}`);
  }
  for (const dep of entry.dependencies ?? []) if (!ID.test(dep)) problems.push(`entry.json: dependencies "${dep}" isn't a plugin id`);
  if ((entry.dependencies ?? []).includes(id)) problems.push("entry.json: dependencies can't include the plugin itself");
  if (typeof entry.sha256 === 'string' && !/^[0-9a-f]{64}$/.test(entry.sha256)) problems.push('entry.json: sha256 must be 64 hex characters');
}

/** The entry has to agree with the header of the file people will read before installing. */
function checkAgreement(entry, meta, problems) {
  const pairs = [
    ['id', meta.id, entry.id],
    ['name', meta.name, entry.name],
    ['version', meta.version, entry.version],
    ['apiVersion', meta.apiVersion, entry.apiVersion],
    ['minClientVersion', meta.minClientVersion, entry.minClientVersion],
  ];
  for (const [field, inFile, inEntry] of pairs) {
    if (inEntry === undefined || inEntry === null) continue;
    if (String(inFile ?? '') !== String(inEntry)) problems.push(`plugin.js says @${field} "${inFile ?? ''}" but entry.json says "${inEntry}"`);
  }
  const fileAuthors = (meta.authors ?? []).map((a) => a.name).join(', ');
  const entryAuthors = (entry.authors ?? []).map((a) => a?.name).join(', ');
  if (fileAuthors !== entryAuthors) problems.push(`plugin.js says @author "${fileAuthors}" but entry.json says "${entryAuthors}"`);
}

function checkOne({ id, entryFile, pluginFile }) {
  const problems = [];
  const warnings = [];
  if (!existsSync(entryFile)) return { problems: [`${id}: no entry.json`], warnings };
  if (!existsSync(pluginFile)) return { problems: [`${id}: no plugin.js`], warnings };

  let entry;
  try {
    entry = readJSON(entryFile);
  } catch (error) {
    return { problems: [`${id}: entry.json isn't valid JSON: ${error.message}`], warnings };
  }
  checkEntryShape(entry, id, problems);

  const text = readFileSync(pluginFile, 'utf8');
  const bytes = Buffer.byteLength(text);
  const hash = sha256(text);
  if (entry.sha256 && entry.sha256 !== hash) problems.push(`plugin.js doesn't match entry.json's sha256 (file is ${hash})`);
  if (entry.bytes !== undefined && entry.bytes !== bytes) problems.push(`entry.json says ${entry.bytes} bytes, the file is ${bytes}`);

  // The registry's own signature is added at publish time, and the header holds one signature line,
  // so a submission that is already signed would have that signature replaced and silently lost.
  if (readSignature(text) || /@signature\b/.test(text)) problems.push('plugin.js is already signed; submit the unsigned build (see CONTRIBUTING.md)');

  const result = checkFile(pluginFile, text, { standalone: true });
  problems.push(...result.problems);
  warnings.push(...result.warnings);
  checkAgreement(entry, result.meta, problems);

  return { problems, warnings, entry, bytes, hash };
}

function checkRevoked(problems) {
  const revoked = readRevoked();
  if (!Array.isArray(revoked.revoked)) return problems.push('revoked.json: "revoked" must be a list');
  revoked.revoked.forEach((item, i) => {
    if (!ID.test(item?.id ?? '')) problems.push(`revoked.json[${i}]: id must be a plugin id`);
    if (!item?.reason) problems.push(`revoked.json[${i}]: reason is required`);
    for (const version of item?.versions ?? []) if (!VERSION.test(version)) problems.push(`revoked.json[${i}]: version "${version}" must look like 1.2.3`);
    for (const hash of item?.sha256 ?? []) if (!/^[0-9a-f]{64}$/.test(hash)) problems.push(`revoked.json[${i}]: sha256 must be 64 hex characters`);
    if (!item?.versions?.length && !item?.sha256?.length) problems.push(`revoked.json[${i}]: list the versions or the hashes being revoked`);
  });
}

const { values } = parseArgs({ options: { only: { type: 'string' } }, allowPositionals: true });
const entries = listEntries({ only: values.only });

const revokedProblems = [];
checkRevoked(revokedProblems);
for (const problem of revokedProblems) bad(problem);

if (!entries.length) {
  if (values.only) {
    bad(`No plugin "${values.only}" in plugins/`);
    process.exitCode = 1;
  } else {
    info('No plugins listed yet.');
  }
}

const failed = [];
for (const item of entries) {
  const { problems, warnings, entry, bytes } = checkOne(item);
  const label = entry?.name ? `${entry.name} ${entry.version}` : item.id;
  for (const warning of warnings) warn(`${item.id}: ${warning}`);
  for (const problem of problems) bad(`${item.id}: ${problem}`);
  if (problems.length) failed.push(item.id);
  else ok(`${label} (${Math.max(1, Math.round(bytes / 1024))} kB)`);
}

// One verdict at the end, counting revoked.json too — a summary that says "fine" on a run that
// exits 1 is worse than no summary.
if (revokedProblems.length) failed.push('revoked.json');
if (entries.length || revokedProblems.length) finish('check', { failed, checked: entries.length + (revokedProblems.length ? 1 : 0) });
