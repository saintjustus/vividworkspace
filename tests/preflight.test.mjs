// Runs figma/preflight.js against a mock Figma tree. Usage: node tests/preflight.test.mjs
import fs from "node:fs";
import path from "node:path";
import assert from "node:assert/strict";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const src = fs.readFileSync(path.join(root, "figma", "preflight.js"), "utf8");

function build(nodes, parent = null) {
  return nodes.map((n) => {
    const node = { visible: true, effects: [], fills: [], strokes: [], ...n, parent };
    if (n.children) node.children = build(n.children, node);
    return node;
  });
}
function makeFigma(tree, { motion = true } = {}) {
  const page = { type: "PAGE", name: "Page 1" };
  const [frame] = build([tree], page);
  const index = {};
  (function walk(n) { index[n.id] = n; (n.children || []).forEach(walk); })(frame);
  return { motion: motion ? {} : undefined, getNodeByIdAsync: async (id) => index[id] || null };
}
async function run(tree, frameId, opts) {
  const code = src.replace('"REPLACE_WITH_NODE_ID"', JSON.stringify(frameId));
  const fn = new Function("figma", `return (async () => { ${code} })();`);
  return fn(makeFigma(tree, opts));
}

// 1. Clean frame -> READY
const clean = {
  id: "1:1", type: "FRAME", name: "[A] S01_Title", width: 1920, height: 1080,
  children: [
    { id: "1:2", type: "RECTANGLE", name: "BG_Plate", fills: [{ type: "SOLID" }], effects: [{ type: "LAYER_BLUR" }] },
    { id: "1:3", type: "TEXT", name: "Title_Text", fills: [{ type: "GRADIENT_LINEAR" }], manualKeyframeTracks: { opacity: [], x: [] } },
    { id: "1:4", type: "BOOLEAN_OPERATION", booleanOperation: "SUBTRACT", name: "Logo_Cut" },
  ],
};
let r = await run(clean, "1:1");
assert.equal(r.verdict, "READY", JSON.stringify(r, null, 1));
assert.equal(r.counts.BLOCK, 0);
assert.equal(r.motionApi, "available");
assert.equal(r.masterScaleHint, 2);

// 2. Problem frame -> NOT READY with expected rules
const bad = {
  id: "2:1", type: "FRAME", name: "S02_Promo", width: 3840, height: 2160,
  children: [
    { id: "2:2", type: "RECTANGLE", name: "Rectangle 4", effects: [{ type: "NOISE" }, { type: "DROP_SHADOW" }, { type: "BACKGROUND_BLUR", visible: false }] },
    { id: "2:3", type: "ELLIPSE", name: "Orb", fills: [{ type: "GRADIENT_ANGULAR" }] },
    { id: "2:4", type: "RECTANGLE", name: "Sweep", fills: [{ type: "GRADIENT_LINEAR" }], manualKeyframeTracks: [{ field: "fills" }] },
    { id: "2:5", type: "TEXT", name: "Counter", fills: [{ type: "SOLID" }], manualKeyframeTracks: { characters: [] }, animationStyles: [{ id: "s" }] },
    { id: "2:6", type: "BOOLEAN_OPERATION", booleanOperation: "UNION", name: "Badge", children: [
      { id: "2:7", type: "VECTOR", name: "Badge_A", effects: [{ type: "SHADER_FX_2026" }] },
    ] },
    { id: "2:8", type: "RECTANGLE", name: "Hidden_Glass", visible: false, effects: [{ type: "GLASS" }] },
    { id: "2:9", type: "RECTANGLE", name: "Clip", fills: [{ type: "VIDEO" }] },
  ],
};
r = await run(bad, "2:1");
const rules = r.issues.map((i) => `${i.level} ${i.rule}`);
assert.equal(r.verdict, "NOT READY");
for (const expected of [
  "BLOCK effect:NOISE", "WARN effect:DROP_SHADOW", "BLOCK fills:GRADIENT_ANGULAR", "BLOCK animated:gradient",
  "BLOCK animated:text", "WARN animated:textStyle", "BLOCK boolean:UNION", "BLOCK effect:SHADER_FX_2026",
  "BLOCK fills:VIDEO", "WARN ownership", "INFO naming",
]) assert.ok(rules.includes(expected), `missing ${expected}\n${rules.join("\n")}`);
assert.ok(!rules.some((x) => x.includes("BACKGROUND_BLUR")), "hidden effect should be skipped");
assert.ok(!rules.some((x) => x.includes("GLASS")), "hidden layer should be skipped");
assert.equal(r.issues[0].level, "BLOCK", "BLOCKs sorted first");

// 3. Bridge mode downgrades bridgeable BLOCKs but not booleans
const bridgeSrc = src.replace("const BRIDGE_MODE = false", "const BRIDGE_MODE = true");
const fn = new Function("figma", `return (async () => { ${bridgeSrc.replace('"REPLACE_WITH_NODE_ID"', '"2:1"')} })();`);
r = await fn(makeFigma(bad));
assert.deepEqual(r.issues.filter((i) => i.level === "BLOCK").map((i) => i.rule), ["boolean:UNION"]);

// 4. No motion API, nested frame, missing node
r = await run({ id: "3:1", type: "FRAME", name: "[B] S03", width: 100, height: 100, children: [] }, "3:1", { motion: false });
assert.match(r.motionApi, /^unavailable/);
r = await run(clean, "9:9");
assert.match(r.error, /not found/);

console.log("preflight tests passed");
