# Pipeline

```
[1 Design & animate in Figma] -> [2 Safety check] -> [3 Export] -> [4 Local master render] -> [5 Deliver] -> [6 Review loop]
        live, both agents          preflight.js        Lottie         Remotion (Phase 2)        Drive + Frame.io     comments -> log
```

## Stage 1: Design and animate in Figma (live)
- Both humans and both agents work in **one** Figma file.
- Every deliverable shot is a **top-level frame**, because only top-level frames export. Each one is named `[TAG] S##_ShortName`; see RULES.md.
- Agents write through the Figma MCP `use_figma` tool, with the `figma-use` and `figma-use-motion` skills loaded.
- If a motion call fails with "is not a supported API", Motion isn't enabled for that account. Stop and tell your human. Don't retry.

## Stage 2: Safety check (gate V2)
- Run `figma/preflight.js` on the frame through `use_figma`. See `figma/README.md`.
- The frame only moves on with zero BLOCK issues. Each WARN has to be checked in the Lottie preview at gate V3.
- Log the result with `ctx.mjs log --type update --title "Preflight S##: READY"`, pasting the counts into the body.

## Stage 3: Export (Phase 1, manual)
- The standard exporter is the **LottieFiles Figma plugin, "Figma Motion export"**. Its documented property support is what preflight.js checks against. Don't mix it with Figma's built-in Lottie export on the same job.
- The human exports the Lottie JSON into the local exports folder (CLAUDE.local.md) and names it as RULES.md says.
- Quick previews only: the Figma MCP `export_video` tool gives an MP4. It isn't a master.

## Stage 4: Local master render (Phase 2, to be built; runs on DEK-55993)
- Remotion with `@remotion/lottie` loads the Lottie and renders ProRes 4444 with alpha:
  `npx remotion render <entry> <comp> out.mov --codec=prores --prores-profile=4444 --pixel-format=yuva444p10le --image-format=png`
- Until Phase 2 ships, masters come from Figma's own export at the plan's maximum, or the LottieFiles export rendered by hand.

## Stage 5: Deliver (Phase 2 automation; manual for now)
- Google Drive: the master goes into the Drive-synced delivery folder.
- Frame.io: upload to the job's project folder (the V4 API, or the Frame.io MCP once it's set up).
- Log a `delivery` update entry with file names and links.

## Stage 6: Review loop
- Frame.io comments are turned into `feedback` log entries, addressed to the owner of the frame.
- The owning agent makes the revision, then the frame goes back through stages 2 to 5 with the version number bumped.

## Phase 3: Custom bridge (replaces stage 3 later)
- Read keyframes and properties from Figma (`get_motion_context`, `node.manualKeyframeTracks`) and generate Remotion components.
- Rebuild effects Lottie can't carry (noise, glass, background blur, inner shadow, animated gradients, animated text) as WebGL/SVG filters.
- Once it works, preflight.js gets a "bridge mode" that downgrades those BLOCKs to WARNs.
