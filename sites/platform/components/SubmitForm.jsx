'use client';
import { useActionState } from 'react';
import { useFormStatus } from 'react-dom';
import { submitPlugin } from '../app/actions.js';
import { Card, Notice } from './ui.jsx';

/**
 * A client component only so the form can show the error the action returned and disable itself while
 * it's in flight. The checking and the writing all happen in the server action.
 */

function Submit() {
  const { pending } = useFormStatus();
  return (
    <button className="btn" type="submit" disabled={pending}>
      {pending ? 'Checking…' : 'Submit for review'}
    </button>
  );
}

export default function SubmitForm() {
  const [state, action] = useActionState(submitPlugin, {});
  const values = state?.values ?? {};

  return (
    <>
      {state?.error ? <Notice kind="error">{state.error}</Notice> : null}
      <Card pad>
        <form action={action}>
          <div className="field">
            <label htmlFor="sourceUrl">Where you publish it (optional)</label>
            <input
              className="input"
              id="sourceUrl"
              name="sourceUrl"
              type="url"
              placeholder="https://example.com/my-plugin.plugin.js"
              defaultValue={values.sourceUrl ?? ''}
            />
          </div>
          <div className="field">
            <label htmlFor="source">The built file</label>
            <textarea
              className="input"
              id="source"
              name="source"
              rows={14}
              required
              placeholder={'/**\n * @id my-plugin\n * @name My plugin\n * @version 1.0.0\n * @author You\n */'}
              defaultValue={values.source ?? ''}
            />
          </div>
          <p className="hint" style={{ marginBottom: 14 }}>
            The header is checked the way a client checks it, and the id, name, version and author are read from it — there is
            nothing else to fill in.
          </p>
          <div className="row end">
            <Submit />
          </div>
        </form>
      </Card>
    </>
  );
}
