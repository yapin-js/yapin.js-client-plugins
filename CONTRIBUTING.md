# Submitting a plugin

## Before you open a pull request

Your plugin should already work, and be something people can install from a link today. Listing it
here is a distribution step, not a development one.

```sh
cd my-plugin
npx yapin-client plugin check          # must pass with no problems
npx yapin-client plugin build          # dist/<id>.plugin.js
npx yapin-client plugin entry -o entry.json
```

**Build unsigned.** The registry signs the reviewed copy with its own key, and the header holds one
signature line, so an author signature would be replaced. Your identity is recorded in the entry and
in the pull request itself.

## What to add

One directory, named exactly your plugin's id:

```
plugins/<id>/entry.json
plugins/<id>/plugin.js
```

- `entry.json` is what `plugin entry` printed. Keep `downloadUrl` pointing at where *you* publish the
  file — it is recorded as `sourceUrl` so the committed copy can be checked against it later.
- `plugin.js` is the built file itself, byte for byte, unsigned. Its sha256 must match the entry.

Then:

```sh
npm install
npm run check -- --only <id>
```

That runs exactly what CI runs. Open the pull request when it passes.

## What a review looks at

A reviewer reads the whole of `plugin.js`. The file is a single bundled module, which is the point:
there is nothing else to read.

Rejected without much discussion:

- Obfuscated, minified or otherwise unreadable code. Submit the bundle, not a mangled one.
- Reading or sending the account token, password fields, or message content to anywhere that isn't a
  service the plugin obviously needs and declares.
- Loading code from a URL at runtime, unless there's a reason that survives being asked about. A
  signature cannot cover it, so it undoes most of what listing the plugin is for.
- Anything that misrepresents what it does, including a description that doesn't match the code.
- Patching Yapin’ in ways that break other plugins' patches, rather than using the framework's patcher.

Looked at closely, usually fixable:

- Work in `start()` that isn't registered through `ctx`, so stopping the plugin leaves it running.
- Network calls without an `api.services` entry or a declared host.
- Settings that default to on and do something surprising.
- `apiVersion` or `minClientVersion` claiming more compatibility than the code has.

Review is done by people in their own time. If it's slow, it's slow — and a plugin you host yourself
works fine in the meantime.

## Updating a listed plugin

Open a pull request that changes `version`, `sha256` and `plugin.js` together. Changes to the code
are reviewed again; changes to only the description or tags are not.

Don't change `id`. It is how clients recognise the plugin and how people's settings are keyed, so a
new id is a new plugin with nobody's settings.

## Removing one

Ask, in an issue or a pull request that deletes the directory. If a listed version turns out to be
harmful, say so privately first — see the framework's
[SECURITY.md](https://github.com/yapin-js/yapin.js-client/blob/main/SECURITY.md) — so it can be
revoked before it is publicised.
