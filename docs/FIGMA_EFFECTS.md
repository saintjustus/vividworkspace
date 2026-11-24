# Figma Effects and Lottie Export

The standard exporter is the LottieFiles Figma plugin ("Figma Motion export"). This table follows its documented support, with Figma's own help article as a second source.

| Safe (OK) | Check in preview (WARN) | Don't use unless baked or bridge-only (BLOCK) |
|---|---|---|
| Position, opacity, size, rotation, scale | Drop shadow (keep it static) | Animated gradients |
| Corner radius | Spring easing: comes out as sampled keyframes, so check the feel | Angular and diamond gradients |
| Trim path | Raster images: must be at least master resolution at their largest on-screen size | Background blur |
| Solid fills and strokes, static linear/radial gradients | Custom pivot points on rotate/scale | Inner shadow |
| Layer blur | Text stagger and other animation styles on text | Noise, texture, glass, shader effects |
| Masks | | Animated text content (the characters change) |
| Subtract boolean | | Union, intersect and exclude booleans (fix: flatten) |
| Easing curves | | Video fills |

## Fixes for BLOCK items
| Item | Fix now (bake) | Phase 3 (bridge) |
|---|---|---|
| Union / intersect / exclude | Select it and Flatten (Ctrl/Cmd+E): becomes one vector | Not needed |
| Static noise / texture / glass / shader | Rasterize the layer at 2× master resolution and use the image | Rebuild as a shader |
| Background blur / inner shadow | Rasterize at 2× if static | Rebuild as a filter |
| Animated gradient | Crossfade two static-gradient layers with opacity | Native gradient animation |
| Animated text content | Separate text layers, one per state, crossfaded or cut | Native text animation |
| Angular / diamond gradient | Rasterize at 2× | Shader |
| Video fill | Remove; composite the video at render or edit time | Remotion `<Video>` |

Sources: LottieFiles docs, "Figma Motion export"; Figma Help, "Export animations from Figma". Both were checked on Nov 23, 2026.
