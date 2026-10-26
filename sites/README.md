# sites

The web properties for the plugin and theme ecosystem. Each is self-contained — its own
`package.json`, its own build — so any can move to its own repository without a code change.

| | | |
| --- | --- | --- |
| [platform/](platform/) | `platform.yapin.dev` | Publisher accounts, submissions, verification, API tokens. **Built** |
| plugins/ | `plugins.yapin.dev` | Browsing the plugin index. Not built yet |
| themes/ | `themes.yapin.dev` | Browsing themes. Not built yet |

Nothing here is involved in publishing the index. That is `scripts/` plus the two workflows at the
repository root, and it keeps working whether or not these sites exist.

## Theming

All three share one look, taken from [yapin.gg](https://yapin.gg) itself so the ecosystem doesn't feel
bolted on. The tokens are in [platform/app/globals.css](platform/app/globals.css), copied from
Yapin's own stylesheet:

```css
--bg-rail:#141519  --bg-side:#1b1c21  --bg-main:#222329  --bg-elev:#2b2c33
--bg-hover:#2f3038 --bg-active:#383944 --bg-input:#2d2e36
--text:#ececf1     --text-muted:#9c9daa --border:#ffffff12
--accent:#ff6b4a   --accent-hover:#ff5a35 --accent-soft:#ff6b4a29
--danger:#f2555a   --success:#3fcf82   --warning:#f5b544
--radius:10px      Inter 15px/1.4, font-feature-settings: "cv11","ss01","calt"
```

The component rules under the tokens reproduce Yapin's own `.btn`, `.input`, `.field` and `.card`
rather than inventing a second set, so a control here looks like the same control there.

Two notes if you touch this:

- **Yapin's accent is coral (`#ff6b4a`).** The framework's installer page and `runtime.logColor`
  default to a purple (`#7c5cff`), so they don't currently match Yapin'. Worth reconciling one way or
  the other.
- Yapin' ships a `data-theme=light` too. These sites are dark-only for now, and the token block is
  the only thing a light theme would need to override.

When you build the other two, lift `globals.css` and `components/ui.jsx` across rather than
re-deriving the look. If a third copy appears, that is the point to make it a shared package.
