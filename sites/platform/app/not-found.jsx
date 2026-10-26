import Link from 'next/link';

export const metadata = { title: 'Not found' };

export default function NotFound() {
  return (
    <>
      <h1>Not found</h1>
      <p className="lede" style={{ marginTop: 10 }}>
        That page does not exist.
      </p>
      <div className="row" style={{ marginTop: 20 }}>
        <Link className="btn secondary" href="/">
          Home
        </Link>
      </div>
    </>
  );
}
