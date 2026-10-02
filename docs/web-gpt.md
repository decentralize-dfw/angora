# Angora 21 — English editorial residence page

Entry point: `web-gpt.html`. The existing root tour and `web.html` remain separate.

Run `node tools/serve-residence.mjs` and open `http://localhost:4180/web-gpt.html`.
The page is static and can be served directly from the repository root.

## Photography and motion

`assets/residence/photo-*.jpg` are the supplied photographs of the existing villa.
GSAP ScrollTrigger and Lenis are served from `assets/vendor/`. Typography uses
Bodoni Moda and DM Sans from Google Fonts, with local system fallbacks.
The opening photo zoom, circular transition, flying photographs, outdoor scenes
and four chapter sequence follow scroll position. Reduced motion uses direct
chapter selection. English descriptions cover the floor layout, kitchens, suite,
garden, pool, lift, annexe, parking and neighbourhood.

## Architectural film

The homepage loads no live 3D scene or iframe. Its chapter canvas scrubs 96
transparent WebP renders at 1440 × 1440, blending neighbouring frames. Rendering
uses the supplied villa geometry and materials, Cycles/OptiX, a continuous camera
and a moving height cutaway. A temporary studio plinth and fill light belong only
to the rendering process. The source Blender file is never saved or modified.

An observer loads the sequence near the chapter section. At most three frames
decode concurrently, with a maximum of 18 decoded frames cached. Chapter titles,
descriptions and real photographs follow the same scroll progress. Tour buttons
open the existing root viewer separately.

To regenerate using the supplied `angora-finalization-review.blend` source:

```text
blender -b <source.blend> -P tools/render-chapter-film.py -- --frames 96 --width 1440 --samples 32
node tools/package-chapter-film.mjs
```

Blender 4.5, an OptiX GPU and FFmpeg with WebP/H.264 support are required for
regeneration. Intermediate PNGs are ignored under `build/chapter-film/`.
The reusable `assets/residence/chapters/angora-four-chapters.mp4` is a 1440 square,
30 fps H.264 film. The webpage uses the transparent WebP frames.

## Verification

Checked the opening, forward/backward chapter scrolling, tab selection, mobile
390 × 844 layout, photograph enlargement, gallery navigation and menu. Confirmed
no homepage iframe, no horizontal overflow, all 96 frame URLs returning 200,
valid JavaScript syntax and valid exported film metadata.
