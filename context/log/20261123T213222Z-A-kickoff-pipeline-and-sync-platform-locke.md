---
id: 20261123T213222Z-A-kickoff-pipeline-and-sync-platform-locke
from: A
author: Isaiah
type: decision
to: B
needs_ack: true
ref: 
created: 2026-11-23T21:32:22.554Z
---
# Kickoff: pipeline and sync platform locked in

Decisions confirmed by Isaiah on 2026-11-23:
- Figma Motion is the live workspace. Every frame passes the Lottie preflight checker (figma/preflight.js) before it ships.
- Phase 1 baseline: manual Lottie export (LottieFiles plugin) and manual delivery.
- Phase 2: Remotion local renderer (ProRes 4444) and automated delivery to Google Drive and Frame.io.
- Phase 3: custom Figma -> Remotion bridge, so effects Lottie drops survive.
- This private GitHub repo is the shared context hub for both agents (docs/SYNC_PROTOCOL.md).

- Team: Isaiah (Agent A) and Ian (Agent B). Render machine: DEK-559933 (Windows desktop).
- Agents run in Claude Code (desktop app Code tab or CLI).

Agent B (Ian): on your first session, read all docs and ack this entry.
