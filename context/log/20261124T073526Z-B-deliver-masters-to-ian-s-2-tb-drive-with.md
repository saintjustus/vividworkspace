---
id: 20261124T073526Z-B-deliver-masters-to-ian-s-2-tb-drive-with
from: B
author: Ian
type: proposal
to: all
needs_ack: true
ref: 
created: 2026-11-24T07:35:26.450Z
---
# Deliver masters to Ian's 2 TB Drive with rclone from the render machine

# Deliver masters to Ian's 2 TB Drive with rclone from the render machine

## Why
- **Accounts:** Ian's 2 TB Google account is a personal account. Isaiah's is a Google Workspace Business account with 30 GB.
- **Today's plan doesn't fit.** Stage 5 has the render machine (DEK-55993) copy masters into a folder synced by Google Drive for desktop. In a regular shared folder, each file counts against whoever uploaded it. Every master would go into Isaiah's 30 GB, which holds about 4 minutes of 4K ProRes 4444 (roughly 450 GB per hour, estimated).
- **The usual fixes don't work here:**
  - A personal account can't create a shared drive.
  - Workspace accounts can't join a Google One family group, so Isaiah can't use Ian's 2 TB that way.
  - Pooled storage only combines users inside one Workspace organization.

## Proposal
The render machine uploads masters **as Ian's account**, so Ian owns the files and they count against his 2 TB. Isaiah's own storage is never used.

1. **Install rclone on the render machine** (exact version pinned in the setup notes) with a remote named `vivid-drive`. It is set to Drive's `drive.file` scope, so rclone can only see files it created itself, not the rest of Ian's Drive.
2. **Ian does the one-time Google sign-in himself** (in person on the render machine, or remotely). The token stays in rclone's config on DEK-55993 and never goes into git, the log or chat. Ian can revoke it at any time under Google Account → Security → Third-party connections.
3. **rclone creates the delivery folder:** `rclone mkdir vivid-drive:VividWorkspace_Delivery`. Under `drive.file`, rclone can't see a folder Ian made by hand, so it has to create its own. Ian then shares that folder with Isaiah as Editor, and its link replaces the current delivery link in PROJECT.md.
4. **Delivery happens only after gate V4 passes**, never from an always-on watch folder, so unchecked renders never reach Drive:
   - `rclone copy <master> vivid-drive:VividWorkspace_Delivery/<JOB>/` (copy, never move, so the local master stays)
   - `rclone check` against the local file (size + MD5) is the V5 evidence
   - In Phase 2 these steps go into a small `scripts/deliver.mjs` that also writes the `Delivered S## v###` log entry.
5. **Google Drive for desktop is no longer needed** on the render machine for delivery.

### Known limits
- **Daily cap:** Google allows 750 GB of uploads per account per day. That's about 1.5 hours of masters, plenty for this project.
- **Token expiry:** if rclone's shared app hits rate limits, we switch to our own Google Cloud app for rclone. That app must be set to "In production", because apps left in "Testing" have sign-ins that expire after 7 days and would silently break delivery.
- **Storage fills fast:** 2 TB is about 4 hours of ProRes 4444 masters. We need a retention rule (see open questions).

## Doc changes once approved
- **PROJECT.md**, Tools table:
  - Google Drive row: requirement becomes "Ian's personal 2 TB account owns the delivery folder; the render machine uploads with rclone (`drive.file` scope)".
  - Add an rclone row.
- **PROJECT.md**, Links: Drive delivery folder link becomes the folder rclone created (a fact update once it exists).
- **PIPELINE.md**, Stage 5: the Drive bullet becomes "After V4, `rclone copy` the master to `vivid-drive:VividWorkspace_Delivery/<JOB>/`, then `rclone check`."
- **VALIDATION.md**, V5: pass condition adds "`rclone check` reports 0 differences"; evidence adds the check output.
- **CLAUDE.local.md.example**: the Drive-for-desktop line becomes "rclone remote: `vivid-drive` (render machine only)".

## Alternatives considered
- **Upgrade Isaiah's Workspace** (more storage, or Business Standard with 2 TB per user and shared drives). Cleanest, but adds a monthly cost when Ian's 2 TB is already paid for.
- **Upload as Isaiah, then hand ownership to Ian with a script.** Ownership transfer between personal and Workspace accounts is restricted and needs the recipient to accept. Fragile.
- **Sign Drive for desktop on the render machine in to Ian's account.** Rejected, because it would expose Ian's whole Drive on Isaiah's machine.

## Open questions for the humans
1. Retention: should Drive keep only the latest version of each shot, with older versions archived somewhere else?
2. Is the current delivery folder (`1vhryP9AzQGtJFVd62dUDStuDHS8IzF00`) owned by Ian's 2 TB account, and does anything in it need to move?
3. Isaiah: are you OK with a token for Ian's account (limited to this folder) living on DEK-55993?
