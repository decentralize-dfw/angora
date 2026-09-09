# R26 checkpoint — model export pending

> Historical checkpoint. The resumed implementation and its current validation
> are documented in `docs/r26-resumed-delivery.md`. Do not interpret the original
> interrupted-workspace statements below as the status of the resumed delivery.

Published viewer: commit `b939de9a8fa255c829a37228a799cd37daa23776`.
GitHub Pages run `34265382486` completed successfully. The deployed index was checked against the commit.

The cloud workspace became unavailable during model verification. The files below preserve the executed repair procedures. They have **not** been applied to the GLBs committed in this repository. Do not present R26 as a published model revision.

## Completed in the interrupted workspace

- The entrance slab `F1 | KAT 1$ZEMİN` covered the staircase. Rays at X 1.2 / 2 / 3 and Y 1.4 / 2.6 hit slab surfaces at Z 2.70 and 3.02 m above the basement stairs.
- Removed the rectangle X 0.8684…4.1184, Y 0.9273…3.1273 m: **7.15 m²** of opening, **14.300001 m²** of top/bottom skins, 29 changed polygons.
- Added four 0.32 m deep slab reveals. Stair objects, basement slab, first-floor gallery and the closed attic elevator opening were retained.
- Architecture library SHA before: `4105de07c4dae4752294724135bbf067afb2c2ce64d31f1fff2d09139fe35776`.
- Architecture SHA after the executed repair: `e6e89df9d208ce7e8f886982073d0bd5951e0e0bd70f2d03df1643369d28bb78`.
- Prepared and applied a terrace mesh to `50-neighborhood-10.blend`: 20,336 welded vertices / 33,804 triangles. Horizontal coverage difference was below 0.002 m². Final model renders remain pending.

## Garden evidence and limits

The previous `site_refinement.py` generated one continuous interpolated slope through the villa garden. The retained `SOURCE | DORBAK` has a flat top at **Z 2.7996 m**. The rear TK annotation is **−0.10 m**, relative to the villa BK 1026.40 m datum.

The prepared patch uses:
- Front pad: +2.7996 m, from DORBAK.
- Side pads: +2.0664 / +1.0332 m, interpreted from the current garden stair landings.
- Rear pool garden: −0.10 m, from the CAD TK annotation.

Side breaklines, plot registration and unseen neighbor gardens are **not surveyed to millimetric accuracy**. Roads, neighbor BK levels and pool dimensions are retained. The pool remains an 8 × 4 m photo-based estimate; do not show it as a measured dimension.

## Resume in cloud

1. Recover the existing workspace if available. Inspect local changes before fetching; do not discard locally edited Blender libraries.
2. Compare library hashes. The stair tool is guarded against reapplying to another revision. If starting from published R25, run the saved repair script on the editable architecture library.
3. On the master, export current ground geometry with `tools/export_ground_source.py`. Prepare the garden mesh with `tools/prepare_garden_terraces_r26.py`; apply it on `50-neighborhood-10.blend`. If the already edited library is recovered, inspect its `garden_terrace_revision` property instead of applying again.
4. Refresh linked delivery metadata; export current wall triangles and review geometry. Verify unchanged wall contours against the pre-repair snapshot, then refresh section provenance.
5. Export changed streams `villa-f1.glb` / `context-ground.glb`; regenerate web `neighborhood` first, then full-scene `level-1` and `context`, plus the legacy `floor-1` preview. Rebuild walk navigation and room annotations against the new architecture hash.
6. Validate the now-open stair route and gallery, garden/road intersections, terrain transitions, plant bases and retaining faces. Render the actual GLBs, inspect the images and share them.
7. Sync viewer model files, run tests/build, publish to main, and verify deployed file hashes.

## Still requested

Room and floor m²; front/rear garden and pool area info with evidence status; georeferenced regional service pins in 3–4 categories with proximity; remaining neighbor gardens/walls/grades; source-based room-by-room photo review.

Automatic room-area experiments were not approved: some source openings connected several named rooms into one polygon. Do not publish those experimental per-room numbers.

The R25 viewer has compact controls, camera-facing labels, animated plan/isometric camera, daylight/season sliders, transparent glass shadow exclusion, ceiling fixture lights, model-based 360° viewpoints, walk-surface routes and a 1.30 m attic section. It still needs mobile GPU / physical XR visual validation. Camera-height preservation during perspective pinch and cancellation of delayed room jumps were being refined locally; inspect these changes before the next build.
