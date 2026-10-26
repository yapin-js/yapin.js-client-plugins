# platform.yapin.dev

Publisher accounts, submissions, verification requests and API tokens. Next.js (App Router) and
React, server-rendered, themed from [yapin.gg](https://yapin.gg) itself.

```sh
cp .env.example .env.local
npm install
npm run dev          # http://localhost:3000
```

With `PLATFORM_DEV_AUTH=1` you're signed in as a fixed local account, so the whole site works before
yapin.gg OAuth exists. It is refused when `NODE_ENV=production` — which `next build` and `next start`
both set — so it only ever applies under `next dev`.

## Sign in with Yapin&rsquo;

OAuth 2.0 authorization code with PKCE:

1. `/auth/login` stashes a verifier and a state in a short-lived signed cookie and redirects to
   yapin.gg.
2. yapin.gg asks the person, then redirects back to `/auth/callback` with a code.
3. The state is compared, the code exchanged for a token using the verifier, and the token used for
   **one** request to read who signed in. Then it is discarded.

This site never sees a Yapin&rsquo; password, never stores a Yapin&rsquo; token, and never calls
anything on yapin.gg on someone's behalf. That matters: the framework's own
[security.md](https://github.com/yapin-js/yapin.js-client/blob/main/docs/security.md) promises that
nothing in this project reads or sends a person's Yapin&rsquo; session, and a platform that collected
credentials would break it.

**It needs yapin.gg to expose OAuth endpoints.** The three URLs are configurable because their paths
are a guess until Yapin&rsquo; documents them — point them at what it actually serves, or at your own
identity provider, with no code change. Until then, `PLATFORM_DEV_AUTH=1` is how you work on the site.

## What's where

```
app/
  page.jsx            the landing page and the three trust tiers
  dashboard/          your submissions and their review state
  submit/             paste a built .plugin.js; checked before it's stored
  tokens/             create and revoke API tokens
  docs/               what verification means, and what it doesn't
  auth/login          starts the OAuth flow (or dev sign-in)
  auth/callback       finishes it
  actions.js          the server actions: submit, create token, revoke token
  globals.css         Yapin's design tokens and component rules
components/           Header, the shared UI pieces, the two client forms
lib/
  config.js           every setting, from the environment
  auth.js             PKCE, the code exchange, signed session cookies
  store.js            JSON files, written atomically
```

Mutations are **server actions**, so Next rejects any whose `Origin` doesn't match — that is the CSRF
protection, and there are no form tokens to pass around or forget.

A submission is checked with the framework's own `checkFile`, the same function the client runtime and
the index's CI use, so a submission is measured against exactly the rules a client will apply. An
already-signed file is refused: verification adds the registry signature, and a header holds one
signature line.

## Two rules worth knowing before you change this

- **A plugin id belongs to whoever first had it verified.** `ownerOf()` enforces it on every
  submission, so nobody can take a name out from under its author.
- **Tokens are stored as a sha256, never in plaintext.** The plaintext is returned from the action
  and shown once; it is deliberately not redirected into a URL, where it would land in history and
  server logs. The `yapin_pub_` prefix is there so the pattern can be registered with GitHub's secret
  scanning partner program — then GitHub tells you when someone commits one.

## Deploying

Any Node host. It needs a writable `PLATFORM_DATA_DIR`, so a platform with an ephemeral filesystem
needs a volume — or swap `lib/store.js` for a real database, which is the one module anything else
would have to change.

In production, set `PLATFORM_SESSION_SECRET`, make `PLATFORM_BASE_URL` the https address, and leave
`PLATFORM_DEV_AUTH` unset. The server refuses to start if those are wrong.
