import Link from 'next/link';
import { redirect } from 'next/navigation';
import { Card, Empty, Notice, TrustTag } from '../../components/ui.jsx';
import { currentUser } from '../../lib/auth.js';
import { getPublisher, listSubmissions } from '../../lib/store.js';

export const metadata = { title: 'Dashboard' };

/** A submission's state, as one of the trust tiers the client runtime knows. */
function trustOf(state) {
  if (state === 'verified') return 'verified';
  if (state === 'rejected') return 'rejected';
  return 'pending';
}

export default async function Dashboard({ searchParams }) {
  const user = await currentUser();
  if (!user) redirect('/auth/login?returnTo=%2Fdashboard');

  const { submitted } = await searchParams;
  const publisher = getPublisher(user.id);
  const submissions = listSubmissions({ publisherId: user.id });

  return (
    <>
      {submitted ? <Notice kind="success">Submitted. It is in the review queue.</Notice> : null}

      <div className="spread mb-lg">
        <div>
          <h1>Your submissions</h1>
          <p className="hint mt-xs">
            Signed in as {user.displayName}
            {publisher?.firstSeen ? ` · member since ${publisher.firstSeen.slice(0, 10)}` : null}
          </p>
        </div>
        <Link className="btn" href="/submit">
          Submit a plugin
        </Link>
      </div>

      {submissions.length ? (
        <Card>
          <table>
            <thead>
              <tr>
                <th>Plugin</th>
                <th>Version</th>
                <th>State</th>
                <th>Submitted</th>
              </tr>
            </thead>
            <tbody>
              {submissions.map((s) => (
                <tr key={s.key}>
                  <td>
                    <strong>{s.meta?.name ?? s.id}</strong>
                    <div className="hint">{s.id}</div>
                  </td>
                  <td className="mono">{s.version}</td>
                  <td>
                    <TrustTag trust={trustOf(s.state)} />
                    {s.reviewNote ? <div className="hint mt-xs">{s.reviewNote}</div> : null}
                  </td>
                  <td className="mono">{s.submittedAt.slice(0, 10)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      ) : (
        <Empty>Nothing submitted yet.</Empty>
      )}
    </>
  );
}
