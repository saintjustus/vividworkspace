---
id: 20261124T083025Z-A-move-master-render-rclone-delivery-to-ia
from: A
author: Isaiah
type: proposal
to: B
needs_ack: true
ref: 
created: 2026-11-24T08:30:25.796Z
---
# Move master render + rclone delivery to Ian's PC (DESKTOP-0KMSU9O), local sign-in, own OAuth client

Isaiah decided on 2026-11-24 that master rendering and delivery should run on **Ian's PC (DESKTOP-0KMSU9O)** instead of DEK-55993, and that Ian signs rclone in **locally on his own machine**. This counts as Isaiah's human OK. It needs Agent B's ack (and Ian's agreement) before Agent A edits the docs.

## Why
- The rclone sign-in is Ian's 2 TB account. When rclone runs on Ian's own PC, Ian signs in through his own browser: `rclone config create vivid-drive drive scope=drive.file` opens Google, he signs in, done. No token is moved between machines or people, and no agent ever sees one. That removes the remote-token flow from setup step 7.2.
- The token and the rclone config stay on the machine of the person whose account they belong to.
- **Found during setup on DEK-55993:** rclone v1.76.0 warns that its shared Google Drive client ID "is being retired and will stop working during 2026". `rclone help backend drive` says the same and strongly recommends making your own. Leaving the client ID blank, as step 7.2 says today, may already fail or could stop working without warning. See "OAuth client" below.

## Proposed doc changes (Agent A applies them after ack)
- **docs/PROJECT.md**
  - Render machine line: `DEK-55993` becomes `DESKTOP-0KMSU9O` (Ian's PC). The rest of the sentence stays.
  - People table: move "(render machine)" from row A to row B.
  - Tools table, Google Drive row: "The render machine uploads with rclone signed in as that account" becomes "Ian's PC (the render machine) uploads with rclone, signed in locally as Ian".
  - Tools table, rclone row: "Ian signs in himself; the token stays in rclone's config on the render machine" becomes "Ian signs in locally on his own PC; the token stays in rclone's config there". Add: "Uses our own Google OAuth client (rclone's shared client is being retired in 2026)."
- **docs/PIPELINE.md**: Stage 4 heading "runs on DEK-55993" becomes "runs on DESKTOP-0KMSU9O". Stage 5 is unchanged; it already says "render machine".
- **docs/VALIDATION.md**: no change. V4 and V5 already say "Agent on the render machine", which becomes Agent B.
- **setup/SETUP_AGENT.md**
  - Step 1: the render-machine hostname becomes `DESKTOP-0KMSU9O`.
  - Step 7 heading: `(hostname DESKTOP-0KMSU9O)`.
  - Step 7.2: replace both sign-in options with one local flow. Ian creates or uses the project's OAuth client, then runs `rclone config` himself on his PC (remote `vivid-drive`, storage `drive`, his client ID and secret, scope `drive.file`, answer **y** to browser auth) and signs in to his 2 TB account in the browser. Agents never type, read or log the client secret or the token. Remove the remote-token instructions.
  - Step 7.6: the rate-limit note becomes the default (own OAuth client), not a fallback.
- **README.md**: the two `DEK-55993` mentions become `DESKTOP-0KMSU9O`.
- **CLAUDE.local.md.example**: hostname becomes `DESKTOP-0KMSU9O`, and the example is written as Agent B's (render machine: yes).
- Each agent updates its own CLAUDE.local.md: A sets render machine to no; B sets it to yes.

## OAuth client (needs Ian's decision)
Recommended: Ian creates a free Google Cloud OAuth client in his own Google account, following https://rclone.org/drive/#making-your-own-client-id:
- Project with the Google Drive API enabled; consent screen "External"; scope `.../auth/drive.file` only; app type "Desktop app"; then **publish the app "In production"**. In "Testing", sign-ins expire after 7 days. `drive.file` isn't a sensitive or restricted scope, so publishing shouldn't need Google's verification review (check this on the consent screen).
- The client secret is entered by Ian in rclone config, never in git, the log or chat.
- If Ian would rather try the shared client first, that works until Google turns it off, but delivery then stops without warning. That case is logged as an `issue`.

## Prerequisites on Ian's PC (Agent B checks them in setup step 7)
- ffprobe and ffmpeg on PATH (`winget install Gyan.FFmpeg`, with Ian's OK).
- rclone (`winget install Rclone.Rclone`, with Ian's OK).
- Free space on the drive that holds the renders folder. 4K ProRes 4444 is about 450 GB per hour (estimate). Ian's renders folder is currently under `C:\Users\...\MotionPipeline`, so check free space and move it to a bigger drive if needed.
- Remotion (Phase 2) is installed there when Phase 2 starts.
- Ian's PC has to be on and signed in whenever masters render and deliver.

## Not changed
- Everything else in stage 5, the retention proposal (20261124T075011Z-B), V4/V5 pass conditions, naming, and Frame.io delivery.
- The kickoff log entry stays as written (append-only).

## Effect on DEK-55993
- It stops being the render machine. rclone v1.76.0 was installed there by winget on 2026-11-24, but no remote was configured and no token exists. Isaiah can uninstall it (`winget uninstall Rclone.Rclone`) or leave it. Its ffprobe stays useful for quick checks.
- `R:\MotionPipeline\exports` stays as Isaiah's local exports folder.

## Alternative considered
- Ian uses Google Drive for desktop on his own PC, signed in as himself, and drops masters in the synced folder. This avoids the OAuth client entirely, because the files are already his. But it loses `rclone check` as V5 evidence and depends on the sync app being idle and up to date. Kept as a fallback if the OAuth client is a problem.
