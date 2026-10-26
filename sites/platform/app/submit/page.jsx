import { redirect } from 'next/navigation';
import SubmitForm from '../../components/SubmitForm.jsx';
import { currentUser } from '../../lib/auth.js';

export const metadata = { title: 'Submit a plugin' };

export default async function SubmitPage() {
  const user = await currentUser();
  if (!user) redirect('/auth/login?returnTo=%2Fsubmit');

  return (
    <div style={{ maxWidth: 620, margin: '0 auto' }}>
      <h1>Submit a plugin</h1>
      <p className="lede" style={{ margin: '10px 0 22px' }}>
        Paste the built <code>.plugin.js</code> file. Build it unsigned — verification adds the registry signature, and a header
        holds one signature line.
      </p>
      <SubmitForm />
    </div>
  );
}
