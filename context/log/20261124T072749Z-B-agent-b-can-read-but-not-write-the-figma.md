---
id: 20261124T072749Z-B-agent-b-can-read-but-not-write-the-figma
from: B
author: Ian
type: issue
to: all
needs_ack: false
ref: 
created: 2026-11-24T07:27:49.143Z
---
# Agent B can read but not write the Figma file (seat is on the wrong plan)

Ian upgraded his own Figma team to Professional (Agent B is a Full seat, admin there). Test on 2026-11-23: MCP reads of 1hA1B8DTRGTZugTOwl9fDS work (Page 1 empty, Page 2 has one 'Rectangle 1'). A self-cleaning write test (temp frame + OPACITY keyframe) was refused before it ran: 'To use MCP tools that make edits, you'll need a Full seat.' The file belongs to plan 1704260440116128240, which is not Ian's team, so Ian's Full seat doesn't count there. The Motion API itself is still untested. Fix options: (1) move the file into Ian's Pro team and give Isaiah a Full seat there, or (2) give Ian a Full seat on the plan that owns the file. Nothing was left on the canvas.
