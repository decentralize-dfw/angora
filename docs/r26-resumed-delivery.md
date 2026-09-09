# R26 resumed delivery — 9 September 2026

This continues the same `decentralize-dfw/angora` project on `main`, not the
older independently published ChatGPT Site.

## Implemented

- Applied the guarded 7.15 m² entrance-slab stair aperture repair to the R25
  architecture library. Six downward native raycasts now reach the basement
  stair treads rather than the covering entrance slab.
- Applied the four garden terrace levels. Retained original road and stair
  strips, and added 362 perimeter reveal segments between the new terraces and
  the retained terrain. The new terrain has 20,470 vertices / 34,528 triangles.
- Verified all 5,974 structural wall triangles are unchanged. Reused the
  reviewed section contours with updated architecture provenance.
- Refreshed native linked-library checks, changed detailed and web GLBs,
  room annotations and walking navigation.
- Added a regression test for furnished routes across every adjacent floor.
- Fixed perspective pinch zoom so it preserves camera altitude.
- Cancelled pending room jumps when leaving the tour or choosing another view.
- Added floor-finish projection totals and estimated garden/pool surface
  information with explicit evidence labels. No unapproved individual room
  partition is published as an area measurement.
- Fixed the GLB review renderer's attic cut to use the viewer's 1.30 m height.
- Retained valid navigation metadata during partial web exports.

## Verification and evidence

- `build/r26-native-qa.json`: six staircase sightlines and four terrace probes.
- `build/gallery-visibility-qa.json`: existing gallery and lower staircase.
- `build/wall-section-qa.json`: unchanged wall-contour proof.
- `build/area-info-qa.json`: model surface totals and their limitations.
- `build/renders/full-scene-floor-1-r26.*` and
  `build/renders/full-scene-building-r26.*`: actual exported GLB renders with
  asset fingerprints. These are Blender geometry reviews, not browser renders.
- Viewer suite includes 17 tests, including the new gesture, stale-room-jump,
  inter-floor-route and area-evidence regressions.

## Not complete — do not mark the entire project accepted

- On 2026-09-09 the user explicitly approved uploading the code, Blender/GLB
  files and reports to `decentralize-dfw/angora` on `main`, publishing its
  existing site, and sending the property coordinates to Overpass. Subsequent
  updates should go directly to `main` without repeated scope approval.
  Publication is being resumed through the configured GitHub connection;
  the local shell has no configured Git write authentication.
  The owner subsequently explicitly approved public sharing of the
  photo-derived room review register and detailed interior navigation data
  in this same repository and existing site, resolving the specific review
  objections raised during the initial upload.
- Per-room area partitioning: source finish components join several named
  rooms. The automatic component areas remain unpublished; floor totals are
  explicitly model finish projections, not usable net or registered areas.
- Regional service pins: an Overpass request was blocked by automated review
  because it would transmit the property's precise coordinates to an external
  service. The user has now granted specific permission. No regional
  coordinate/POI dataset has been added to the public viewer.
- Mobile GPU and physical XR verification: the available cloud Chrome reports
  `GL_VENDOR = Disabled, GL_RENDERER = Disabled` and cannot create a WebGL
  context. No browser flags or alternate browser were used to bypass it.
- Full room-by-room photographic acceptance, remaining neighbor gardens,
  wall/plant detail, unseen grades and measured pool dimensions are still open
  in `build/room-review-register.json`. This turn does not claim that the
  architecture has become photorealistically or survey-accurately complete.

## Reproduction

Use Blender 4.5 LTS and the linked master. Preserve the guarded original repair
script: never reapply it to an already repaired architecture library. To revise
an already generated terrace mesh, pass `--replace-current-sha` with the exact
hash of that current terrain library. Keep the original ground snapshot when
regenerating the terrace layout; do not use the patched terrain as its source.

After structural export, run `build_room_annotations.py`,
`build_walk_navigation.py`, `build_area_info.py` and `sync_web_viewer.py` in that
order. Then run the viewer tests and `npm run build:pages` before publication.
