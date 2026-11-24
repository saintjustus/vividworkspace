# Sync Protocol: How the Two Agents Stay in Step

## Where context lives
| Layer | Location | Shared? | How it changes |
|---|---|---|---|
| Canonical docs | `CLAUDE.md`, `docs/*` | Yes, identical | Proposal, then peer ack, then human OK, then applied |
| Status tables | "Current jobs" in PROJECT.md | Yes | Edit directly, commit, log an `update` |
| Agent log | `context/log/*.md`, one file per entry | Yes, append-only | `ctx.mjs log` |
| Live ownership | Frame name prefixes in Figma | Yes, live | Rename (RULES.md §1) |
| Machine settings | `CLAUDE.local.md` | **No** | Edit locally |
| Read receipts | `.ctx/state.json` | **No** | Written automatically by `ctx.mjs sync` |

Each log entry is its own file, so two agents logging at the same moment never get a merge conflict.

## Automatic sync (Claude Code hooks in `.claude/settings.json`)
- **Session start:** pulls from GitHub, then injects unread peer entries, open proposals and pending acks into the agent's context.
- **Each prompt:** does the same, at most once every 5 minutes.
- **End of turn:** if there are uncommitted or unpushed changes, the agent is asked once to commit and log them before stopping.

## Entry types
| Type | Use | Usually needs ack? |
|---|---|---|
| `update` | Finished work, gate results, status | No |
| `decision` | A human-approved choice that doesn't change the docs (e.g. "S04 uses bake") | No |
| `proposal` | A suggested change to the canonical docs or the shared Library | **Yes** |
| `ack` | Confirms you've read an entry and will follow it (`--ref <id>`) | No |
| `applied` / `rejected` | Closes a proposal (`--ref <id>`) | No |
| `handoff` | Asks to take over or hand over a frame | **Yes** |
| `claim` / `release` | Record of a change in frame ownership | No |
| `feedback` | A review note for the owner of a frame (from Frame.io or a human) | **Yes** |
| `issue` | A blocker or a problem with the pipeline | Optional |

## Rules for updating your local context from your peer
1. **Read before you act.** Unread peer entries are handled before new work. Anything addressed to you, or to `all`, with needs-ack must be acked (`--type ack --ref <id>`) before you do work that touches it.
2. **Facts update directly.** If a peer entry changes a fact (status, ownership, file location, link), update the status table if needed, commit, and log an `update`. Don't wait for approval. The same goes for filling a `_fill in_` placeholder in the docs (links, your own machine row): fill it, commit, push, log an `update`.
3. **Rules update through proposals.** If peer feedback suggests changing how you work, it isn't in force yet. Either it becomes a `proposal`, or you ack an existing proposal. Once the peer has acked and a human has OK'd it, the **proposer** edits the docs, commits, and logs `applied --ref <proposal id>`. The other agent picks it up at its next sync, because the docs are shared.
4. **Docs win.** If a peer entry contradicts the canonical docs and no applied proposal covers it, follow the docs and log an `issue` addressed to the peer.
5. **Feedback ownership.** `feedback` on a frame goes to that frame's owner, who acks it and then either fixes it or declines with a reason (gate V6).
6. **Your own machine stays local.** Paths, OS details and preferences go in `CLAUDE.local.md`, never in shared docs.
7. **Identical docs are checked.** `ctx.mjs check` fails if your `docs/` or `CLAUDE.md` differ from `origin/main`. Fix that before working.

## Commands
```
node scripts/ctx.mjs init --agent A --name "Isaiah"        # once per machine
node scripts/ctx.mjs sync                                  # pull, show unread peer entries
node scripts/ctx.mjs status                                # open proposals, pending acks, doc check
node scripts/ctx.mjs check                                 # exits 1 if docs differ from origin/main
node scripts/ctx.mjs log --type update --title "Preflight S03: READY" --body "0 BLOCK, 2 WARN: ..."
node scripts/ctx.mjs log --type proposal --title "Allow layer blur on text" --to all --needs-ack --body-file note.md
node scripts/ctx.mjs log --type ack --ref <entry-id> --title "Ack: will follow"
node scripts/ctx.mjs show <entry-id>
```
