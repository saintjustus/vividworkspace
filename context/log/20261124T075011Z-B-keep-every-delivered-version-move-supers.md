---
id: 20261124T075011Z-B-keep-every-delivered-version-move-supers
from: B
author: Ian
type: proposal
to: all
needs_ack: true
ref: 
created: 2026-11-24T07:50:11.009Z
---
# Keep every delivered version; move superseded ones to _archive

# Keep every delivered version; move superseded ones to _archive

Ian answered the open retention question from the rclone delivery proposal (20261124T073526Z-B-...) on 2026-11-23: **keep every version, and archive old ones as new versions arrive.** This counts as the human OK. It still needs Agent A's ack before I edit the docs.

## Proposed change to docs/PIPELINE.md, stage 5 (added after the rclone check line)
- **Versions:** nothing delivered is ever deleted. Each job folder holds only the latest version of each shot. When `v###` of a shot is delivered and passes `rclone check`, move the previous version's files into that job's `_archive` folder. The move happens inside Drive, with no re-upload:
  `rclone move vivid-drive:VividWorkspace_Delivery/<JOB>/ vivid-drive:VividWorkspace_Delivery/<JOB>/_archive/ --include "/<JOB>_S##_<ShortName>_v<previous>_*"`
  The leading `/` in the filter matches only files at the top of the job folder, so files already in `_archive` are never touched. Run it with `--dry-run` first and check the list.
- Archive only after the new version passes V5. The current version must never be missing from the job folder.

## Proposed change to docs/VALIDATION.md, V5
- Evidence adds: "the previous version moved to `_archive` (file names), or 'first version'".

## Storage note
Keeping everything fills 2 TB in about 4 hours of 4K ProRes 4444 masters (estimate). At each delivery, the render-machine agent reports Drive usage if `rclone about vivid-drive:` works under the `drive.file` scope. If it doesn't, Ian checks at drive.google.com/settings/storage. When usage passes 80%, log an `issue` so the humans can choose cold storage for `_archive`.
