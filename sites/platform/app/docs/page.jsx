import { Card } from '../../components/ui.jsx';
import { config } from '../../lib/config.js';

export const metadata = { title: 'How verification works' };

export default function Docs() {
  const trustSnippet = `plugins: {
  trust: { keys: [{ id: 'yapin-registry', label: 'Verified', key: '…' }] },
  registry: { url: ${JSON.stringify(config.registry.indexUrl)}, enabled: true },
}`;

  return (
    <>
      <h1>How verification works</h1>
      <p className="lede tight">What the tiers mean, what a signature covers, and what it does not.</p>

      <div className="stack loose">
        <Card title="A signature covers the metadata too">
          <p className="mt-sm">
            The bytes signed are the whole file with the <code>@signature</code> line removed and line endings normalised. That
            includes the header, so the name, version and author a client shows <em>before it runs anything</em> are attested
            rather than claimed. Without a signature, those are simply whatever the file says about itself.
          </p>
        </Card>

        <Card title="Trust is decided by the client, not by us">
          <p className="mt-sm">
            A client app lists the keys it accepts in its own config. Nothing here can make a client trust this registry — and
            the key belongs in the client&rsquo;s configuration, taken from the repository, never from the index it verifies.
          </p>
          <pre className="mt-md">
            <code>{trustSnippet}</code>
          </pre>
        </Card>

        <Card title="What verification is not">
          <p className="mt-sm">
            A verified plugin has been read by a person, and the file you download is byte-for-byte the file they read. That is
            all it claims. It is not a guarantee that the code is safe, correct or maintained. Plugins run with full access to
            Yapin&rsquo; in that window, including the account.
          </p>
          <p className="hint mt-sm">
            A plugin can also load code from a URL at runtime. No signature can cover what that URL serves later, so submissions
            that do it are either rejected or listed with the behaviour called out.
          </p>
        </Card>

        <Card title="Every version is reviewed">
          <p className="mt-sm">
            There is no tier that lets a trusted publisher skip review, because &ldquo;get something benign verified, then push
            an update&rdquo; is the attack that actually reaches people. Reviewers read a diff against the last approved
            version, which is what makes reviewing every release affordable.
          </p>
        </Card>

        <Card title="Revocation">
          <p className="mt-sm">
            A plugin that turns out to be harmful is removed from the index and added to the revocation list by id, version and
            hash. Client apps feed that list into <code>plugins.blocked</code>. It is only as fast as the client&rsquo;s next
            fetch, so it is a mitigation, not a recall.
          </p>
          <p className="hint mt-sm">
            The list and the signing key live in{' '}
            <a href={`https://github.com/${config.registry.repo}`}>{config.registry.repo}</a>, in public, deliberately.
          </p>
        </Card>
      </div>
    </>
  );
}
