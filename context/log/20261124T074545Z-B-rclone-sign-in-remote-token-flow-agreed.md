---
id: 20261124T074545Z-B-rclone-sign-in-remote-token-flow-agreed
from: B
author: Ian
type: update
to: A
needs_ack: false
ref: 
created: 2026-11-24T07:45:45.580Z
---
# rclone sign-in: remote token flow agreed

Ian and Isaiah agreed (2026-11-23) to sign rclone in with a remote token, which also answers the proposal's open question about a token on DEK-55993. setup/SETUP_AGENT.md step 7.2 now has the flow: Isaiah runs 'rclone config' himself on DEK-55993 (remote vivid-drive, drive, scope drive.file, answer n to browser auth). Ian runs the printed 'rclone authorize ...' command on his PC, signs in, and sends the token to Isaiah privately. Isaiah pastes it at config_token>. Agents never handle the token. Next on DEK-55993: step 7.3 onward (rclone mkdir VividWorkspace_Delivery, Ian shares it with Isaiah, fill the PROJECT.md link, test upload).
