'use server';
/**
 * The mutations. Next rejects a server action whose Origin doesn't match, which is the CSRF
 * protection — there are no form tokens to pass around or forget.
 *
 * Each returns `{ error }` for the form to show, or redirects on success.
 */
import { createHash } from 'node:crypto';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { checkFile } from 'yapin.js-client';
import { currentUser } from '../lib/auth.js';
import { addSubmission, createToken, ownerOf, revokeToken } from '../lib/store.js';

const MAX_SOURCE = 1_000_000; // the framework's own limit for a plugin file

async function requireUser() {
  const user = await currentUser();
  if (!user) redirect('/auth/login');
  return user;
}

export async function submitPlugin(_previous, formData) {
  const user = await requireUser();
  const source = String(formData.get('source') ?? '');
  const sourceUrl = String(formData.get('sourceUrl') ?? '').trim();
  const values = { source, sourceUrl };

  if (!source.trim()) return { error: 'Paste the built plugin file.', values };
  if (source.length > MAX_SOURCE) return { error: `That file is ${Math.round(source.length / 1000)} kB; the limit is ${MAX_SOURCE / 1000} kB.`, values };
  if (sourceUrl && !sourceUrl.startsWith('https://')) return { error: 'The address you publish it at must be https.', values };

  // The same check a client applies, and the same one the index's CI runs.
  const result = checkFile('submitted.plugin.js', source, { standalone: true });
  if (result.signature) {
    return { error: 'That file is already signed. Submit the unsigned build: verification adds the registry signature, and a header holds one signature line.', values };
  }
  if (result.problems.length) return { error: `It didn't pass the checks: ${result.problems[0]}`, values };

  const id = result.meta.id;
  // Whoever first had an id verified keeps it, so nobody can take a name out from under its author.
  const owner = ownerOf('plugin', id);
  if (owner && owner !== user.id) return { error: `The id "${id}" belongs to another publisher. Pick a different one.`, values };

  const submission = addSubmission({
    kind: 'plugin',
    id,
    version: String(result.meta.version ?? ''),
    publisherId: user.id,
    sha256: createHash('sha256').update(source).digest('hex'),
    bytes: Buffer.byteLength(source),
    sourceUrl: sourceUrl || null,
    meta: {
      name: result.meta.name ?? id,
      description: result.meta.description ?? '',
      authors: result.meta.authors ?? [],
      apiVersion: result.meta.apiVersion ?? null,
      minClientVersion: result.meta.minClientVersion ?? null,
      platforms: result.meta.platforms ?? [],
      tags: result.meta.tags ?? [],
      warnings: result.warnings,
    },
  });

  revalidatePath('/dashboard');
  redirect(`/dashboard?submitted=${encodeURIComponent(submission.key)}`);
}

export async function makeToken(_previous, formData) {
  const user = await requireUser();
  const label = String(formData.get('label') ?? '').slice(0, 60);
  if (!label.trim()) return { error: 'Give the token a label, so you can tell them apart later.' };
  const { plaintext } = createToken({ publisherId: user.id, label });
  revalidatePath('/tokens');
  // Returned rather than redirected: the plaintext is shown once and must not end up in a URL.
  return { created: plaintext };
}

export async function dropToken(formData) {
  const user = await requireUser();
  revokeToken({ publisherId: user.id, id: String(formData.get('id') ?? '') });
  revalidatePath('/tokens');
}
