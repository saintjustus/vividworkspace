# Validation Gates

Each gate's evidence goes in a log entry, so both agents and both humans can see where every shot stands.

| Gate | When | Who | Pass condition | Evidence to log |
|---|---|---|---|---|
| **V0 Sync** | Start of session, before work | Each agent | `ctx.mjs sync` ran, unread peer entries read, needs-ack entries acked; `ctx.mjs check` passes (docs identical to `origin/main`) | Nothing unless it fails; then log an `issue` |
| **V1 Ownership** | Before editing a frame | Agent | Frame name starts with your tag, confirmed after renaming | `claim` entry for new claims |
| **V2 Preflight** | Before calling a frame ready | Owning agent | `figma/preflight.js` verdict READY (0 BLOCK); each WARN noted | `update` entry with counts and the WARN list |
| **V3 Export match** | After the Lottie export | Owning human + agent | The Lottie preview matches Figma playback at start, midpoint, end and every key pose; each WARN item checked | `update` entry: pass/fail for each checkpoint |
| **V4 Master check** | After rendering | Agent on the render machine | `ffprobe` shows the spec'd resolution, fps, duration/frame count, codec `prores` profile 4444 and `yuva444p10le` (alpha) | `update` entry with the ffprobe summary |
| **V5 Delivery** | After upload | Agent on the render machine | File name follows RULES.md; it's in the Drive delivery folder and `rclone check` reports 0 differences; it's in the Frame.io project; links work | `update` entry titled `Delivered S## v###` with links and the `rclone check` summary |
| **V6 Feedback closed** | After a revision | Owning agent | Every Frame.io comment on that version has a `feedback` entry, and each one is answered (fixed or declined, with a reason) | `update` entry referencing the feedback ids |

## V4 command
```
ffprobe -v error -select_streams v:0 -show_entries stream=codec_name,profile,width,height,r_frame_rate,pix_fmt,nb_frames -of default=nw=1 MASTER.mov
```
Expected: `codec_name=prores`, `profile=4444` (or `4444 XQ`), `pix_fmt=yuva444p10le`, plus the job's width, height and rate.
