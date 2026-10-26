'use client';
import { useActionState } from 'react';
import { useFormStatus } from 'react-dom';
import { dropToken, makeToken } from '../app/actions.js';
import { Card, Notice } from './ui.jsx';

function Pending({ children, busy, className = 'btn' }) {
  const { pending } = useFormStatus();
  return (
    <button className={className} type="submit" disabled={pending}>
      {pending ? busy : children}
    </button>
  );
}

/**
 * Creating a token. The plaintext comes back in the action's return value rather than a redirect, so
 * it never lands in a URL, a history entry or a server log.
 */
export function CreateTokenForm() {
  const [state, action] = useActionState(makeToken, {});

  return (
    <>
      {state?.created ? (
        <Card title="Your new token">
          <p className="hint" style={{ margin: '8px 0 12px' }}>
            Copy it now. It is stored only as a hash, so this is the one time it can be shown.
          </p>
          <div className="secret">
            <code>{state.created}</code>
          </div>
        </Card>
      ) : null}
      {state?.error ? <Notice kind="error">{state.error}</Notice> : null}
      <Card pad>
        <form action={action}>
          <div className="field">
            <label htmlFor="label">What is it for?</label>
            <input className="input" id="label" name="label" placeholder="CI on my-plugin" maxLength={60} required />
          </div>
          <div className="row end">
            <Pending busy="Creating…">Create token</Pending>
          </div>
        </form>
      </Card>
    </>
  );
}

export function RevokeTokenForm({ id }) {
  return (
    <form action={dropToken} className="row end">
      <input type="hidden" name="id" value={id} />
      <Pending className="btn ghost small" busy="Revoking…">
        Revoke
      </Pending>
    </form>
  );
}
