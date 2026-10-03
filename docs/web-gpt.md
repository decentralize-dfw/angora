# Angora 21 — English residence presentation

Entry point: `web-gpt.html`. Run `node tools/serve-residence.mjs` and open
`http://localhost:4180/web-gpt.html`. The existing interactive tour and the
ERA / Likova library in `casestudy.html` remain separate entry points.

## Material and visual direction

Ice blue, forest green, warm brown and ivory connect the supplied villa views
with an early-autumn editorial direction. Headings use locally hosted Cormorant
Garamond; interface and body text use locally hosted Manrope. Their OFL licences
are in `assets/residence/fonts/`.

The seven new views from Downloads live in `assets/residence/new/`, with original
filenames in `sources.json`. Exterior imagery is assigned to street arrival,
garden elevation, pool, terrace and neighbourhood respectively. The old exterior
photo set is excluded from the page and its dynamic gallery. Interior photographs
retain their original floor and photographed subject. Raw archive IDs stay inside
the data; displayed camera points start at 1 on each floor.

## Recorded camera sequence

The supplied opening darkening film plays behind a black opening veil. Three
supplied camera clips then follow continuous endpoints: pool approach, elevation
orbit, and the reversed garden return. Each clip now occupies five viewport
scroll distances. Its first camera movement uses 0–32% of that distance, then
holds at its midpoint from 32–48%; movement resumes from 48–80%, followed by a
destination hold. Each hold has information appropriate to that view.

`residence-camera.js` smooths the displayed camera progress independently of
wheel impulses. Forward and backward scroll use the same frame mapping.
`residence-film-runtime.js` fetches four frames concurrently, keeps 28 decoded
frames on desktop / 16 on mobile, and preserves the full source composition.

## Actual isometric floors and transforming plans

The homepage plays recordings, without a live model. Both four-floor sequences
were captured from the actual Three.js viewer and its Tur 10 model, including
native floor clipping, camera flights and orthographic furnished plans. There is
no studio plinth or replacement floor diagram.

Capture workflow:

1. Start `node tools/capture-residence.mjs` on localhost:4181.
2. Start the viewer dev server on localhost:4173. Its local proxy carries the
   capture endpoints.
3. Open `/?lang=en&view=f0&presentation-record=1` and press Record presentation.
4. Run `python tools/prepare-native-films.py` with FFmpeg installed.

The capture flag only changes recording framing and adds the local export
button. The regular interactive viewer keeps its normal controls and framing.
The export includes two WebM recordings, four isometric stills, four plan stills,
and `poses.json`: exact photo and DXF positions projected by the plan camera.
The preparation tool writes independently decoded WebP frames, fallback stills,
MP4s and `native-manifest.json`.

Within each floor interval, the scene rests while its description is readable,
then travels to the next floor using the recorded native transition. The
isometric chapter copy follows displayed camera state. The plan crop interpolates
between the same recorded viewpoints; registered points reappear on the settled
plan. Floor selection moves to that floor's scroll position.

Plan labels separate where several camera points occupy one small room; leader
lines preserve their registered locations. Selecting a point shows the matching
original photograph, direction and subject-room area when the owner's schedule
provides it. The optional dimensions come from the supplied DXF. Areas are
approximate; unspecified values are not invented.

## Selected motion recipes

The reference library is used selectively, according to each section's material:

| Section | Selected study | Application |
| --- | --- | --- |
| Opening camera | Likova 21, 14–15 | Separate movement / reading phases, camera-linked copy, chapter progress |
| Film framing | ERA 12, Likova 18 | Full-screen image contracts during a pause and expands for the next movement |
| Exterior / kitchens | ERA 13, Likova 36 | Image window opens, then the pinned strip traverses its measured width |
| Four chapters | Likova 14, 16 | Actual cut-plane and camera recording with matching floor narrative |
| Plan atlas | Likova 25, 27 | Plan-to-plan recording and paired disappearance / reappearance of camera markers |
| Editorial statements | Likova 9 | Word-window reveals on selected large statements |
| Neighbourhood photographs | ERA 24 | Restrained internal photo movement and paired editorial framing |
| Collection | Likova 45 | Width-derived horizontal travel; vertical page flow resumes after the last photograph |
| Closing | Likova 11 | Quiet footer underlap |

Horizontal exterior, kitchen and collection sections stay within one viewport.
Their masks open before horizontal travel; they release the page after the strip
finishes. Gallery filters rebuild the corresponding measured travel distance.
Reduced motion uses stationary media, direct floor selection and native
horizontal overflow.

## Life in Angora

The two community photographs originate from the official residents' association:
[Angora Evleri](https://www.angorakoop18.com/). They received photographic clarity,
lighting and restrained early-autumn edits through the built-in ImageGen tool.
They are captioned as autumn interpretations. Exact source URLs, full prompts
and saved filenames are recorded in `assets/residence/life/provenance.json`;
both original source JPEGs are retained alongside the edited WebP assets.

Community greenery and recreation use these matching photographs. Bilkent
Symphony Orchestra and CerModern appear as a separate cultural note with their
own official links; the community images are not labelled as cultural venues.
Source information was checked on 3 October 2026. Programmes link to current
[BSO](https://bso.bilkent.edu.tr/en/) and
[CerModern](https://www.cermodern.org/ziyaret) pages.

## Verification

`node --test --test-isolation=none tests/residence-films.test.mjs tests/residence-atlas.test.mjs`
checks camera pauses and reversibility, all published film frames, four recorded
floor/plan assets, projected points, original photo registration, DXF dimensions
and room-area provenance. Browser verification covers floor selection, matched
photo enlargement, dimensions, pinned horizontal travel and viewport fit.
