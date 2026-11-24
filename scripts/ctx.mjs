#!/usr/bin/env node
// ctx.mjs: shared-context sync for the two Claude agents. Needs Node 18+ and git. No dependencies.
// Commands: init | sync | log | status | check | show | stop-hook   (see docs/SYNC_PROTOCOL.md)
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const LOG_DIR = path.join(ROOT, "context", "log");
const STATE_DIR = path.join(ROOT, ".ctx");
const CONFIG_FILE = path.join(STATE_DIR, "config.json");
const STATE_FILE = path.join(STATE_DIR, "state.json");
const TYPES = ["update", "decision", "proposal", "ack", "applied", "rejected", "handoff", "claim", "release", "feedback", "issue"];
const SHARED_DOCS = ["CLAUDE.md", "docs"];

// ---------- utils ----------
function git(args) {
  return execFileSync("git", args, { cwd: ROOT, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] }).trim();
}
function tryGit(args) {
  try { return { ok: true, out: git(args) }; }
  catch (e) { return { ok: false, out: String(e.stderr || e.message || "").trim() }; }
}
const hasRemote = () => tryGit(["remote"]).out.length > 0;
const hasUpstream = () => tryGit(["rev-parse", "--abbrev-ref", "--symbolic-full-name", "@{u}"]).ok;
function readJSON(file, fallback) { try { return JSON.parse(fs.readFileSync(file, "utf8")); } catch { return fallback; } }
function writeJSON(file, data) { fs.mkdirSync(path.dirname(file), { recursive: true }); fs.writeFileSync(file, JSON.stringify(data, null, 2)); }
function die(msg, code = 1) { process.stderr.write(msg + "\n"); process.exit(code); }

function parseArgs(argv) {
  const flags = { _: [] };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a.startsWith("--")) {
      const key = a.slice(2);
      const next = argv[i + 1];
      if (next === undefined || next.startsWith("--")) flags[key] = true;
      else { flags[key] = next; i++; }
    } else flags._.push(a);
  }
  return flags;
}
function loadConfig(required = true) {
  const cfg = readJSON(CONFIG_FILE, null);
  if (!cfg && required) die("ctx: this machine isn't set up yet. Run: node scripts/ctx.mjs init --agent A|B --name \"Your Name\"");
  return cfg;
}
const loadState = () => readJSON(STATE_FILE, { seen: [], lastSync: 0 });
const saveState = (s) => writeJSON(STATE_FILE, s);

// ---------- entries ----------
function parseEntry(file) {
  const raw = fs.readFileSync(file, "utf8");
  const m = /^---\n([\s\S]*?)\n---\n?([\s\S]*)$/.exec(raw.replace(/\r\n/g, "\n"));
  const meta = {};
  if (m) for (const line of m[1].split("\n")) {
    const i = line.indexOf(":");
    if (i > 0) meta[line.slice(0, i).trim()] = line.slice(i + 1).trim();
  }
  const body = m ? m[2] : raw;
  const title = (/^#\s+(.+)$/m.exec(body) || [])[1] || path.basename(file, ".md");
  return {
    id: meta.id || path.basename(file, ".md"),
    from: meta.from || "?", author: meta.author || "", type: meta.type || "update",
    to: meta.to || "all", needs_ack: meta.needs_ack === "true", ref: meta.ref || "",
    created: meta.created || "", title, body: body.trim(), file,
  };
}
function readEntries() {
  if (!fs.existsSync(LOG_DIR)) return [];
  return fs.readdirSync(LOG_DIR).filter((f) => f.endsWith(".md")).sort()
    .map((f) => parseEntry(path.join(LOG_DIR, f)));
}
const addressedTo = (e, agent) => e.to === "all" || e.to.split(",").map((s) => s.trim()).includes(agent);
function refsOf(entries) {
  const map = {};
  for (const e of entries) if (e.ref) for (const r of e.ref.split(",").map((s) => s.trim())) (map[r] ||= []).push(e);
  return map;
}
function openItems(entries, agent) {
  const refs = refsOf(entries);
  const pendingAcks = entries.filter((e) => e.needs_ack && e.from !== agent && addressedTo(e, agent)
    && !(refs[e.id] || []).some((r) => r.from === agent && (r.type === "ack" || r.type === "rejected" || r.type === "applied")));
  const awaitingPeer = entries.filter((e) => e.needs_ack && e.from === agent
    && !(refs[e.id] || []).some((r) => r.from !== agent && (r.type === "ack" || r.type === "rejected")));
  const openProposals = entries.filter((e) => e.type === "proposal"
    && !(refs[e.id] || []).some((r) => r.type === "applied" || r.type === "rejected"));
  return { pendingAcks, awaitingPeer, openProposals };
}
const line = (e) => `- \`${e.id}\` [${e.type}] from ${e.from}${e.author ? ` (${e.author})` : ""}${e.to !== "all" ? ` to ${e.to}` : ""}: ${e.title}${e.needs_ack ? " **(needs ack)**" : ""}`;

// ---------- doc integrity ----------
function docsStatus() {
  const dirty = tryGit(["status", "--porcelain", "--", ...SHARED_DOCS]).out;
  const tree = tryGit(["rev-parse", "--short", "HEAD:docs"]);
  let diverged = "";
  if (hasUpstream()) {
    const d = tryGit(["diff", "--name-only", "HEAD", "@{u}", "--", ...SHARED_DOCS]);
    if (d.ok && d.out) diverged = d.out;
  }
  return { dirty, diverged, hash: tree.ok ? tree.out : "n/a" };
}

// ---------- commands ----------
function cmdInit(f) {
  const agent = String(f.agent || "").toUpperCase();
  if (!["A", "B"].includes(agent)) die("init needs --agent A or --agent B");
  writeJSON(CONFIG_FILE, { agent, name: f.name === true ? "" : (f.name || "") });
  if (!fs.existsSync(STATE_FILE)) saveState({ seen: f["mark-read"] ? readEntries().map((e) => e.id) : [], lastSync: 0 });
  console.log(`ctx: this machine is Agent ${agent}${f.name ? ` (${f.name})` : ""}.`);
}

function pull() {
  if (!hasRemote()) return "";
  const r = tryGit(["pull", "--rebase", "--autostash", "--quiet"]);
  return r.ok ? "" : `WARNING: git pull failed (${r.out.split("\n")[0]}). You may be missing peer updates. Tell your human if this keeps happening.`;
}

function cmdSync(f) {
  const cfg = loadConfig(!f.hook);
  if (!cfg) { console.log("Context sync: this machine isn't set up yet. Ask your human to run `node scripts/ctx.mjs init --agent A|B --name ...`."); return; }
  const state = loadState();
  if (f.throttle && state.lastSync && Date.now() - state.lastSync < Number(f.throttle) * 60000) return;
  const warn = pull();
  const entries = readEntries();
  const seen = new Set(state.seen);
  const unread = entries.filter((e) => e.from !== cfg.agent && !seen.has(e.id));
  const { pendingAcks, awaitingPeer, openProposals } = openItems(entries, cfg.agent);
  const docs = docsStatus();

  const out = [];
  out.push(`## Context sync (you are Agent ${cfg.agent}; docs tree ${docs.hash})`);
  if (warn) out.push(warn);
  if (docs.dirty) out.push(`WARNING: shared docs have uncommitted local edits. They must stay identical (SYNC_PROTOCOL rule 7):\n${docs.dirty}`);
  if (docs.diverged) out.push(`WARNING: shared docs differ from origin: ${docs.diverged.replace(/\n/g, ", ")}`);
  if (unread.length) {
    out.push(`\n### ${unread.length} unread peer entr${unread.length === 1 ? "y" : "ies"}`);
    for (const e of unread) {
      out.push(line(e));
      const body = e.body.replace(/^#\s+.+\n?/, "").trim();
      if (body) out.push("  " + (body.length > 600 ? body.slice(0, 600) + ` ... (node scripts/ctx.mjs show ${e.id})` : body).replace(/\n/g, "\n  "));
    }
  } else if (!f.hook || !f.throttle) out.push("No unread peer entries.");
  if (pendingAcks.length) { out.push("\n### Waiting on YOUR ack (ack before related work)"); pendingAcks.forEach((e) => out.push(line(e))); }
  if (openProposals.length) { out.push("\n### Open proposals"); openProposals.forEach((e) => out.push(line(e))); }
  if (awaitingPeer.length && !f.hook) { out.push("\n### Your entries waiting on the peer"); awaitingPeer.forEach((e) => out.push(line(e))); }

  // When throttled per prompt, stay quiet unless something needs attention.
  const quiet = f.throttle && !unread.length && !pendingAcks.length && !warn && !docs.dirty && !docs.diverged;
  if (!quiet) console.log(out.join("\n"));

  state.seen = [...new Set([...state.seen, ...unread.map((e) => e.id)])];
  state.lastSync = Date.now();
  saveState(state);
}

function slugify(s) { return String(s).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 40) || "entry"; }

function cmdLog(f) {
  const cfg = loadConfig();
  const type = String(f.type || "");
  if (!TYPES.includes(type)) die(`log needs --type, one of: ${TYPES.join(", ")}`);
  if (!f.title || f.title === true) die("log needs --title \"...\"");
  if (["ack", "applied", "rejected"].includes(type) && !f.ref) die(`--type ${type} needs --ref <entry-id>`);
  let body = "";
  if (f["body-file"]) body = fs.readFileSync(path.resolve(String(f["body-file"])), "utf8");
  else if (f.body && f.body !== true) body = String(f.body);
  const to = f.to && f.to !== true ? String(f.to) : "all";
  const needsAck = Boolean(f["needs-ack"]) || ["proposal", "handoff", "feedback"].includes(type);
  const now = new Date();
  const stamp = now.toISOString().replace(/[-:]/g, "").replace(/\.\d+Z$/, "Z");
  const id = `${stamp}-${cfg.agent}-${slugify(f.title)}`;
  const file = path.join(LOG_DIR, `${id}.md`);
  fs.mkdirSync(LOG_DIR, { recursive: true });
  const fm = [
    "---", `id: ${id}`, `from: ${cfg.agent}`, `author: ${cfg.name || ""}`, `type: ${type}`, `to: ${to}`,
    `needs_ack: ${needsAck}`, `ref: ${f.ref && f.ref !== true ? f.ref : ""}`, `created: ${now.toISOString()}`, "---",
  ].join("\n");
  fs.writeFileSync(file, `${fm}\n# ${String(f.title)}\n\n${body.trim()}\n`);

  const rel = path.relative(ROOT, file);
  git(["add", "--", rel]);
  git(["commit", "--quiet", "-m", `ctx(${cfg.agent}): ${type}: ${String(f.title).slice(0, 60)}`, "--", rel]);
  let pushed = !hasRemote();
  for (let i = 0; i < 3 && !pushed; i++) {
    if (tryGit(["push", "--quiet"]).ok) pushed = true;
    else tryGit(["pull", "--rebase", "--autostash", "--quiet"]);
  }
  const state = loadState(); state.seen = [...new Set([...state.seen, id])]; saveState(state);
  console.log(`logged ${id}${pushed ? "" : " (committed locally; push FAILED, so run `git push` or tell your human)"}`);
}

function cmdStatus() {
  const cfg = loadConfig();
  if (hasRemote()) tryGit(["fetch", "--quiet"]);
  const entries = readEntries();
  const seen = new Set(loadState().seen);
  const unread = entries.filter((e) => e.from !== cfg.agent && !seen.has(e.id));
  const { pendingAcks, awaitingPeer, openProposals } = openItems(entries, cfg.agent);
  const docs = docsStatus();
  let ahead = "0", behind = "0";
  if (hasUpstream()) {
    const c = tryGit(["rev-list", "--left-right", "--count", "HEAD...@{u}"]).out.split(/\s+/);
    [ahead, behind] = [c[0] || "0", c[1] || "0"];
  }
  const out = [`Agent ${cfg.agent} | docs tree ${docs.hash} | ahead ${ahead} / behind ${behind} | ${entries.length} log entries, ${unread.length} unread`];
  if (behind !== "0") out.push("Behind origin: run `node scripts/ctx.mjs sync`.");
  if (docs.dirty) out.push(`Shared docs have uncommitted edits:\n${docs.dirty}`);
  if (docs.diverged) out.push(`Shared docs differ from origin: ${docs.diverged}`);
  out.push(pendingAcks.length ? "Waiting on your ack:\n" + pendingAcks.map(line).join("\n") : "Waiting on your ack: none");
  out.push(awaitingPeer.length ? "Waiting on the peer:\n" + awaitingPeer.map(line).join("\n") : "Waiting on the peer: none");
  out.push(openProposals.length ? "Open proposals:\n" + openProposals.map(line).join("\n") : "Open proposals: none");
  console.log(out.join("\n"));
}

function cmdCheck() {
  if (hasRemote()) tryGit(["fetch", "--quiet"]);
  const docs = docsStatus();
  if (docs.dirty || docs.diverged) {
    console.log(`FAIL: shared docs are not identical to origin.\n${docs.dirty ? "Uncommitted:\n" + docs.dirty + "\n" : ""}${docs.diverged ? "Differs from origin: " + docs.diverged : ""}`);
    process.exit(1);
  }
  console.log(`OK: shared docs match ${hasUpstream() ? "origin" : "HEAD (no remote configured)"} (docs tree ${docs.hash}).`);
}

function cmdShow(f) {
  const id = f._[1];
  if (!id) die("show needs an entry id");
  const e = readEntries().find((x) => x.id === id || x.id.startsWith(id));
  if (!e) die(`no entry ${id}`);
  console.log(fs.readFileSync(e.file, "utf8"));
}

function cmdStopHook() {
  let input = {};
  try { input = JSON.parse(fs.readFileSync(0, "utf8") || "{}"); } catch { /* no stdin */ }
  if (input.stop_hook_active) process.exit(0); // never block twice in a row
  const dirty = tryGit(["status", "--porcelain"]).out;
  let unpushed = "";
  if (hasUpstream()) unpushed = tryGit(["log", "--oneline", "@{u}..HEAD"]).out;
  if (!dirty && !unpushed) process.exit(0);
  process.stderr.write(
    "Before ending this turn (docs/SYNC_PROTOCOL.md):\n" +
    (dirty ? `- Uncommitted changes:\n${dirty}\n  Commit finished work, then log it with \`node scripts/ctx.mjs log ...\`. If it's deliberately work in progress, tell your human instead.\n` : "") +
    (unpushed ? `- Unpushed commits:\n${unpushed}\n  Run \`git push\` so your peer can see them.\n` : "") +
    "If none of this applies, say so briefly and stop.\n");
  process.exit(2);
}

const f = parseArgs(process.argv.slice(2));
const cmd = f._[0];
try {
  switch (cmd) {
    case "init": cmdInit(f); break;
    case "sync": cmdSync(f); break;
    case "log": cmdLog(f); break;
    case "status": cmdStatus(); break;
    case "check": cmdCheck(); break;
    case "show": cmdShow(f); break;
    case "stop-hook": cmdStopHook(); break;
    default: die("usage: node scripts/ctx.mjs <init|sync|log|status|check|show|stop-hook> [options]   (see docs/SYNC_PROTOCOL.md)");
  }
} catch (e) {
  // Hooks must never break a session: report, then exit 0 in hook mode.
  const msg = `ctx error: ${String(e.stderr || e.message || e).trim().split("\n")[0]}`;
  if (f.hook || cmd === "stop-hook") { console.log(msg); process.exit(0); }
  die(msg);
}
