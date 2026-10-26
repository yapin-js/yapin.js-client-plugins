import Link from 'next/link';
import { Card } from '../../components/ui.jsx';
import { config } from '../../lib/config.js';

export const metadata = { title: 'Plugin guidelines' };

/** Kept in step with CONTRIBUTING.md in the index repository, which is what reviewers work from. */

const BUILD = ['npx yapin-client plugin check', 'npx yapin-client plugin build'];

const REJECTED = [
  ['Unreadable code.', 'Obfuscated or minified. Submit the bundle, not a mangled one — a reviewer reads the whole file, and there is nothing else to read.'],
  ['Taking what it has no reason to take.', 'Reading or sending the account token, password fields or message content anywhere that is not a service the plugin obviously needs and declares.'],
  ['Loading code from a URL at runtime.', 'Unless there is a reason that survives being asked about. A signature cannot cover what that URL serves tomorrow, which undoes most of what listing it is for.'],
  ['Describing itself as something it is not.', 'Including a description that does not match the code.'],
  ['Patching in ways that break other plugins.', 'Use the framework’s patcher rather than overwriting Yapin’ directly.'],
];

const FIXABLE = [
  ['Work that outlives the plugin.', 'Anything started in start() that is not registered through ctx keeps running after the plugin is stopped.'],
  ['Undeclared network calls.', 'A request to a host with no api.services entry behind it.'],
  ['Surprising defaults.', 'A setting that is on out of the box and does something people would not expect.'],
  ['Optimistic compatibility.', 'apiVersion or minClientVersion claiming more than the code supports.'],
];

function List({ items }) {
  return (
    <ul className="list mt-sm">
      {items.map(([head, body]) => (
        <li key={head}>
          <strong>{head}</strong> {body}
        </li>
      ))}
    </ul>
  );
}

export default function Guidelines() {
  return (
    <>
      <h1>Plugin guidelines</h1>
      <p className="lede tight">
        What a reviewer looks for, what is turned away on sight, and what happens to a listing afterwards.
      </p>

      <div className="stack loose">
        <Card title="Submit something that already works">
          <p className="mt-sm">
            Listing a plugin is a distribution step, not a development one. It should install from a link and work today — client
            apps install from a link already, with no account and nothing from this site.
          </p>
          <p className="mt-sm">
            <code>plugin check</code> must pass with no problems; it is the same check this site runs on the paste and the same one
            CI runs on the index. Build <strong>unsigned</strong>: verification adds the registry signature, and a header holds one
            signature line, so an author signature would only be replaced.
          </p>
          <pre className="mt-md">
            <code>
              {BUILD.map((line) => (
                <div key={line}>{line}</div>
              ))}
            </code>
          </pre>
          <p className="hint mt-sm">A submitted file is capped at 1000 kB, which is the framework’s own limit for a plugin file.</p>
        </Card>

        <Card title="Rejected, without much discussion">
          <List items={REJECTED} />
        </Card>

        <Card title="Looked at closely, usually fixable">
          <p className="mt-sm">None of these fail a submission on their own. Expect to be asked about them.</p>
          <List items={FIXABLE} />
        </Card>

        <Card title="The metadata is part of what gets signed">
          <p className="mt-sm">
            The signature covers the header, so the name, version, author and description a client shows{' '}
            <em>before it runs anything</em> are attested rather than claimed. That is only worth something if they are true, so a
            description that oversells, understates or simply does not match the code is treated as a problem with the submission
            and not as copy to be tidied up later.
          </p>
          <p className="hint mt-sm">
            More on what a signature does and does not cover in <Link href="/docs">how verification works</Link>.
          </p>
        </Card>

        <Card title="An id belongs to whoever first had it verified">
          <p className="mt-sm">
            Submitting under an id another publisher already holds is refused, so nobody can take a name out from under its author.
          </p>
          <p className="mt-sm">
            Don’t change your own id either. It is how clients recognise a plugin and how people’s settings are keyed, so a new id
            is a new plugin with nobody’s settings.
          </p>
        </Card>

        <Card title="Every version is reviewed">
          <p className="mt-sm">
            An update changes <code>version</code>, <code>sha256</code> and the file together, and the code is read again. There is
            no tier that lets a trusted publisher skip review, because &ldquo;get something benign verified, then push an
            update&rdquo; is the attack that actually reaches people. Reviewers read a diff against the last approved version, which
            is what makes reviewing every release affordable.
          </p>
          <p className="hint mt-sm">Changes to only a description or tags are not re-reviewed.</p>
        </Card>

        <Card title="Removal and revocation">
          <p className="mt-sm">
            Ask for your own listing to be taken down in an issue or a pull request that deletes the directory. A version that turns
            out to be harmful is removed from the index and added to the revocation list by id, version and hash, which client apps
            feed into <code>plugins.blocked</code>.
          </p>
          <p className="hint mt-sm">
            If a listed version is harmful, say so privately first — see the framework’s{' '}
            <a href={`https://github.com/${config.frameworkRepo}/blob/main/SECURITY.md`}>SECURITY.md</a> — so it can be revoked
            before it is publicised. Revocation is only as fast as a client’s next fetch, so it is a mitigation, not a recall.
          </p>
        </Card>

        <Card title="Review takes as long as it takes">
          <p className="mt-sm">
            Reviews are done by people in their own time, and there is no queue position to quote you. If it is slow, it is slow —
            and a plugin you host yourself works perfectly well in the meantime.
          </p>
          <p className="hint mt-sm">
            Questions about a submission belong in an issue on{' '}
            <a href={`https://github.com/${config.registry.repo}`}>{config.registry.repo}</a>.
          </p>
        </Card>
      </div>
    </>
  );
}
