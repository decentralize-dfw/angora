# Angora 21 — English residence presentation

Entry: `web-gpt.html`. Preview: `node tools/serve-residence.mjs` on port 4180.

## Motion

A physical wheel gesture starts one whole camera film. Playback is independent
of wheel delta and stops at the destination until the next gesture. Three gestures
play approach, orbit and garden return in order, each in 1.65 seconds. The fourth
moves into the residence. The opening darkening movie remains behind a black veil.

`residence-steps.js` owns the scene input. Momentum events are grouped using a
220 ms quiet interval. Events received during playback are consumed without
queuing another movie. PageUp/PageDown and touch swipes use the same scene
transitions. Navigation links, photograph dialogs and floor tabs remain available.

Both the isometric section and the graphic plan change one floor per gesture.
An isometric move lasts 1.4 seconds; a graphic-plan transformation lasts 0.9 seconds.
Backward gestures use separately encoded reverse movies. The browser plays
preloaded H.264 movies directly; no WebP sequence seeks or scroll catch-up loop
runs during these scenes. Exterior/editorial and gallery motion remains tied to
scroll, with each horizontal strip finishing before the page moves vertically.

## Model capture and graphic plans

The recorder in `viewer/src/presentation-recorder.js` exports the actual Tur 10
model at 2560 × 1440. It renders 43 deterministic samples for each native camera
flight and section-plane movement. GPU speed cannot drop frames. Six H.264 films
(forward/reverse), four isometric stills and four orthographic stills are published.
The presentation capture excludes surrounding buildings and the exposed soil
section hatch so the garden level has an intelligible architectural silhouette.

Reproduce with the local capture receiver on 4181, the viewer on 4173, and the
viewer URL carrying `presentation-record=1`. Press Record presentation, then run
`python tools/prepare-native-films.py` (FFmpeg and Shapely). Raw samples live under
ignored `build/presentation-capture`; the published movies and WebP stills live
under `assets/residence/chapters`.

The graphic plan uses measured room polygons and wall-section boundaries from
the repository. Indexed section triangles are united before their boundaries are
drawn, so triangulation diagonals never appear as walls. A low-opacity 1440p
furnished native model plan sits below the graphic lines. All registered camera
positions, view cones and directions are visible on every floor. Numbers restart
at 1 for each floor; clicking a point displays its associated room photograph.
Camera-number labels separate while leaders retain their real positions. Room
labels avoid the camera numbers and use margin callouts where space is tight.
DXF dimensions and supplied room areas retain their original registration.

## Photography and visual direction

Ice blue, forest green, walnut brown and ivory are paired with locally hosted
Cormorant Garamond and Manrope. The OFL licences are bundled with the fonts.

The presentation uses the seven newly supplied Downloads views under
`assets/residence/new`, with source names in `sources.json`. The old exterior drone
set is excluded. The street arrival, garden sequence, location and closing interior
have distinct photograph assignments. A separate family-room strip replaces the
repeated exterior strip. The collection contains 45 distinct views: five new
exteriors and every registered interior photograph. Revised repository photographs
from `photogallery-v2` preserve their source camera coordinates and room associations.

Life in Angora includes two seasonal interpretations of official community
photographs. Provenance, source URLs and edit instructions remain under
`assets/residence/life/provenance.json`; the page discloses their adaptation.

## Validation

Run `node --test --test-isolation=none tests/residence-films.test.mjs
 tests/residence-atlas.test.mjs` on this Windows host. Checks cover gesture bursts,
three-gesture completion, momentum, movie resolution, floor registration, model
boundaries, camera directions, source dimensions and room areas. Browser QA covers
actual mouse gestures, the resting scenes, reverse navigation, camera selection,
horizontal galleries and phone-sized frames.
