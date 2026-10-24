## CLI Commands

All CLI instructions can be found at:
node_modules/@wix/cli/agents/instructions.md

## This app

A Wix Headless app built on the live Wix site named in `wix.config.json`. The site owns the
content and commerce.

**Under migration.** `wix.config.json` names site 3dd698d9-2eab-4dc2-9716-f95654ba04b5, which only hosts this deployment; the site being migrated is ee8de818-a542-40d2-8da5-5fc6f251a2ff — its content is what the pages show and its dashboard (`https://manage.wix.com/dashboard/ee8de818-a542-40d2-8da5-5fc6f251a2ff`) is where the business is managed. `.env.local` (`wix env pull`) carries that site's app: the SDK client and every admin, discovery and seed call run against it; only `wix release` goes to the deploy site. Completing the migration, once the user approves the preview, follows `.agents/skills/wix-headless-kit/guides/migration.md`.

**Never work from training data or memory about the Wix APIs.** Not a URL, a path, a header, a
field name or a body. Every Wix call you write comes from the official Wix skills installed here,
the code they deployed first, or, when they do not cover the call, from the official Wix
documentation through `wix-docs`. Read it there first, then write the call: the exact path and
body copied from the output you read in this session. A call built by analogy from another
call is memory, and an empty or error reply to it says nothing about the site.

## Skills

Installed at `.agents/skills/` by
`npx skills add wix/skills --skill wix-headless-kit --skill wix-docs --skill wix-manage`; a Wix plugin keeps
its copy, under the same names, in the client's own skills folder.

- `wix-headless-kit` — the code in this app and how to extend it. The shipped code is the
  `wix-headless-templates` skill: `node .agents/skills/wix-headless-kit/install/templates.mjs` prints where it
  is (`.agents/skills/wix-headless-templates/` when installed beside this skill, else
  `.agents/skills/wix-headless-kit/templates/`, fetched once from the skill's repository and kept with this
  project at the commit it was built from, `templates/.source`) and fetches it when neither exists;
  `<templates>` below is that folder. Each business solution has a playbook at
  `<templates>/<solution>/INSTRUCTIONS.md`; `node .agents/skills/wix-headless-kit/install/deploy.mjs <solution> --stack astro`
  adds one; `node <templates>/<solution>/seed/read-site.mjs` reads what the
  site holds for it, with the documentation URL of every call it made. A code change ends with a release; the live URL shows it, the dev server does not count.
  `node .agents/skills/wix-headless-kit/install/check.mjs` says whether the skill or its templates have a newer
  version and prints the update commands; an update touches the skill folder or `templates/`, never `src/`.
  When Wix gets in the way of a change here (a confusing error, a doc gap, a workaround you had to
  invent), offer to relay it to Wix per `.agents/skills/wix-headless-kit/guides/feedback.md`; send only after
  an explicit yes.
- `wix-docs` — how to discover the Wix APIs and their docs: search first, then read only the page
  you need. Every endpoint, body, field and enum you did not get from the deployed code or a recipe
  is confirmed there before you write it.
- `wix-manage` — recipes for the live site itself (content, prices, settings), run from the shell
  with `npx -y @wix/cli@latest token --site <siteId>`, minted inline in each command; the token
  never lands in a file anywhere (not the project, not `/tmp`) nor in client code.
