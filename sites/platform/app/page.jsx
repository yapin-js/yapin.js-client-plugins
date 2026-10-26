import Link from 'next/link';
import { Card, Notice, SectionHead, TrustTag } from '../components/ui.jsx';
import { currentUser } from '../lib/auth.js';

export const metadata = { title: 'Publish for Yapin’ clients' };

const TIERS = [
  ['unverified', 'Anyone can publish one. The client warns that it runs with full access, and the metadata it shows is whatever the file claims.'],
  ['signed', 'Validly signed, but by a key the client app does not know. Proves the file has not changed since it was built.'],
  ['verified', 'Reviewed by a person, then signed with the registry key. The name, version and author shown before installing are attested, not claimed.'],
];

export default async function Home({ searchParams }) {
  const user = await currentUser();
  // /auth/callback sends sign-in failures back here.
  const { error } = await searchParams;

  return (
    <>
      {error ? <Notice kind="error">{error}</Notice> : null}
      <div className="hero stack">
        <h1>Publish plugins and themes for Yapin&rsquo; clients</h1>
        <p className="lede">
          Sign in with your Yapin&rsquo; account, submit a plugin, and ask for verification. Verified plugins are reviewed by a
          person and signed, so client apps can tell the difference between a file someone vouched for and a file that merely
          says so.
        </p>
        <div className="row">
          {user ? (
            <Link className="btn" href="/dashboard">
              Go to your dashboard
            </Link>
          ) : (
            <Link className="btn" href="/auth/login">
              Sign in with Yapin&rsquo;
            </Link>
          )}
          <Link className="btn secondary" href="/docs">
            How verification works
          </Link>
        </div>
      </div>

      <div className="stack loose" style={{ marginTop: 36 }}>
        <section className="stack tight">
          <SectionHead>The three tiers</SectionHead>
          <div className="grid">
            {TIERS.map(([trust, text]) => (
              <Card key={trust} title={<TrustTag trust={trust} />}>
                <p className="hint" style={{ marginTop: 8 }}>
                  {text}
                </p>
              </Card>
            ))}
          </div>
        </section>

        <section className="stack tight">
          <SectionHead>Publishing without an account</SectionHead>
          <Card>
            <p>
              You never need this site to share a plugin. Build it, host the file anywhere over https, and give people the link
              — client apps install from a link already.
            </p>
            <p className="hint" style={{ marginTop: 10 }}>
              An account gets you into the in-app browser and lets you request verification. Nothing else here is gated: reading
              the index and downloading a plugin need no token at all.
            </p>
            <pre style={{ marginTop: 14 }}>
              <code>
                {'npx yapin-client plugin init my-plugin\nnpx yapin-client plugin build\nnpx yapin-client plugin check'}
              </code>
            </pre>
          </Card>
        </section>
      </div>
    </>
  );
}
