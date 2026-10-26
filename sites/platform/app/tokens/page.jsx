import { redirect } from 'next/navigation';
import { CreateTokenForm, RevokeTokenForm } from '../../components/TokenForms.jsx';
import { Card, Empty } from '../../components/ui.jsx';
import { currentUser } from '../../lib/auth.js';
import { listTokens } from '../../lib/store.js';

export const metadata = { title: 'API tokens' };

export default async function Tokens() {
  const user = await currentUser();
  if (!user) redirect('/auth/login?returnTo=%2Ftokens');
  const list = listTokens(user.id);

  return (
    <div style={{ maxWidth: 620, margin: '0 auto' }}>
      <h1>API tokens</h1>
      <p className="lede" style={{ margin: '10px 0 22px' }}>
        For publishing from a script or from CI. A token is not needed to read the index or download a plugin — those are
        public.
      </p>

      <CreateTokenForm />

      <div style={{ marginTop: 22 }}>
        {list.length ? (
          <Card>
            <table>
              <thead>
                <tr>
                  <th>Label</th>
                  <th>Token</th>
                  <th>Last used</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {list.map((t) => (
                  <tr key={t.id}>
                    <td>
                      <strong>{t.label}</strong>
                      <div className="hint">{t.scopes.join(', ')}</div>
                    </td>
                    <td className="mono">{t.preview}</td>
                    <td className="mono">{t.lastUsedAt ? t.lastUsedAt.slice(0, 10) : 'never used'}</td>
                    <td style={{ textAlign: 'right' }}>
                      <RevokeTokenForm id={t.id} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        ) : (
          <Empty>No tokens yet.</Empty>
        )}
      </div>
    </div>
  );
}
