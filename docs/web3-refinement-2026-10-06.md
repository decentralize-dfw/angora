# Web3 refinement — 6 October 2026, 13:43 CEST

Revision: `20261006-refinement-3`. This record documents observed checks, not design scores.

- Restored the existing 5.056-second owner-provided day-to-night opening film. It plays once and holds its actual final night frame; the next chapter requires user input. The first scroll uses a two-second crossfade. An early scroll captures the decoded frame before stopping the opening, avoiding a poster reset.
- Replaced the visible navigation with a permanent small ANGORA 21 wordmark, Turkish/English controls, listing, 3D residence and MERGVS links. Language changes preserve the current floor and camera.
- Made the garden gradient fade with the section's departure. Added the missing garden-path text beside its photograph. Replaced the awkward dining crop with the existing central-stair photograph, in a portrait frame.
- Reserve the final plan/camera-bar layout before the incoming plan appears. Dimensions toggle only the measurement group; it does not rebuild the photograph. Compact mobile plans now share the available viewport proportionally instead of expanding the stage after the bridge.
- Halved amenity-dot radii, removed their outlines and set opacity to 70%. Moved the Angora Evleri label north-east with one arrow to the boundary. All six layers remain visible.
- Reused Web2's architectural edges, opacity settings and colourless hidden-line depth pass. Retained Web3's orthographic projection, fixed pitch, framing, horizontal-only orbit and edge fade. Only lines are visible; depth geometry writes no colour.
- Replaced the footer disclosure with concise owner-photograph/retouch and drawing/model statements in both languages. The geometry statement refers to the supplied drawings, not a survey of the built property.

## Validation

- Existing state/media/geometry suite: **20 passed, 0 failed**.
- Local dependency scan: **348 references, none missing**. New media is one 197,134-byte WebP; the film and viewer buffers were already tracked. No new video/model upload.
- Native wheel checks at 1280×720 and 390×844: all seven forward and reverse technical steps completed with unchanged page position during each gesture. A further downward gesture exits the last plan.
- Additional 320×568 check: stage stayed exactly 568 pixels tall through the isometric-to-plan bridge and all subsequent plan steps. The final plan releases downward scrolling.
- Landscape 844×390 follow-up: removed the old 650-pixel stage minimum, fitted the plan/photo/controls into the viewport and scaled map labels and pins for the shorter drawing. Photograph title remains inside its caption; a native wheel changes floor without page movement.
- Header bounds checked at 320×568, 390×844, 430×932, 768×1024 and 1280×720; no horizontal overflow. These are browser viewport emulations, not physical-device tests.
- Opening held chapter 0 at page position 0; first scroll took about 2.02–2.04 seconds with position unchanged. Early interruption preserved a decoded video frame.
- Pointer checks: dimensions preserve photo DOM and page position; mobile lightbox closes to the same plan, floor, camera and page position.
- Garden opacity sampled continuously as its bottom moved through the viewport: 0.92 → 0.67 → 0.35 → 0.09 → 0.00. Viewer orbit changed yaw without moving/resizing its frame or scrolling the page.
- Visual checks covered the garden text/image pair, portrait stair crop, desktop/mobile map, Turkish layout and desktop/mobile closing viewer.

Raw browser observations: [refinement-2026-10-06.json](web3-qa/refinement-2026-10-06.json). No claim is made that these checks cover every device/browser or every transition under every network condition.
