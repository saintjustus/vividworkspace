# Agent Setup Procedure

Your human started you with an init prompt that says whether you're **Agent A** (Isaiah) or **Agent B** (Ian). Work through these steps in order. After each step, give your human a one-line status. Stop and ask whenever a step needs a link, a decision, a password, or permission to install software. Never write tokens or passwords into any file or log entry.

Agent A does setup first and pushes the repo to GitHub. Agent B starts only once the repo is on GitHub and Ian has cloned it.

## 1. Confirm where you're running
- You must be **Claude Code** (the Code tab of the Claude desktop app, or the `claude` CLI) with this repo's root as the project folder. If you can't run shell commands, stop and tell your human to open this folder in the Code tab.
- Run `hostname`. If it's `DEK-559933`, **this is the render machine**, so step 7 applies to you.

## 2. Check tools
- `node --version` must be 18 or newer, and `git --version` must work.
  - If Node is missing, ask your human before running `winget install OpenJS.NodeJS.LTS`, then restart the session.
- `git config user.name` and `git config user.email` must be set. If either is empty, ask your human what to use and set them with `git config --global`.

## 3. Set your identity
- Agent A: `node scripts/ctx.mjs init --agent A --name "Isaiah"`
- Agent B: `node scripts/ctx.mjs init --agent B --name "Ian"`

## 4. Create CLAUDE.local.md
- Copy `CLAUDE.local.md.example` to `CLAUDE.local.md`. Fill in your agent letter, hostname, OS and render-machine yes/no.
- Ask your human where the exports and renders folders should go. Suggest `C:\Users\<user>\MotionPipeline\exports` and `...\renders` (on Windows) and create them. The render machine also needs the Google Drive for desktop delivery folder.
- CLAUDE.local.md is git-ignored. Don't commit it.

## 5. GitHub
- **Agent A:**
  1. Run `git remote -v`. If there's no `origin`, ask Isaiah for the URL of the **empty private** GitHub repo he created (no README or license added).
  2. Run `git remote add origin <url>`, then `git push -u origin main`. Git for Windows opens a browser sign-in the first time.
  3. Remind Isaiah to add Ian under the repo's Settings → Collaborators.
- **Agent B:** confirm `git remote -v` shows the GitHub repo, then run `git pull`.

## 6. Hooks and Figma
- **Hooks:** a "Context sync" block should have appeared at session start.
  - If it didn't, ask your human to run `/hooks` and approve this project's hooks, then restart the session.
  - Meanwhile, run `node scripts/ctx.mjs sync` yourself.
- **Figma tools:** check whether you have them (for example `use_figma`).
  - If you don't, ask your human to run `/plugin install figma@claude-plugins-official`. If slash commands aren't available, run `claude plugin install figma@claude-plugins-official` in a terminal instead.
  - Then sign in to Figma with `/mcp` and restart the session.
- **Figma access:** ask your human for the project's Figma file link.
  - Confirm the file opens through the MCP and that your human has a **Full seat** in it.
  - Ask your human to pick any test frame, then run `figma/preflight.js` on it (see `figma/README.md`). The checker is read-only.
  - Report the verdict and `motionApi`. If `motionApi` says `unavailable`, Motion isn't enabled for this account. Record that as a blocker.

## 7. Render machine only (hostname DEK-559933)
- Run `ffprobe -version`. If it's missing, ask before running `winget install Gyan.FFmpeg`, then restart the session.
- Report the free space on the drive that holds the renders folder. 4K ProRes 4444 takes several GB per minute.

## 8. Fill your placeholders in docs/PROJECT.md
SYNC_PROTOCOL rule 2 lets you fill these directly.
- **Agent A:** your machine row, plus the Figma, Frame.io and Google Drive links (ask Isaiah).
- **Agent B:** your machine row.
- Then commit with `git commit -am "docs: setup placeholders (Agent X)"` and run `git push`.
- Don't change anything else in the canonical docs.

## 9. Self-tests
- `node tests/preflight.test.mjs` should print "preflight tests passed".
- `node scripts/ctx.mjs check` should start with "OK".

## 10. Log and hand over
- **Agent B:** first ack the kickoff decision. Use `node scripts/ctx.mjs status` to find its id, then run `node scripts/ctx.mjs log --type ack --ref <kickoff id> --title "Ack: kickoff read, following docs"`.
- **Both:** log the result with `node scripts/ctx.mjs log --type update --title "Setup complete: Agent X on <hostname>" --body "<checklist with PASS/FAIL/BLOCKED per step>"`.
- Finish by giving your human the same checklist, listing blockers first.
