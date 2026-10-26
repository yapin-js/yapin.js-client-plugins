/**
 * Configuration, all from the environment. Nothing here has a secret default.
 *
 * Auth is OAuth 2.0 against yapin.gg: the authorization-code flow with PKCE. This site never sees a
 * Yapin' password — it redirects to yapin.gg, and yapin.gg redirects back with a code. That is the
 * only safe way to "sign in with Yapin'", and it needs yapin.gg to expose the three endpoints below.
 * They're configurable because the paths are a guess until Yapin' documents them; point them at
 * whatever it actually serves (or at your own identity provider) without touching any code.
 */

function env(name, fallback = undefined) {
  const value = process.env[name];
  if (value === undefined || value === '') {
    if (fallback === undefined) return undefined;
    return fallback;
  }
  return value;
}

const issuer = (env('YAPIN_ISSUER', 'https://yapin.gg') ?? '').replace(/\/+$/, '');

export const config = {
  /** Where this site is reached, used to build the OAuth redirect URI. */
  baseUrl: (env('PLATFORM_BASE_URL', 'http://localhost:3000') ?? '').replace(/\/+$/, ''),
  production: env('NODE_ENV') === 'production',
  dataDir: env('PLATFORM_DATA_DIR', 'data'),

  /** Signs session cookies. Required in production; sessions don't survive a restart without it. */
  sessionSecret: env('PLATFORM_SESSION_SECRET'),
  sessionDays: Number(env('PLATFORM_SESSION_DAYS', '14')),

  oauth: {
    issuer,
    clientId: env('YAPIN_CLIENT_ID'),
    clientSecret: env('YAPIN_CLIENT_SECRET'),
    authorizeUrl: env('YAPIN_AUTHORIZE_URL', `${issuer}/oauth2/authorize`),
    tokenUrl: env('YAPIN_TOKEN_URL', `${issuer}/oauth2/token`),
    userinfoUrl: env('YAPIN_USERINFO_URL', `${issuer}/api/v1/users/@me`),
    scope: env('YAPIN_SCOPE', 'identify'),
  },

  /**
   * Signs in as a fixed local account, for working on the site before yapin.gg OAuth is available.
   * Refused in production, loudly, because it would be an open door.
   */
  devAuth: env('PLATFORM_DEV_AUTH') === '1',

  /** The registry this platform feeds. Shown in the docs page. */
  registry: {
    repo: env('REGISTRY_REPO', 'yapin-js/yapin.js-client-plugins'),
    indexUrl: env('REGISTRY_INDEX_URL', 'https://plugins.yapin.dev/index.json'),
  },
};

/** Problems that should stop the server rather than surface as a confusing 500 later. */
export function configProblems() {
  const problems = [];
  if (config.production) {
    if (!config.sessionSecret) problems.push('PLATFORM_SESSION_SECRET is required in production');
    if (config.devAuth) problems.push('PLATFORM_DEV_AUTH must not be set in production: it signs anyone in as a fixed account');
    if (!config.baseUrl.startsWith('https://')) problems.push('PLATFORM_BASE_URL must be an https URL in production (the session cookie is Secure)');
  }
  if (!config.devAuth && !(config.oauth.clientId && config.oauth.clientSecret)) {
    problems.push('YAPIN_CLIENT_ID and YAPIN_CLIENT_SECRET are required to sign in (or set PLATFORM_DEV_AUTH=1 for local work)');
  }
  return problems;
}

export const redirectUri = () => `${config.baseUrl}/auth/callback`;
