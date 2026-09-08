# Angora 21 — 3D review

Simple mobile-first review of the existing Angora native model. Six views:
neighborhood, building/garden, basement, entrance, first and attic floors.
Each floor is physically cut at its registered datum + 1.60 m. Section tops
are open geometry, not artificial room-sealing caps.

Orthographic camera keeps elevation fixed while rotating, panning and zooming.
One finger rotates; two fingers pan and pinch. The Pan button also supports
one-finger panning. Only the selected floor is held in GPU memory.

## Source connection

The authoritative source is `decentralize-dfw/angora` on `main`.
`tools/export_web_viewer.py` in that repository derives `build/web/*.glb`
from the editable Blender model. `tools/sync_web_viewer.py` refreshes this
viewer's `public/models` directory and checks hashes. At startup, the viewer
checks the same manifest on GitHub main. Unchanged assets load locally;
updated assets load from the repository. A failed remote check retains the
bundled model. No GitHub token is embedded or required.

Furniture category metadata is preserved. Full Blender sources, textures
and detailed export layers remain separate from this mobile derivative.
Neighborhood context omits hidden ceilings, duplicate wall coverings and
fine shutter hardware. Native geometry is unchanged by export.

## Development

Node 22.12 or newer. `npm ci`, `npm run dev`, `npm test`, `npm run build`.
Build output is `dist`. Draco decoder is bundled for same-origin delivery.

## GitHub Pages

Live URL: https://xrweb.studio/angora/

Run `npm run build:pages` to stage the compiled `index.html` and `web-assets/`
in the Angora repository root, then commit those files on `main`. This build
uses relative paths and loads the canonical `build/web/` models and existing
`viewer/public/draco/` decoder files directly from the same repository.
The default build remains portable with its bundled `models/` and `draco/`.

The source model is still under photo review; this interface is not a claim
that all materials, rooms or neighboring facades match the photography.

## Verification

GLB hashes, accessor bounds and 1.60 m floor cuts checked against the manifest.
Real OrbitControls tested with synthetic one- and two-pointer touch events,
including fixed elevation under pan and zoom. The 390 × 844 layout has safe
area-aware controls and touch input. Real phone/browser visual QA remains
pending because the cloud preview service was unavailable in this session.
