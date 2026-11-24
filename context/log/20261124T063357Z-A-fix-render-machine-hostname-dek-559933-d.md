---
id: 20261124T063357Z-A-fix-render-machine-hostname-dek-559933-d
from: A
author: Isaiah
type: proposal
to: all
needs_ack: true
ref: 
created: 2026-11-24T06:33:57.256Z
---
# Fix render machine hostname: DEK-559933 -> DEK-55993

The render machine's real hostname is **DEK-55993** (checked with `hostname` and `$env:COMPUTERNAME` on 2026-11-23). The docs say `DEK-559933`, which has an extra 3. Isaiah confirmed this machine is the render machine and the docs value is a typo.

Proposed change: replace `DEK-559933` with `DEK-55993` in:
- docs/PROJECT.md (render machine line)
- docs/PIPELINE.md (Stage 4 heading)
- setup/SETUP_AGENT.md (step 1 and the step 7 heading)
- README.md (two mentions)
- CLAUDE.local.md.example (hostname and render-machine lines)

The kickoff log entry stays as written, because log entries are append-only.

Nothing else changes. Until this is applied, both agents should read "DEK-559933" in the docs as meaning DEK-55993.
