import { Fragment } from 'react';

/**
 * The shared pieces, in Yapin's visual language. All server-renderable: none of them hold state.
 * The class names are the ones in app/globals.css, which reproduces Yapin's own buttons and fields.
 */

export function Card({ children, pad = false, title = null }) {
  return (
    <section className={pad ? 'card pad' : 'card'}>
      {title ? <div className="card-title">{title}</div> : null}
      {children}
    </section>
  );
}

export function Notice({ children, kind = '' }) {
  return <p className={kind ? `notice ${kind}` : 'notice'}>{children}</p>;
}

export function Tag({ children, kind = '' }) {
  return <span className={kind ? `tag ${kind}` : 'tag'}>{children}</span>;
}

/** The trust tiers, named as the client runtime names them. */
const TRUST = {
  verified: ['Verified', 'ok'],
  signed: ['Signed', 'accent'],
  unverified: ['Unverified', ''],
  pending: ['In review', 'warn'],
  rejected: ['Rejected', 'danger'],
};

export function TrustTag({ trust }) {
  const [label, kind] = TRUST[trust] ?? [trust, ''];
  return <Tag kind={kind}>{label}</Tag>;
}

export function Kv({ rows }) {
  return (
    <dl className="kv">
      {rows.filter(Boolean).map(([label, value]) => (
        <Fragment key={label}>
          <dt>{label}</dt>
          <dd>{value}</dd>
        </Fragment>
      ))}
    </dl>
  );
}

export function Empty({ children }) {
  return <p className="empty">{children}</p>;
}

export function Hint({ children, style }) {
  return (
    <p className="hint" style={style}>
      {children}
    </p>
  );
}
