import { Funnel_Display, Inter } from 'next/font/google';
import Header from '../components/Header.jsx';
import { Notice } from '../components/ui.jsx';
import { config } from '../lib/config.js';
import { currentUser } from '../lib/auth.js';
import './globals.css';

// Yapin' uses Inter with these feature settings; next/font self-hosts it so there is no third-party
// request on every page load.
const inter = Inter({ subsets: ['latin'], display: 'swap', variable: '--font-inter' });

// Funnel Display is the face yapin.gg sets its landing headlines in; here it is headings only.
const display = Funnel_Display({ subsets: ['latin'], display: 'swap', variable: '--font-display' });

export const metadata = {
  title: { default: 'yapin.js platform', template: '%s · yapin.js platform' },
  description: 'Publish and verify plugins and themes for Yapin’ client apps.',
  robots: { index: true, follow: true },
  icons: { icon: '/logo.png' },
};

export const viewport = {
  themeColor: '#141519',
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
};

// Sessions are cookie-based, so nothing here can be statically rendered.
export const dynamic = 'force-dynamic';

export default async function RootLayout({ children }) {
  const user = await currentUser();
  const devAuth = config.devAuth && !config.production;

  return (
    <html lang="en" data-theme="dark" className={`${inter.variable} ${display.variable}`}>
      <body>
        <Header user={user} />
        <main>
          {devAuth ? (
            <Notice kind="warn">
              <strong>PLATFORM_DEV_AUTH is on.</strong> Anyone reaching this server is signed in as a fixed local account. For
              local work only.
            </Notice>
          ) : null}
          {children}
        </main>
        <footer>
          <span>Unofficial. Not affiliated with or endorsed by Yapin&rsquo;.</span>
          <a href={`https://github.com/${config.frameworkRepo}`}>Framework</a>
          <a href={`https://github.com/${config.registry.repo}`}>Index</a>
          <a href="/docs">Docs</a>
          <a href="/guidelines">Guidelines</a>
          <a href="/terms">Terms</a>
          <a href="/privacy">Privacy</a>
        </footer>
      </body>
    </html>
  );
}
