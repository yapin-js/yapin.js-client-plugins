import Link from 'next/link';
import { Card, Kv } from '../../components/ui.jsx';
import { config } from '../../lib/config.js';

export const metadata = { title: 'Privacy' };

const UPDATED = '26 October 2026';

/** The rows below are the record this site actually writes — see lib/store.js. Keep them in step. */

const ACCOUNT = [
  ['Account id', 'The id Yapin’ gives you. It is what ties a submission or a token to you.'],
  ['Username', 'Shown on your listings.'],
  ['Display name', 'Shown in the header while you are signed in.'],
  ['Avatar address', 'The URL, not the image. Your browser fetches it from wherever Yapin’ hosts it.'],
  ['First seen', 'When you first signed in. Account age is close to the only abuse signal available here.'],
  ['Last seen', 'When you last signed in.'],
];

const SUBMISSION = [
  ['The file', 'The built plugin, as pasted. A reviewer reads all of it.'],
  ['sha256 and size', 'So the copy that is distributed can be shown to be the copy that was read.'],
  ['Header metadata', 'id, version, name, description, authors, apiVersion, minClientVersion, platforms and tags, read out of the file.'],
  ['Source address', 'Where you said you publish the file, if you gave one.'],
  ['Publisher and time', 'Your account id, and when it was submitted and reviewed.'],
];

export default function Privacy() {
  return (
    <>
      <h1>Privacy</h1>
      <p className="lede tight">
        What this site keeps about you, which is close to the least it can keep and still work. No analytics, no tracking, nothing
        sold or shared.
      </p>
      <p className="hint mb-lg">Last updated {UPDATED}.</p>

      <div className="stack loose">
        <Card title="What signing in does not hand over">
          <p className="mt-sm">
            Signing in goes through Yapin&rsquo; itself, using OAuth 2.0 with PKCE. You type your password on yapin.gg and never
            here, so this site never sees it. Yapin&rsquo; sends back a code, that code is exchanged for an access token, the token
            is used once to ask who you are, and then it is discarded — it is never written to disk and never used again. Nothing
            here can act on your Yapin&rsquo; account.
          </p>
        </Card>

        <Card title="What is kept about your account">
          <Kv rows={ACCOUNT} />
        </Card>

        <Card title="Cookies">
          <p className="mt-sm">
            Two, both of them signed, <code>HttpOnly</code> and same-site. There are no third-party cookies and no analytics
            cookies, because there is no analytics.
          </p>
          <Kv
            rows={[
              ['yps', `Your session: account id, username, display name and avatar address. Expires after ${config.sessionDays} days, or when you sign out.`],
              ['ypf', 'One sign-in attempt: a random state, the PKCE verifier and the page to return to. Lives ten minutes and is deleted the moment sign-in finishes.'],
            ]}
          />
        </Card>

        <Card title="What a submission records">
          <Kv rows={SUBMISSION} />
          <p className="hint mt-sm">
            A reviewer reads the whole file, and a verified one is published. Don&rsquo;t leave anything private in it — a key, a
            webhook, a path with your name in it.
          </p>
        </Card>

        <Card title="API tokens are stored as a hash">
          <p className="mt-sm">
            A token is kept as a sha256 of itself, never as the token, so a leak of the data file hands nobody a working
            credential. The plaintext is shown once, at creation, and cannot be shown again. Stored beside the hash: the label you
            gave it, its scopes, its first few characters so you can match it against one you still hold, and when it was created,
            last used and revoked.
          </p>
          <p className="hint mt-sm">
            A revoked token keeps its row, because that is what keeps it revoked. Manage them on the{' '}
            <Link href="/tokens">tokens page</Link>.
          </p>
        </Card>

        <Card title="What becomes public">
          <p className="mt-sm">
            A verified entry is committed to a public git repository:{' '}
            <a href={`https://github.com/${config.registry.repo}`}>{config.registry.repo}</a>. The id, version, name, description,
            authors, tags, sha256, download address and the publisher it belongs to are all part of that entry, and the file itself
            is committed alongside it.
          </p>
          <p className="hint mt-sm">
            Git history is public and permanent. Removing a listing later stops it being served; it does not unpublish the commit.
            Publish under a name you are content to have attached to the account.
          </p>
        </Card>

        <Card title="Who else sees anything">
          <p className="mt-sm">
            <strong>Yapin&rsquo;</strong>, during sign-in — their own privacy terms cover that part.{' '}
            <strong>Whoever hosts your avatar</strong>, because your browser fetches the image from them and they see the request.{' '}
            <strong>Whoever hosts this site</strong>, in the ordinary server logs any web server keeps, such as IP addresses and
            request lines; the application itself writes no logs of its own.
          </p>
          <p className="hint mt-sm">
            Fonts are self-hosted and served from this domain, so loading a page makes no request to Google. There are no
            third-party scripts of any kind.
          </p>
        </Card>

        <Card title="How long it is kept">
          <p className="mt-sm">
            Your publisher record lasts as long as the account is in use. A submission is kept as the record of what was reviewed
            and what was signed, which is the point of it. Tokens are kept, as hashes, after revocation.
          </p>
        </Card>

        <Card title="Getting it deleted">
          <p className="mt-sm">
            Ask, and your publisher record and any pending submissions are deleted and your tokens revoked. What is already in the
            public index and its git history cannot be retracted after the fact — a listing can be removed going forward, and a
            version revoked, but the commits stay.
          </p>
          <p className="hint mt-sm">
            Ask in an issue on <a href={`https://github.com/${config.registry.repo}`}>{config.registry.repo}</a>. See also the{' '}
            <Link href="/terms">terms of use</Link>.
          </p>
        </Card>

        <Card title="Changes to this page">
          <p className="mt-sm">
            This page changes when what the site stores changes. The date at the top says when it last did, and the history of the
            page is in the repository like everything else.
          </p>
        </Card>
      </div>
    </>
  );
}
