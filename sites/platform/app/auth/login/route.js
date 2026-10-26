import { NextResponse } from 'next/server';
import { config } from '../../../lib/config.js';
import { devUser, startLogin, startSession } from '../../../lib/auth.js';
import { upsertPublisher } from '../../../lib/store.js';

// node:crypto and the file-backed store, so this must not be bundled for the edge.
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request) {
  const returnTo = new URL(request.url).searchParams.get('returnTo') ?? '/dashboard';
  const safeReturn = returnTo.startsWith('/') ? returnTo : '/dashboard';

  if (config.devAuth && !config.production) {
    const user = devUser();
    upsertPublisher(user);
    await startSession(user);
    return NextResponse.redirect(new URL(safeReturn, config.baseUrl));
  }

  if (!config.oauth.clientId) {
    // Said plainly rather than failing as a 500 somewhere deeper.
    return new NextResponse(
      "Sign-in is not configured: this server has no Yapin' OAuth client. Set YAPIN_CLIENT_ID and YAPIN_CLIENT_SECRET, or run with PLATFORM_DEV_AUTH=1 for local work.",
      { status: 503, headers: { 'content-type': 'text/plain; charset=utf-8' } },
    );
  }

  return NextResponse.redirect(await startLogin({ returnTo: safeReturn }));
}
