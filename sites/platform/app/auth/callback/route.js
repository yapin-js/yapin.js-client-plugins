import { NextResponse } from 'next/server';
import { completeLogin, startSession } from '../../../lib/auth.js';
import { config } from '../../../lib/config.js';
import { upsertPublisher } from '../../../lib/store.js';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request) {
  const query = new URL(request.url).searchParams;
  try {
    const { user, returnTo } = await completeLogin(query);
    upsertPublisher(user);
    await startSession(user);
    return NextResponse.redirect(new URL(returnTo, config.baseUrl));
  } catch (error) {
    // completeLogin's messages are written to be safe to show. Anything else would be a bug, so it
    // goes to the log and the person gets the generic form.
    const message = error instanceof Error ? error.message : 'Something went wrong signing you in.';
    console.error('auth callback failed:', error);
    const url = new URL('/', config.baseUrl);
    url.searchParams.set('error', message);
    return NextResponse.redirect(url);
  }
}
