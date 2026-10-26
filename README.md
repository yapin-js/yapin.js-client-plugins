# yapin.js-client plugins

The index of plugins for [yapin.js-client](https://github.com/yapin-js/yapin.js-client) client apps.

This repository holds the **reviewed copy** of each listed plugin and the index that client apps read
to browse and install them. It is a plain static site: one JSON file, built by CI, served over https.
There is no server and no account.

- **Writing a plugin?** Start with
  [Developing a plugin](https://github.com/yapin-js/yapin.js-client/blob/main/docs/plugin-development.md).
  You do not need this repository to share a plugin — you can host the file yourself and give people
  the link. Listing it here gets it into the in-app browser and lets clients treat it as verified.
- **Submitting one?** Read [CONTRIBUTING.md](CONTRIBUTING.md).

## What's in here

```text
plugins/<id>/entry.json    the plugin's metadata, as `yapin-client plugin entry` prints it
plugins/<id>/plugin.js     the exact reviewed file, unsigned, as the author built it
revoked.json               plugins and versions clients should stop running
schema/entry.schema.json   what an entry.json may contain
scripts/                   the checks CI runs, runnable locally
```

CI publishes to `dist/`, which is what client apps actually fetch:

```text
dist/index.json            every listed plugin, with the registry's signature and hash
dist/revoked.json          the revocation list
dist/p/<id>.plugin.js      the reviewed file, signed with the registry key
```

## How trust works here

The registry **serves its own copy** of each reviewed plugin, signed with the registry key. That
means a client can tell that a download is the reviewed file without reaching this index at all — the
signature travels inside the file — and an author's own hosting going away doesn't break installs.
The author's original address stays in the entry as `sourceUrl`, and CI checks the committed copy
still matches it.

A client app decides for itself whether the registry key means anything. Nothing here can make a
client trust it; the client's own config lists the keys it accepts:

```js
plugins: {
  trust: {
    keys: [{ id: 'yapin-registry', label: 'Verified', key: '<the public key>' }],
  },
  registry: { url: 'https://<the published index>/index.json', enabled: true },
}
```

**Get the public key from this repository — [`keys/registry.pub`](keys/registry.pub) — not from the
index.** An index that carries the key it is verified against certifies itself and proves nothing.
`dist/index.json` lists the key for information only, so you can see which key signed what.

### What "verified" means, and what it doesn't

A listed plugin has been read by a person and the file you download is byte-for-byte the file they
read. That is all. It is not a guarantee that the code is safe, correct or maintained. Plugins run
with full access to Yapin’ in that window, including the account — review catches the obvious and the
careless, not the determined.

Specifically out of scope: a plugin may load code from a URL at runtime
(`import('https://…')`). No signature can cover what that URL serves later, so submissions that do it
are either rejected or listed with the behaviour called out in the entry.

### Revocation

When a listed plugin turns out to be harmful, it is removed from the index and added to
`revoked.json` by id, version and hash. Client apps can feed that list into `plugins.blocked`, which
refuses the plugin whether or not it is still installed. Revocation is only as fast as the client's
next fetch, so it is a mitigation, not a recall.

## Running the checks yourself

```sh
npm install
npm run check                  # every entry: schema, hashes, headers, the code
npm run check -- --only <id>   # just one
npm run fetch                  # confirm each committed copy still matches its sourceUrl
npm run publish -- --dry-run   # build dist/ without signing
```

The checks are the framework's own — `checkFile`, `verifyText` and the header parser are imported
from `yapin.js-client`, not reimplemented here, so a plugin is checked against exactly the rules the
client runtime applies.
