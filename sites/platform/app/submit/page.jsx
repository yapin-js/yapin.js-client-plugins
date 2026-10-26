import Link from 'next/link';
import { redirect } from 'next/navigation';
import SubmitForm from '../../components/SubmitForm.jsx';
import { currentUser } from '../../lib/auth.js';

export const metadata = { title: 'Submit a plugin' };

export default async function SubmitPage() {
  const user = await currentUser();
  if (!user) redirect('/auth/login?returnTo=%2Fsubmit');

  return (
    <div className="panel">
      <h1>Submit a plugin</h1>
      <p className="lede tight">
        Paste the built <code>.plugin.js</code> file. Build it unsigned — verification adds the registry signature, and a header
        holds one signature line.
      </p>
      <p className="hint mb-lg">
        Worth a look first: the <Link href="/guidelines">plugin guidelines</Link> say what a reviewer turns away on sight.
      </p>
      <SubmitForm />
    </div>
  );
}
