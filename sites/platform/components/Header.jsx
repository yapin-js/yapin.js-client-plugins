import Image from 'next/image';
import Link from 'next/link';
import { endSession } from '../lib/auth.js';
import { config } from '../lib/config.js';

/**
 * The top bar. The sign-out form is a server action, so Next rejects it unless the Origin matches —
 * that is the CSRF protection, and there is no token to pass around.
 */

const NAV = [
  { href: '/dashboard', label: 'Dashboard', auth: true },
  { href: '/submit', label: 'Submit', auth: true },
  { href: '/tokens', label: 'Tokens', auth: true },
  { href: '/docs', label: 'Docs' },
  { href: `https://github.com/${config.frameworkRepo}`, label: 'GitHub', external: true },
];

function Avatar({ user }) {
  if (user.avatarUrl) {
    /* eslint-disable-next-line @next/next/no-img-element -- an arbitrary external avatar host */
    return (
      <span className="avatar">
        <img src={user.avatarUrl} alt="" width={32} height={32} />
      </span>
    );
  }
  const initial = (user.displayName || user.username || '?').trim().charAt(0).toUpperCase();
  return <span className="avatar">{initial}</span>;
}

export default function Header({ user, path = '/' }) {
  async function signOut() {
    'use server';
    await endSession();
    const { redirect } = await import('next/navigation');
    redirect('/');
  }

  return (
    <header className="top">
      <Link className="brand" href="/">
        <Image className="mark" src="/logo.png" alt="" width={38} height={38} priority />
        <span>
          yapin.js <span className="sub">platform</span>
        </span>
      </Link>
      <nav>
        {NAV.filter((item) => !item.auth || user).map((item) =>
          item.external ? (
            <a className="gh" key={item.href} href={item.href} target="_blank" rel="noreferrer">
              {item.label}
            </a>
          ) : (
            <Link key={item.href} href={item.href} aria-current={path === item.href ? 'page' : undefined}>
              {item.label}
            </Link>
          ),
        )}
        {user ? (
          <>
            <span className="who">
              <Avatar user={user} />
              <span className="name">{user.displayName || user.username}</span>
            </span>
            <form action={signOut} style={{ display: 'contents' }}>
              <button className="btn ghost small" type="submit">
                Sign out
              </button>
            </form>
          </>
        ) : (
          <Link className="btn small" href="/auth/login">
            Sign in with Yapin&rsquo;
          </Link>
        )}
      </nav>
    </header>
  );
}
