# The registry signing key

`registry.pub` is the public half of the key this registry signs reviewed plugins with. It is the
file a client app author copies into their config:

```js
plugins: {
  trust: {
    keys: [{ id: 'yapin-registry', label: 'Verified', key: '<the contents of registry.pub>' }],
  },
}
```

It is committed deliberately. A public key is meant to be published, and taking it from here — rather
than from the index it verifies — is the whole point: an index that carries its own verification key
certifies itself and proves nothing.

The private half is never in this repository. It lives in the `REGISTRY_KEY` repository secret, and
`scripts/publish.js` is the only thing that touches it.

## Creating it, the first time

```sh
npx yapin-client plugin keygen -o registry
```

That writes `registry` (private) and `registry.pub` (public). Then:

1. Put the contents of `registry` in the `REGISTRY_KEY` repository **secret**.
2. Put the contents of `registry.pub` in the `REGISTRY_PUBLIC_KEY` repository **variable**, so
   `publish.js` can check its own signatures after writing them.
3. Commit `registry.pub` here, as `keys/registry.pub`.
4. Delete your local copy of the private key, or move it to a password manager. There is no way to
   recover it, and no way to re-sign old releases without it.

## Rotating it

Client apps hold the key in their own config, so a rotation needs them to ship an update — you cannot
do it unilaterally. Announce it, publish the new public key here alongside the old one, and give
clients a release window where they trust both. Then sign with the new key only.
