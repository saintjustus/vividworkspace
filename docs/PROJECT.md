# Project Context

## Purpose
Two people, each working with their own Claude agent, design and animate motion graphics together in one live Figma file. Masters are rendered at high resolution on a local desktop and delivered to Frame.io and Google Drive.

## People and agents
| Tag | Human | Agent | Machine (hostname) / OS |
|---|---|---|---|
| A | Isaiah Mincher | Claude Code (Agent A) | DEK-55993 / Windows 11 Pro (render machine) |
| B | Ian | Claude Code (Agent B) | DESKTOP-0KMSU9O / Windows 11 Pro |

**Render machine: `DEK-55993` (Windows desktop).** Local master renders (Phase 2), gate V4 (master check) and gate V5 (delivery) run there, done by whichever agent is set up on that machine.

Both agents run in **Claude Code**, either the **Code tab of the Claude desktop app** or the `claude` CLI, opened at the root of this repo. The Chat and Cowork tabs and claude.ai Projects don't load these instructions, hooks or the sync tool.

## Tools and accounts
| Tool | Used for | Requirement |
|---|---|---|
| Figma (Motion) | Live design and animation workspace | Professional plan or higher; a **Full seat** for each person whose agent writes to the file |
| Figma plugin for Claude Code | The Figma remote MCP (agents read and write the canvas) plus Figma's skills, including `figma-use` and `figma-use-motion` | Enabled in `.claude/settings.json`; install with `/plugin install figma@claude-plugins-official`, then sign in through `/mcp` |
| GitHub (private repo) | This repo: shared docs, agent log, scripts, and later the bridge and renderer code | Both humans are collaborators |
| LottieFiles Figma plugin | Exporting Figma Motion to Lottie (Phase 1) | |
| Remotion | Local master renderer (Phase 2) | Check the licence: free for individuals and organisations of up to 3 people |
| Frame.io | Client review and delivery | Contributor access or higher to upload |
| Google Drive | Delivery and archive | The delivery folder lives in Ian's personal 2 TB account. The render machine uploads with rclone signed in as that account, so files use Ian's storage. Google Drive for desktop isn't used for delivery |
| rclone | Uploads masters to the Drive delivery folder (render machine only) | Remote `vivid-drive`, `drive.file` scope (sees only files it created). Ian signs in himself; the token stays in rclone's config on the render machine, never in git, the log or chat |

## Links
- Figma file: https://www.figma.com/design/1hA1B8DTRGTZugTOwl9fDS/Vivid-Workspace
- Frame.io project: _paste link_
- Google Drive delivery folder: _fill in once rclone creates `VividWorkspace_Delivery` in Ian's account (setup/SETUP_AGENT.md step 7)_
- Old delivery folder (before rclone, not used for delivery): https://drive.google.com/drive/folders/1vhryP9AzQGtJFVd62dUDStuDHS8IzF00

## Default deliverable spec (change per job in the job table)
- Master: 3840×2160, project frame rate, ProRes 4444 with alpha (`yuva444p10le`)
- Review copy: 1920×1080 H.264 MP4
- File naming is in RULES.md

## Roadmap
| Phase | Scope | Status |
|---|---|---|
| 1. Baseline | Figma live workspace, safety checker, shared context repo, manual Lottie export and delivery | **In progress** |
| 2. Renderer and delivery | Remotion renders Lottie to ProRes 4444; rclone upload to Drive after gate V4, plus Frame.io upload | Not started |
| 3. Custom bridge | Read keyframes from Figma over MCP and rebuild them natively in Remotion, so effects Lottie drops (noise, glass, background blur, etc.) survive | Not started |

## Current jobs (status table, may be edited directly)
| Job | Frames | Owner | Stage | Notes |
|---|---|---|---|---|
| _example_ | `[A] S01_Title` | A | Design | |
