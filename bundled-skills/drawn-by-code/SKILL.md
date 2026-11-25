---
name: drawn-by-code
description: Animation and motion graphics drawn entirely with code (JavaScript, HTML5 Canvas 2D / WebGL2, Chromium & ffmpeg) — no AI video generation, no After Effects. Orchestrates 20+ visual styles (paper-cutout, clay, clay3d, risograph, pixel-art, blueprint, 70s-poster, cereal-ad, comic, engraving, felt3d, kaleidoscope, lightfield, line, liquid-light, micrograph, skate-toon, souvenir, sumi-e, tabletop3d), engine rendering, shot-by-shot scripts, and automated frame review. Use when asked to create code-driven animations, motion graphics, explainer videos, reels, logos, or animate with drawn-by-code styles.
---

# Drawn by Code: Programmatic Animation & Motion Graphics Engine

Animations and videos made **with code** (JavaScript paints every frame on HTML5 `<canvas>` 2D or WebGL2 deterministically, Chromium and ffmpeg render to MP4). No After Effects, no AI-generated video: every torn edge, fingerprint, hand and motion is code.

## 🌟 Available Styles (20 Artistic Drawing Kits)

- `paper-cutout`: Torn paper layers, depth shadows, cutout puppets, stop-motion texture
- `clay` & `clay3d`: Plasticine modeling, fingerprint dents, stop-motion claymation
- `risograph`: Vibrant spot colors, halftone dot grain, misregistration print offsets
- `pixel-art`: Authentic retro raster graphics, color indexing, grid snapping
- `blueprint`: Technical cyanotype architectural plans, white measurement lines, grid paper
- `70s-poster`: Vintage psychedelic typography, airbrushed gradients, warm saturated retro palette
- `cereal-ad`: Saturday morning cartoon style, bold ink outlines, poppy cel-shading
- `comic`: Halftone ben-day dots, comic book panels, speech bubbles, dynamic action lines
- `engraving`: Vintage bank-note etching, copperplate cross-hatching, fine line density
- `felt3d`: Soft felt & wool craft stop-motion, fuzzy fiber edges, tactile stitching
- `kaleidoscope`: Symmetrical optical reflections, psychedelic mandalas, rotational geometry
- `lightfield`: Photorealistic synthetic light rays, volumetric haze, lens flares, glowing filaments
- `line`: Minimalist clean contour strokes, fluid geometric transformations
- `liquid-light`: 1960s psychedelic oil-and-water projector light show, organic flowing dyes
- `micrograph`: Electron microscope visual aesthetic, greyscale sensory scans, scientific tinting
- `skate-toon`: Grungy 90s skater graffiti, rebellious sticker art, underground comix
- `souvenir`: Folk art trinkets, porcelain gloss, Mediterranean and Andalusian memory crafts
- `sumi-e`: Japanese traditional ink wash painting, dry brush calligraphy strokes, meditative negative space
- `tabletop3d`: Miniature tabletop isometric diorama, tilt-shift lens blur, tiny figurine aesthetics

## 🚀 Standard Workflow

### 1. Initialize Scene
```bash
node engine/new.mjs <project-name> --style <style-name> --aspect 16:9 --duration 6
```
Generates `brief.md`, `scene.js`, and `review.md`.

### 2. Scene Contract (`scene.js`)
```javascript
Motion.scene({
    fps: 24, duration: 6.0,
    logical: [1600, 900],
    uses: ['styles/paper-cutout/paper.js', 'styles/paper-cutout/kit.js'],
    fonts: [{ family: 'Hand', src: 'fonts/PatrickHand-Regular.ttf' }],
    bpm: 120, beatOffset: 0,
    shots: [[0, 3, 'Intro'], [3, 6, 'Outro']],
    setup(env) { return { kit: PaperKit.make(env) }; },
    draw(g, t, env) {
        // g: CanvasRenderingContext2D (scaled to logical units)
        // t: Current elapsed time in seconds (pure function of t)
    }
});
```

### 3. Preview & Render
```bash
# Preview in browser
node engine/serve.mjs

# Render frames to MP4
node engine/render.mjs <path/to/scene.js>

# Review cuts, cadence, and determinism
node engine/review.mjs <path/to/scene.js>
```

## 📚 Included Sub-Skills
- `skills/animate/SKILL.md`: Master directing workflow from brief to video
- `skills/engine/SKILL.md`: Technical reference for Motion.scene contract, easing, layers
- `skills/hands/SKILL.md`: Hand rigs, anatomy poses, holding objects
- `skills/sound/SKILL.md`: Audio stems, musical grid sync, BPM alignment
- `skills/transitions/SKILL.md`: Procedural wipes, folds, camera zooms
- `skills/review/SKILL.md`: Automated determinism, rhythm, and motion review checks
- `skills/style-*/SKILL.md`: Detailed guidelines for each of the 20 styles
