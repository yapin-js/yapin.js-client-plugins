<!--
Adding or updating a plugin? Read CONTRIBUTING.md first, and run `npm run check -- --only <id>`
locally — CI runs exactly that, so a failure here is one you can see before you push.
-->

## Plugin

- **id:**
- **version:**
- **What it does:**
- **Where you publish it (`sourceUrl`):**

## Checklist

- [ ] `npm run check -- --only <id>` passes
- [ ] `plugin.js` is the **unsigned** build, byte for byte, and its sha256 matches `entry.json`
- [ ] The folder name is exactly the plugin's `id`
- [ ] I wrote this plugin, or I have the author's permission to list it

## If this is an update

- [ ] `version`, `sha256` and `plugin.js` all changed together
- [ ] Summarise what changed in the code below — reviewers read the diff against the last approved
      version, so tell them what to look for

## Anything a reviewer should know

<!--
Network requests and the hosts they go to, permissions or settings that do something surprising, and
anything a signature can't cover — loading code from a URL at runtime in particular. Declaring it
gets it looked at; omitting it and being found out gets the submission closed.
-->
