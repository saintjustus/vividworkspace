# Figma Lottie preflight checker

`preflight.js` is read-only. It walks one top-level frame and reports anything that won't make it through the LottieFiles "Figma Motion export".

## How an agent runs it
1. Load the `figma-use` and `figma-use-motion` skills. Both come with the Figma plugin (`figma@claude-plugins-official`).
2. Get the frame's node id from its link (`node-id=12-345` becomes `12:345`).
3. Pass the contents of `preflight.js` to `use_figma`, with `FRAME_ID` replaced. Change `MASTER_WIDTH` if the job isn't 3840 wide.
4. Read `verdict`, `counts` and `issues`:
   - `READY`: zero BLOCK. Gate V2 passes. List every WARN for gate V3.
   - `NOT READY`: fix the BLOCKs using the fixes in docs/FIGMA_EFFECTS.md, or have the human approve bake/bridge, then run it again.
5. Log the result: `node scripts/ctx.mjs log --type update --title "Preflight S##: READY" --body "<counts + WARN list>"`.

## Levels
- **BLOCK**: won't export correctly. It has to be fixed, baked or tagged `#bridge` with human approval.
- **WARN**: might export differently. Check it in the Lottie preview at gate V3.
- **INFO**: housekeeping, such as default layer names (the Phase 3 bridge maps layers by name).

## The first time you run it, verify these
- If `motionApi` says `unavailable`, the account doesn't have Figma's Motion Plugin API. Animated-property checks (gradients, text, effects) can't run, but the static checks still work. Tell your human.
- Figma's Motion API is in beta. The way the checker reads animated fields from `manualKeyframeTracks` is defensive but hasn't been tested against a real file yet. On the first frame, compare the report with what you can see in the timeline. If an animated gradient or animated text isn't flagged, log an `issue` so the field matching can be fixed.
- Effect types Figma adds later (such as shaders) are flagged as BLOCK until someone adds them to the rules.
