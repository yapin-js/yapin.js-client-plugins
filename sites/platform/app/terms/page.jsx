import Link from 'next/link';
import { Card } from '../../components/ui.jsx';
import { config } from '../../lib/config.js';

export const metadata = { title: 'Terms of use' };

const UPDATED = '26 October 2026';

export default function Terms() {
  return (
    <>
      <h1>Terms of use</h1>
      <p className="lede tight">
        A volunteer-run index. It is free, it comes with no warranty, and you keep the rights to everything you publish.
      </p>
      <p className="hint mb-lg">Last updated {UPDATED}.</p>

      <div className="stack loose">
        <Card title="Who runs this, and who doesn’t">
          <p className="mt-sm">
            This is an unofficial project. It is not affiliated with, endorsed by or connected to Yapin&rsquo;, and signing in with
            a Yapin&rsquo; account does not make them responsible for anything here. Yapin&rsquo;s own terms still apply to your
            account and to what you do in their client — nothing on this site grants permission they have not given.
          </p>
        </Card>

        <Card title="What you get">
          <p className="mt-sm">
            Use of the site and of the index is free, and reading the index or downloading a listed file needs no account at all.
            In return there is nothing promised: no uptime, no promise that a submission is reviewed within any particular time or
            at all, and no promise that the service continues to exist. Reviews are done by people in their own time.
          </p>
          <p className="hint mt-sm">
            If that is not enough to build on, host the file yourself. Client apps install from a link, so you never needed this
            site.
          </p>
        </Card>

        <Card title="Your account and your tokens">
          <p className="mt-sm">
            One Yapin&rsquo; account is one publisher identity. Anything done with an API token issued to you counts as done by
            you, so keep them to yourself and revoke one on the <Link href="/tokens">tokens page</Link> the moment you think it has
            leaked.
          </p>
          <p className="mt-sm">
            Don&rsquo;t create further accounts to get around a removal, a rejection or a suspension.
          </p>
        </Card>

        <Card title="What you publish stays yours">
          <p className="mt-sm">
            You keep the copyright in everything you submit. By submitting it you confirm that you have the right to publish it,
            including anything bundled into the file, and that it is licensed so it can be hosted, mirrored and redistributed from
            a public index. You also allow the reviewed copy to be signed with the registry key and distributed under that
            signature.
          </p>
          <p className="hint mt-sm">
            Verified entries are committed to a public git repository, and git history is permanent. A later removal takes the
            listing out of the index going forward; it does not erase the commit that put it there.
          </p>
        </Card>

        <Card title="Verification is not an endorsement">
          <p className="mt-sm">
            A verified plugin has been read by a person, and the file you download is byte-for-byte the file they read. That is all
            it claims. It is not a guarantee that the code is safe, correct or maintained, and plugins run with full access to
            Yapin&rsquo; in that window, including the account. Installing one is your decision and your risk.
          </p>
          <p className="hint mt-sm">
            What a signature covers, and what it cannot, is set out in <Link href="/docs">how verification works</Link>.
          </p>
        </Card>

        <Card title="Rules for what you submit">
          <p className="mt-sm">
            The <Link href="/guidelines">plugin guidelines</Link> are part of these terms. A submission that breaks them is
            rejected, and a listing already published that turns out to break them is removed and, where it is harmful, revoked.
          </p>
        </Card>

        <Card title="Removal, revocation and suspension">
          <p className="mt-sm">
            A listing can be removed, a version revoked or an account suspended at any time. Where there is a reason worth giving,
            it is given; where a plugin is actively harming people, it goes first and is explained afterwards.
          </p>
          <p className="mt-sm">
            You can ask for your own listing to be taken down. What has already been downloaded cannot be recalled — revocation
            reaches a client only at its next fetch of the list.
          </p>
        </Card>

        <Card title="No warranty, and the limit of what can be claimed">
          <p className="mt-sm">
            The site, the index and every file listed in it are provided <em>as is</em>, without warranties of any kind, express or
            implied. To the fullest extent the law allows, nobody involved in running this is liable for any loss or damage arising
            out of using the service or anything installed from it. Where the law does not allow a particular liability to be
            excluded, this does not try to exclude it.
          </p>
        </Card>

        <Card title="Changes to these terms">
          <p className="mt-sm">
            These terms can change; the date at the top says when they last did, and a change worth noticing is announced in the
            index repository. Continuing to use the site after that is how you accept them. If you would rather not, stop using the
            site and ask for your listings to be removed.
          </p>
        </Card>

        <Card title="Getting in touch">
          <p className="mt-sm">
            Open an issue on <a href={`https://github.com/${config.registry.repo}`}>{config.registry.repo}</a>. A security problem
            in a listed plugin goes privately through the framework&rsquo;s{' '}
            <a href={`https://github.com/${config.frameworkRepo}/blob/main/SECURITY.md`}>SECURITY.md</a> first, so it can be revoked
            before it is publicised.
          </p>
        </Card>
      </div>
    </>
  );
}
