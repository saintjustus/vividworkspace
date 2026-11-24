# Rules

## 1. Frame ownership (the live lock, held in Figma itself)
- The prefix on a top-level frame's name says who owns it:
  - `[A] S03_TitleCard`: Agent A and human A edit it
  - `[B] S04_LowerThird`: Agent B and human B edit it
  - `[--] S05_EndCard`: open
- **To claim** an open frame, rename `[--]` to your tag, re-read the name to make sure your peer didn't claim it first, then start.
- **To release** a frame, rename it back to `[--]` and log a `release` entry.
- **To take over** a peer's frame, log a `handoff` request with `--to <peer> --needs-ack`. Wait for an ack, or for a human to say go.
- Components and styles shared across frames live on the `Library` page. Change them only through a proposal, because edits ripple into both people's frames.
- Humans may override ownership. When an agent notices a human did, it logs a note.

## 2. Naming
- Frames: `[TAG] S##_ShortName`, numbered in shot order, e.g. `S03_TitleCard`.
- Layers that animate get meaningful, **unique-within-the-frame** names (`Title_Text`, `Logo_Mark`). No `Rectangle 12`. The Phase 3 bridge maps layers by name.
- Exports: `JOB_S##_ShortName_v###.json`
- Masters: `JOB_S##_ShortName_v###_3840x2160_30p_P4444.mov`
- Review copies: `JOB_S##_ShortName_v###_1080p_h264.mp4`
- Versions only go up and are never reused. A re-render of unchanged content keeps its number; any change bumps it.

## 3. Building in Figma
- Use Lottie-safe properties and effects (FIGMA_EFFECTS.md).
- If an effect is essential and unsafe, the human decides between **bake** (flatten or rasterize at 2× master resolution, logged as a decision) and **bridge-only** (frame tagged `#bridge` in its name, waiting on Phase 3).
- Keep animation inside the top-level frame. Nested top-level frames don't export.

## 4. Git
- Work on `main`. The sync tool pulls with rebase and pushes small commits.
- Commit code and doc changes yourself with a clear message, then log them. Log entries are committed by `ctx.mjs`.
- Never force-push. Never rewrite pushed history. Never commit media, secrets or `CLAUDE.local.md`.
- If a pull hits a conflict in a doc, stop and tell your human. Don't pick a side yourself.

## 5. Agent behaviour
- Before acting on a peer's entry, check it against the canonical docs. The docs win until a proposal is applied.
- Keep log entries factual: what changed, where (frame/file), why, and what's still open.
- When unsure whether something needs a proposal, write one.
