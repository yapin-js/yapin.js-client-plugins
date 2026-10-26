import Link from 'next/link';
import { Notice, TrustTag } from '../components/ui.jsx';
import { currentUser } from '../lib/auth.js';

export const metadata = { title: 'Publish for Yapin’ clients' };

const TIERS = [
  ['unverified', 'Anyone can publish one. The client warns that it runs with full access, and the metadata it shows is whatever the file claims.'],
  ['signed', 'Validly signed, but by a key the client app does not know. Proves the file has not changed since it was built.'],
  ['verified', 'Read by a person, then signed with the registry key. The name, version and author shown before installing are attested, not claimed.'],
];

const CLI = [
  'npx yapin-client plugin init my-plugin',
  'npx yapin-client plugin build',
  'npx yapin-client plugin check',
];

export default async function Home({ searchParams }) {
  const user = await currentUser();
  // /auth/callback sends sign-in failures back here.
  const { error } = await searchParams;

  return (
    <div className="lp">
      {error ? (
        <div className="lp-wrap" style={{ paddingTop: 24 }}>
          <Notice kind="error">{error}</Notice>
        </div>
      ) : null}

      <section className="lp-hero">
        <div className="lp-wrap lp-hero-copy">
          <h1>
            Publish plugins for <em>Yapin&rsquo; clients</em>
          </h1>
          <p className="lp-sub">
            Submit a plugin, ask for verification, and client apps can tell the difference between a file a person vouched for
            and a file that merely says so.
          </p>
          <div className="lp-cta">
            {user ? (
              <Link className="lp-btn" href="/dashboard">
                Go to your dashboard
              </Link>
            ) : (
              <Link className="lp-btn" href="/auth/login">
                Sign in with Yapin&rsquo;
              </Link>
            )}
            <Link className="lp-btn quiet" href="/docs">
              How verification works
            </Link>
          </div>
          <p className="lp-meta">
            <span className="lp-dot" />
            <b>Public index</b>
            <span className="lp-sep">·</span>
            No token needed to install
            <span className="lp-sep">·</span>
            Every version reviewed
          </p>
        </div>
      </section>

      <section className="lp-sec">
        <div className="lp-wrap">
          <p className="lp-kicker">Trust</p>
          <h2>Three tiers, and the client decides</h2>
          <p className="lp-body">
            A client app lists the keys it accepts in its own config. Nothing here can make a client trust this registry.
          </p>
          <div className="lp-cards">
            {TIERS.map(([trust, text]) => (
              <article className="lp-card" key={trust}>
                <TrustTag trust={trust} />
                <p>{text}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="lp-sec">
        <div className="lp-wrap lp-split">
          <div>
            <p className="lp-kicker">No account required</p>
            <h2>You never needed this site</h2>
            <p className="lp-body">
              Build it, host the file anywhere over https, and give people the link — client apps install from a link already.
            </p>
            <p className="lp-note">
              An account gets you into the in-app browser and lets you request verification. Nothing else is gated: reading the
              index and downloading a plugin need no token at all.
            </p>
          </div>
          <pre className="lp-code">
            <code>
              {CLI.map((line) => (
                <div key={line}>
                  <span>$ </span>
                  {line}
                </div>
              ))}
            </code>
          </pre>
        </div>
      </section>

      <div className="lp-band-wrap">
        <div className="lp-wrap">
          <div className="lp-band">
            <h2>Get your first plugin verified</h2>
            <p>
              Paste the built file, and a reviewer reads it. What you download afterwards is byte-for-byte the file they read.
            </p>
            <div className="lp-cta">
              {user ? (
                <Link className="lp-btn" href="/submit">
                  Submit a plugin
                </Link>
              ) : (
                <Link className="lp-btn" href="/auth/login">
                  Sign in with Yapin&rsquo;
                </Link>
              )}
              <Link className="lp-btn quiet" href="/docs">
                Read the docs
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
