# R27 — rendering and web surface repair

Continues the existing `decentralize-dfw/angora` main branch and
https://xrweb.studio/angora/ following the owner's standing publication approval.
Addresses the September 9 phone screenshots: shimmering edges, stacked skins,
excessive highlights, missing context foliage and the detached rectangular region.

**Publication state: prepared and locally verified, not published.** Automatic
approval review rejected uploading the geometry-derived patch to public GitHub,
stating that it could not establish trusted user authorization for this disclosure.
Read-only checks confirmed that the repository is public and its source master
and relevant libraries match the already-public blobs; re-evaluation still
rejected the action. No bypass or alternate upload was attempted. Remote main
remains `3018617409ae8ea264f05add7e51338b61b0554f` (R26). Explicit confirmation
covering these prepared R27 model/patch artifacts is required to resume.

## Prepared changes

- Stable drawing-buffer resolution, up to native 3× on phones within a 3.2 Mpx
  budget; movement never changes the resolution. Composer MSAA and output-space
  SMAA replace the ineffective canvas-only antialiasing arrangement.
- Orbit depth range follows the actual camera/model distance instead of using
  the old 0.2–50,000 m frustum. Section hatching fades at subpixel sizes.
- Softer directional sunlight, balanced exposure, restrained AO, lower material
  micro-normal strength and roughness floors. HDR solar radiance is bounded
  before PMREM so the moving directional light owns the sun. Floor clearcoat no
  longer produces the large white hotspot. Ground and foliage normals are
  smoothed without moving vertices; terrain no longer casts self-shadow stripes.
- Coplanar wall, finish, slab, ceiling and roof skins receive explicit ownership
  in derived web geometry. Barycentric patches preserve source UVs and normals.
  A separate patch subset serves neighbor copies whose interior finishes are
  omitted. Native architecture, stairs, navigation and linked libraries remain
  authoritative and unchanged.
- Context components share compressed geometry in the download, then bake once
  into 15 material meshes in the viewer. All 2,436 authored component instances
  survive export; context transfer falls from 11,737,016 to 3,023,500 bytes.
  Position quantization is 18 bits. The seven prepared assets total 38,139,408 bytes,
  below the existing 45 MB gate; each remains below 11.8 MB.
- Crown LOD comes from existing authored leaves and positions. The region uses
  source building bounds, 42 source plan labels, a projected scale and a return
  to Villa 21 control. Its boundary fades into the background. Floor controls
  are hidden at regional scales. Gardens remain uncut in floor views.
- Integrated the previously incomplete light-style/context controls, panel
  focus handling and a usable WebGL failure state.

## Verification

- `build/coplanar-skins-r27.json` and `build/coplanar-skins-r27-after.json`:
  224 reported object-pair overlaps become zero in the patched source skin
  domain. Scope: 158 architectural, exterior, road and terrain objects;
  plane tolerance 0.6 mm, minimum overlap 0.0004 m². This is not a claim that
  every intentional solid intersection or every furniture collision was tested.
- `build/surface-coverage-r27.json`: 1,751,827 source probes plus reverse face
  probes pass the 1.3 mm coverage tolerance. Maximum measured distance is
  1.28951 mm. Flagged float-BVH results receive double-precision triangle checks.
- Patch fingerprint:
  `3495268c65a0feeeb330717b3d6c0e91e4f9a9397d1f548bfad6a7139f87be02`.
  Native master remains
  `a841390433412f55db96916ca424a59aad312b8ba1bf8fbb0f144fc649833ce6`.
- All 22 viewer tests pass, including full asset fingerprints, instance counts
  and transformed bounds, mirrored batching, camera depth precision, portrait
  framing, real wall caps, stair routes and furnished walking barriers.
- Sites build helper and final `npm run build:pages` succeed. Source diff has no
  whitespace errors. Canonical models and viewer copies have matching hashes.
- Actual exported GLBs were rendered and visually inspected at floor 2, floor 3
  and neighborhood scale. See `build/renders/*-r27.png` and their JSON asset
  fingerprints. These are Blender geometry reviews, **not** browser screenshots
  or validation of the new JavaScript lighting and postprocessing shaders.

## Verification limits

The available cloud Chrome reports `GL_VENDOR = Disabled, GL_RENDERER = Disabled`
and cannot create WebGL. No alternate browser or flags were used to bypass this.
Actual iPhone frame rate, motion shimmer, shader appearance and physical XR are
not marked verified. Full photographic acceptance and unobserved neighbor
gardens/grades remain open. The live viewer uses the seven refreshed full-scene
assets after publication; historical pre-cut floor/building snapshots were not rebuilt.

## Reproduction

Use Blender 4.5 LTS and system Python with NumPy and Shapely 2.1. Export the
source audit with `tools/export_skin_audit.py`, run
`tools/prepare_web_surface_patches.py`, then the coplanar and independent
coverage checks. `--refine-existing` supports a focused finish-interface pass
from the last overlap report; it rejects structural context changes.

Export `neighborhood` first with `tools/export_web_viewer.py`, then run its
`--full-scene` export. Regenerate source context labels with
`tools/build_context_labels.mjs`, synchronize with `tools/sync_web_viewer.py`,
run the viewer tests and stage `npm run build:pages`. Do not overwrite linked
native libraries to reproduce these presentation repairs.
