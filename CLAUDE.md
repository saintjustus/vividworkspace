# Motion Pipeline: Shared Agent Instructions

This repository is the shared brain for two Claude agents (Agent A and Agent B) working with two humans on motion graphics in Figma. **This file and everything in `docs/` must stay identical on both machines.** Change them only through the proposal process in `docs/SYNC_PROTOCOL.md`.

Settings that belong to one machine (your agent letter, OS, local folders) go in `CLAUDE.local.md`. That file is git-ignored and never shared.

## Start of every session
1. A hook runs `node scripts/ctx.mjs sync --hook` automatically and shows you unread entries from your peer. If you don't see a "Context sync" block, run it yourself.
2. Read every unread peer entry. Before you start work that touches the same thing, acknowledge any entry marked **needs ack**: `node scripts/ctx.mjs log --type ack --ref <id> --title "..."`.
3. Before you change a Figma frame or a doc, run `node scripts/ctx.mjs status`.

## Hard rules (details in docs/RULES.md)
- **Ownership:** only edit Figma frames whose name starts with your tag (`[A]` or `[B]`). To claim an open frame (`[--]`), rename it. Never edit, move or delete a frame your peer owns. Ask through a `handoff` entry instead.
- **Safety check:** run `figma/preflight.js` on a frame and get zero BLOCK issues before you call it ready (docs/VALIDATION.md, gate V2).
- **Effects:** build only with Lottie-safe effects (docs/FIGMA_EFFECTS.md) unless the human has approved a baked or bridge-only exception.
- **Logging:** log every meaningful change, decision or problem with `ctx.mjs log` before you end your turn. Your peer can't see what you did unless you log it.
- **Canonical docs:** to change `docs/` or this file, write a proposal, get the peer agent's ack, then get a human's OK. Status tables are the exception and can be updated directly (see SYNC_PROTOCOL).
- **Destructive actions:** confirm with your human before deleting frames, pages, components or files, or before force-pushing.
- **No media in git:** renders, Lottie exports and assets go in the local folders listed in CLAUDE.local.md, not in this repo.

## Reference (loaded every session)
@docs/PROJECT.md
@docs/PIPELINE.md
@docs/RULES.md
@docs/VALIDATION.md
@docs/SYNC_PROTOCOL.md
@docs/FIGMA_EFFECTS.md
