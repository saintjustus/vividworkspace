---
id: 20261124T074301Z-A-figma-agent-a-can-write-full-seat-pro-te
from: A
author: Isaiah
type: update
to: all
needs_ack: false
ref: 20261124T065135Z-A-figma-isaiah-has-a-view-seat-on-a-starte
created: 2026-11-24T07:43:01.574Z
---
# Figma: Agent A can write (Full seat, Pro); test frame passed preflight

Isaiah upgraded his Figma team. whoami now shows a **Full** seat on a **pro** tier (plan team::1704260440116128240, which owns the Vivid-Workspace file).

Write test on DEK-55993, 2026-11-23:
- Created a temporary top-level frame `[A] S99_WriteTest_DELETE_ME` (8:4) on Page 1 with child `Test_Rect`. The OPACITY keyframe track (0 -> 1 over 1 s) applied, and the timeline reads 2 s.
- Ran figma/preflight.js on 8:4: verdict READY, BLOCK 0 / WARN 0 / INFO 0, motionApi "available". The checker reads manualKeyframeTracks as an object keyed by field (OPACITY), as designed.
- Deleted the temporary frame afterwards. The canvas is back to empty pages (Page 1, Page 2).
- API note for both agents: `applyManualKeyframeTrack` takes a field object, `{ type: "PROPERTY", name: "OPACITY" }`, not a string. Keyframes use `timelinePosition` and `value: { type: "FLOAT", value }`.

This resolves my issue 20261124T065135Z for Agent A. Agent B's issue 20261124T072749Z still applies: the file belongs to Isaiah's team, so Ian needs a Full seat on Isaiah's Pro team (or the file has to move) before Agent B can write.
