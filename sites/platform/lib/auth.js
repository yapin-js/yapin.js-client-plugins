import 'server-only';
/**
 * Sign in with Yapin', and the sessions that result.
 *
 * OAuth 2.0 authorization code with PKCE:
 *   1. /auth/login    → a verifier and a state are stashed in a short-lived signed cookie, and the
 *                       person is redirected to yapin.gg.
 *   2. yapin.gg       → asks them, then redirects back to /auth/callback with a code.
 *   3. /auth/callback → the state is compared, the code exchanged for a token using the verifier, the
 *                       token used once to read who they are, and then thrown away.
 *
 * What this site never does: see a Yapin' password, store a Yapin' access token, or call anything on
 * yapin.gg on someone's behalf. That keeps the framework's promise in its docs/security.md intact —
 * nothing here touches a person's account.
 *
 * Cross-site request forgery is handled by Next: server actions are rejected unless the Origin
 * matches, so there are no hand-rolled form tokens to forget.
 */
import { createHash, createHmac, randomBytes, timingSafeEqual } from 'node:crypto';
import { cookies } from 'next/headers';
import { config, redirectUri } from './config.js';
import { upsertPublisher } from './store.js';

const SESSION_COOKIE = 'yps';
const FLOW_COOKIE = 'ypf';
const FLOW_SECONDS = 600;

/** Signs cookies. Generated per run when unset, so dev sessions end with the process. */
const secret = config.sessionSecret ?? randomBytes(32).toString('hex');

function sign(payload) {
  const body = Buffer.from(JSON.stringify(payload), 'utf8').toString('base64url');
  return `${body}.${createHmac('sha256', secret).update(body).digest('base64url')}`;
}

function unsign(value) {
  if (typeof value !== 'string' || !value.includes('.')) return null;
  const [body, mac] = value.split('.', 2);
  const expected = createHmac('sha256', secret).update(body).digest('base64url');
  const a = Buffer.from(mac);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  try {
    const payload = JSON.parse(Buffer.from(body, 'base64url').toString('utf8'));
    if (typeof payload?.exp === 'number' && payload.exp < Date.now()) return null;
    return payload;
  } catch {
    return null;
  }
}

function cookieOptions(maxAge) {
  return {
    path: '/',
    httpOnly: true,
    sameSite: 'lax',
    maxAge,
    // Secure would make the cookie unusable over plain http, which is how you run this locally.
    secure: config.baseUrl.startsWith('https://'),
  };
}

// --- sessions ------------------------------------------------------------------------------------

/** The signed-in person, or null. Safe to call from any server component. */
export async function currentUser() {
  const jar = await cookies();
  const payload = unsign(jar.get(SESSION_COOKIE)?.value);
  if (payload?.sub) {
    return { id: payload.sub, username: payload.un, displayName: payload.dn, avatarUrl: payload.av ?? null };
  }
  // Recorded here too, so dev mode behaves like a real sign-in even without visiting /auth/login.
  if (config.devAuth && !config.production) {
    const user = devUser();
    upsertPublisher(user);
    return user;
  }
  return null;
}

export async function startSession(user) {
  const maxAge = config.sessionDays * 86_400;
  const value = sign({
    sub: user.id,
    un: user.username,
    dn: user.displayName,
    av: user.avatarUrl ?? null,
    exp: Date.now() + maxAge * 1000,
  });
  (await cookies()).set(SESSION_COOKIE, value, cookieOptions(maxAge));
}

export async function endSession() {
  (await cookies()).set(SESSION_COOKIE, '', cookieOptions(0));
}

// --- the OAuth flow ------------------------------------------------------------------------------

/** Step 1: where to send them. The cookie remembering this attempt is set here. */
export async function startLogin({ returnTo = '/dashboard' } = {}) {
  const state = randomBytes(16).toString('base64url');
  const verifier = randomBytes(32).toString('base64url');
  const challenge = createHash('sha256').update(verifier).digest('base64url');

  (await cookies()).set(
    FLOW_COOKIE,
    sign({ state, verifier, returnTo, exp: Date.now() + FLOW_SECONDS * 1000 }),
    cookieOptions(FLOW_SECONDS),
  );

  const url = new URL(config.oauth.authorizeUrl);
  url.searchParams.set('response_type', 'code');
  url.searchParams.set('client_id', config.oauth.clientId ?? '');
  url.searchParams.set('redirect_uri', redirectUri());
  url.searchParams.set('scope', config.oauth.scope);
  url.searchParams.set('state', state);
  url.searchParams.set('code_challenge', challenge);
  url.searchParams.set('code_challenge_method', 'S256');
  return url.href;
}

/**
 * Step 3: turn the code into a person. Throws an Error whose message is safe to show when anything is
 * off — a mismatched state, an expired attempt, a provider that answered badly.
 */
export async function completeLogin(query) {
  const jar = await cookies();
  const flow = unsign(jar.get(FLOW_COOKIE)?.value);
  jar.set(FLOW_COOKIE, '', cookieOptions(0));

  if (!flow) throw new Error('That sign-in attempt expired. Try again.');
  if (query.get('error')) throw new Error(`Yapin' refused the sign-in: ${query.get('error_description') || query.get('error')}`);

  const a = Buffer.from(String(query.get('state') ?? ''));
  const b = Buffer.from(flow.state);
  if (a.length !== b.length || !timingSafeEqual(a, b)) throw new Error("That sign-in didn't come from here. Try again.");

  const code = query.get('code');
  if (!code) throw new Error("Yapin' sent no authorization code.");

  const user = await identify(await exchange(code, flow.verifier));
  return { user, returnTo: typeof flow.returnTo === 'string' && flow.returnTo.startsWith('/') ? flow.returnTo : '/dashboard' };
}

async function exchange(code, verifier) {
  const response = await fetch(config.oauth.tokenUrl, {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded', accept: 'application/json' },
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      redirect_uri: redirectUri(),
      client_id: config.oauth.clientId ?? '',
      client_secret: config.oauth.clientSecret ?? '',
      code_verifier: verifier,
    }),
    signal: AbortSignal.timeout(15_000),
    cache: 'no-store',
  });
  if (!response.ok) throw new Error(`Couldn't complete the sign-in (the token endpoint answered ${response.status}).`);
  const json = await response.json().catch(() => null);
  if (!json?.access_token) throw new Error("The token endpoint didn't return an access token.");
  return json.access_token;
}

/**
 * One request, to find out who signed in. The token is not stored and not used again.
 * Field names vary between providers, so the obvious spellings are all accepted.
 */
async function identify(token) {
  const response = await fetch(config.oauth.userinfoUrl, {
    headers: { authorization: `Bearer ${token}`, accept: 'application/json' },
    signal: AbortSignal.timeout(15_000),
    cache: 'no-store',
  });
  if (!response.ok) throw new Error(`Couldn't read your Yapin' account (${response.status}).`);
  const me = await response.json().catch(() => null);
  const id = me?.id ?? me?.sub ?? me?.user_id;
  if (!id) throw new Error("Yapin' didn't say who you are.");
  return {
    id: String(id),
    username: String(me.username ?? me.preferred_username ?? me.name ?? id),
    displayName: String(me.display_name ?? me.global_name ?? me.name ?? me.username ?? id),
    avatarUrl: typeof me.avatar_url === 'string' && me.avatar_url.startsWith('https://') ? me.avatar_url : null,
  };
}

/** The fixed local account for PLATFORM_DEV_AUTH. Never reachable in production. */
export function devUser() {
  return { id: 'dev-1', username: 'dev', displayName: 'Local developer', avatarUrl: null };
}
