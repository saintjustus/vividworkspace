// Lottie preflight checker v1
// Run through the Figma MCP `use_figma` tool, with the figma-use and figma-use-motion skills loaded.
// READ-ONLY: it inspects one top-level frame and returns a report. It changes nothing.
// Before running, set FRAME_ID (and MASTER_WIDTH if the job isn't 4K UHD).
// Written as an async function body that ends in `return report`. If use_figma wants a different
// wrapper, adapt it the way the figma-use skill describes and keep the logic the same.

const FRAME_ID = "REPLACE_WITH_NODE_ID"; // e.g. "12:345" (from the frame's link, node-id=12-345)
const MASTER_WIDTH = 3840;
const BRIDGE_MODE = false; // Phase 3: when true, bridge-rebuildable BLOCKs become WARNs

// ---- rule tables (match docs/FIGMA_EFFECTS.md) ----
const EFFECT_RULES = {
  LAYER_BLUR: ["OK"],
  DROP_SHADOW: ["WARN", "Drop shadow: keep it static and compare against the Lottie preview (exporters differ)."],
  INNER_SHADOW: ["BLOCK", "Inner shadow doesn't export to Lottie.", "Rasterize at 2x master res, or tag #bridge.", true],
  BACKGROUND_BLUR: ["BLOCK", "Background blur doesn't export to Lottie.", "Rasterize at 2x if static, or tag #bridge.", true],
  NOISE: ["BLOCK", "Noise effect doesn't export to Lottie.", "Rasterize at 2x, or tag #bridge.", true],
  TEXTURE: ["BLOCK", "Texture effect doesn't export to Lottie.", "Rasterize at 2x, or tag #bridge.", true],
  GLASS: ["BLOCK", "Glass effect doesn't export to Lottie.", "Rasterize at 2x, or tag #bridge.", true],
};
const PAINT_RULES = {
  SOLID: ["OK"],
  GRADIENT_LINEAR: ["OK"],
  GRADIENT_RADIAL: ["OK"],
  GRADIENT_ANGULAR: ["BLOCK", "Angular gradient doesn't export to Lottie.", "Rasterize at 2x, or tag #bridge.", true],
  GRADIENT_DIAMOND: ["BLOCK", "Diamond gradient doesn't export to Lottie.", "Rasterize at 2x, or tag #bridge.", true],
  IMAGE: ["WARN", "Raster image: must be at least master resolution at its largest on-screen size."],
  VIDEO: ["BLOCK", "Video fills don't export to Lottie.", "Remove it and composite the video at render/edit time.", true],
};
const BLOCK_BOOLEANS = new Set(["UNION", "INTERSECT", "EXCLUDE"]);
const DEFAULT_NAME = /^(Rectangle|Ellipse|Frame|Group|Vector|Line|Polygon|Star|Text|Union|Subtract|Intersect|Exclude|Image|Component|Instance|Arrow|Shape)( \d+)?$/;

// ---- helpers ----
const issues = [];
let motionApi = "unknown";
let rootNode = null;

function pathOf(node) {
  const parts = [];
  let n = node;
  while (n && n !== rootNode && n.type !== "PAGE") { parts.unshift(n.name); n = n.parent; }
  return parts.join(" / ") || node.name;
}
function add(level, node, rule, detail, fix, bridgeable) {
  if (level === "BLOCK" && BRIDGE_MODE && bridgeable) level = "WARN";
  issues.push({ level, id: node.id, layer: pathOf(node), rule, detail, fix: fix || "" });
}
function animatedFields(node) {
  const fields = [];
  try {
    const tracks = node.manualKeyframeTracks;
    if (tracks) {
      if (Array.isArray(tracks)) {
        for (const t of tracks) fields.push(String(t && (t.field || t.property || t.name || t.type) || "track"));
      } else if (typeof tracks === "object") {
        for (const k of Object.keys(tracks)) fields.push(k);
      }
    }
  } catch (e) {
    if (motionApi === "unknown" || motionApi === "available") motionApi = "unavailable: " + String(e && e.message || e).slice(0, 120);
  }
  try {
    const styles = node.animationStyles;
    if (styles && styles.length) fields.push("__animationStyle");
  } catch (e) { /* ignore */ }
  return fields;
}
function paintsOf(node, prop) {
  try {
    const p = node[prop];
    if (Array.isArray(p)) return p;
    if (p !== undefined && p !== null && typeof p !== "string") return "MIXED";
  } catch (e) { /* ignore */ }
  return [];
}

function checkNode(node) {
  if (node.visible === false) return; // hidden layers are skipped

  // default layer names (the Phase 3 bridge maps layers by name)
  if (node !== rootNode && DEFAULT_NAME.test(node.name)) {
    add("INFO", node, "naming", "Default layer name: give animated layers unique, meaningful names (RULES.md section 2).");
  }

  // effects
  let effects = [];
  try { effects = Array.isArray(node.effects) ? node.effects : []; } catch (e) { effects = []; }
  for (const fx of effects) {
    if (!fx || fx.visible === false) continue;
    const rule = EFFECT_RULES[fx.type];
    if (!rule) add("BLOCK", node, "effect:" + fx.type, "Unrecognized effect type '" + fx.type + "' (e.g. a shader). Treat it as unsupported until it's verified.", "Rasterize at 2x, or tag #bridge.", true);
    else if (rule[0] !== "OK") add(rule[0], node, "effect:" + fx.type, rule[1], rule[2], rule[3]);
  }

  // fills and strokes
  let hasGradient = false;
  for (const prop of ["fills", "strokes"]) {
    const paints = paintsOf(node, prop);
    if (paints === "MIXED") { add("WARN", node, prop + ":mixed", "Mixed " + prop + " (e.g. styled text ranges): check by hand."); continue; }
    for (const p of paints) {
      if (!p || p.visible === false) continue;
      if (String(p.type).startsWith("GRADIENT")) hasGradient = true;
      const rule = PAINT_RULES[p.type];
      if (!rule) add("BLOCK", node, prop + ":" + p.type, "Unrecognized paint type '" + p.type + "'.", "Replace it with a solid or a linear/radial gradient, or rasterize.", true);
      else if (rule[0] !== "OK") add(rule[0], node, prop + ":" + p.type, rule[1], rule[2], rule[3]);
    }
  }

  // booleans
  if (node.type === "BOOLEAN_OPERATION" && BLOCK_BOOLEANS.has(node.booleanOperation)) {
    add("BLOCK", node, "boolean:" + node.booleanOperation, node.booleanOperation + " boolean doesn't export to Lottie.", "Select it and Flatten (Ctrl/Cmd+E).", false);
  }

  // animated properties
  const fields = animatedFields(node);
  if (fields.length) {
    const f = fields.join(",").toLowerCase();
    if (/fill|stroke|paint|color/.test(f) && hasGradient) add("BLOCK", node, "animated:gradient", "Animated gradient doesn't export to Lottie.", "Crossfade two static-gradient layers, or tag #bridge.", true);
    if (/character|text/.test(f)) add("BLOCK", node, "animated:text", "Animated text content doesn't export to Lottie.", "One text layer per state, crossfaded or cut.", true);
    if (/effect|blur|shadow/.test(f)) add("BLOCK", node, "animated:effect", "Animated effects don't export to Lottie.", "Rebuild with opacity/transform, or tag #bridge.", true);
    if (node.type === "TEXT" && fields.includes("__animationStyle")) add("WARN", node, "animated:textStyle", "Animation style on text (e.g. text stagger): check it in the Lottie preview.");
    if (/rotation|rotate|scale/.test(f)) add("INFO", node, "animated:pivot", "Rotate/scale animation: check the pivot point matches in the Lottie preview.");
  }

  if ("children" in node && node.children) for (const c of node.children) checkNode(c);
}

// ---- run ----
try { motionApi = figma.motion ? "available" : "unavailable: figma.motion is missing"; }
catch (e) { motionApi = "unavailable: " + String(e && e.message || e).slice(0, 120); }
rootNode = await figma.getNodeByIdAsync(FRAME_ID);
if (!rootNode) return { checker: "lottie-preflight", version: 1, error: "Node " + FRAME_ID + " not found. Check FRAME_ID (use '12:345', not '12-345')." };

if (!rootNode.parent || rootNode.parent.type !== "PAGE") {
  add("BLOCK", rootNode, "structure", "Not a top-level frame. Only top-level frames export.", "Move it to the top level of the page, or run on its parent shot frame.", false);
}
const ownerMatch = /^\[(A|B|--)\]/.exec(rootNode.name);
if (!ownerMatch) add("WARN", rootNode, "ownership", "Frame name has no owner tag ([A], [B] or [--]).", "Rename it to '[TAG] S##_Name' (RULES.md section 1).");
if (/#bridge/i.test(rootNode.name) && !BRIDGE_MODE) add("INFO", rootNode, "bridge-tag", "Frame is tagged #bridge: it's waiting on the Phase 3 bridge, so BLOCKs are expected.");

checkNode(rootNode);

const counts = { BLOCK: 0, WARN: 0, INFO: 0 };
for (const i of issues) counts[i.level]++;
const order = { BLOCK: 0, WARN: 1, INFO: 2 };
issues.sort((a, b) => order[a.level] - order[b.level]);

const report = {
  checker: "lottie-preflight",
  version: 1,
  frame: { id: rootNode.id, name: rootNode.name, owner: ownerMatch ? ownerMatch[1] : null, width: rootNode.width, height: rootNode.height },
  verdict: counts.BLOCK === 0 ? "READY" : "NOT READY",
  counts,
  motionApi,
  bridgeMode: BRIDGE_MODE,
  masterScaleHint: rootNode.width ? +(MASTER_WIDTH / rootNode.width).toFixed(2) : null,
  issues: issues.slice(0, 200),
  truncated: issues.length > 200,
};
return report;
