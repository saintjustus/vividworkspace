# motion-pipeline

The shared project brain for Isaiah (Agent A) and Ian (Agent B), each working with their own Claude agent on motion graphics in Figma. Masters render on `DEK-559933`. Agent instructions start in `CLAUDE.md`. This README is for the humans.

## How you talk to your agent
Use **Claude Code**: either the **Code tab** in the Claude desktop app (no terminal needed) or the `claude` CLI. The Chat and Cowork tabs and claude.ai Projects can't run the sync tool, git or hooks, so they won't stay in step.

## Setup
**Isaiah, first:**
1. Install the Claude desktop app, Git for Windows (the Code tab needs it on Windows) and Node.js LTS.
2. On GitHub, create an **empty private** repo named `motion-pipeline`, with no README or license.
3. Unzip this folder somewhere under `C:\Users\<you>\`, e.g. `C:\Users\<you>\Projects\motion-pipeline`.
4. Open the Code tab, choose **Local**, select the folder, approve the project hooks and the Figma plugin when asked, and paste the Agent A prompt from `setup/INIT_PROMPTS.md`. Your agent pushes the repo to GitHub.
5. Add Ian as a collaborator (repo Settings → Collaborators).

**Ian, after that:**
1. Install the same three apps, then clone the repo, e.g. `git clone <url> C:\Users\<you>\Projects\motion-pipeline`.
2. Open it in the Code tab and paste the Agent B prompt from `setup/INIT_PROMPTS.md`.

The agents handle the rest: identity, local folders, the Figma connection and motion check, the render-machine tools on DEK-559933, the self-tests and the first log entries.

## Daily use
Just work. Hooks pull your peer's updates when a session starts and every 5 minutes while you're prompting. At the end of a turn, they nudge the agent to commit and log. Handy commands:
- `node scripts/ctx.mjs status`: what's waiting on you or on your peer
- `node scripts/ctx.mjs check`: confirms your docs are identical to GitHub

## Layout
```
CLAUDE.md              shared agent instructions (identical on both machines)
docs/                  project, pipeline, rules, validation gates, sync protocol, effects table
setup/                 agent setup procedure and the two init prompts
figma/preflight.js     Lottie safety checker, run through the Figma MCP
scripts/ctx.mjs        context sync tool (log, sync, status, check)
context/log/           shared agent log, one file per entry
tests/                 checker self-test
.claude/settings.json  hooks and the Figma plugin
```
