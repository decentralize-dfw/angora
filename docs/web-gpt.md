# Angora 21 — English editorial residence page

Entry point: `web-gpt.html`. The existing root tour and `web.html` remain separate.

Run `node tools/serve-residence.mjs` and open `http://localhost:4180/web-gpt.html`.
The page is static and can be served directly from the repository root.

## Photography and motion

`assets/residence/photo-*.jpg` are the supplied photographs of the existing villa.
GSAP ScrollTrigger and Lenis are served from `assets/vendor/`. Typography uses
Bodoni Moda and DM Sans from Google Fonts, with local system fallbacks.
The recorded opening, consecutive camera films, framed compositions, flying
photographs, outdoor scene wipes and four chapter sequence follow one scroll
coordinate. Reduced motion uses static media and direct chapter selection.
English descriptions cover the floor layout, kitchens, suite,
garden, pool, lift, annexe, parking and neighbourhood.

## Supplied camera films — 3 October 2026

The homepage loads no live 3D scene or iframe. `açılış kararma.mp4` plays once,
muted and inline, behind an opening dark veil. It moves from daylight into
evening. Scrolling takes over a separate canvas and advances all three supplied
1280 × 720 camera clips at their original 24 fps:

- `07_14_28`: approach from the pool to the frontal elevation.
- `07_13_20`: frontal elevation to the elevated three-quarter view.
- `07_19_59`, reversed: elevated three-quarter view back to the garden.

The order follows camera endpoints rather than download time. Each clip has 121
WebP frames, prepared at quality 82 without resizing. Two viewport heights of
scroll finish each clip; the complete three-clip sequence occupies six viewport
heights plus its sticky screen. “Two scrolls” means two viewport distances,
independent of a mouse's wheel event size. Forward and backward navigation use
the same mapping, with no frame seeking dependent on an MP4 keyframe interval.

`assets/residence/films/manifest.json` records source names, order and reversal.
Original MP4s remain beside the derived frames. `residence-film-runtime.js`
decodes at most four frames concurrently and keeps 28 decoded frames on desktop
or 16 on mobile. Its queue follows the latest scroll destination. The complete
landscape composition fits the frame, with a dim ambient field filling a
different screen aspect ratio. The pool and building are not cropped by a
shrinking mask. No new image or film is generated.

`residence-cinema.js` and `residence-cinema.css` adapt the audited library:
ERA frame contraction/expansion, diagonal image reveal, foreground photograph
movement and coupled CTA/footer scale; Likova masked type, camera-linked state
and per-chapter progress. The camera clips remain consecutive while the frame
contracts, returns to full screen and becomes a photograph beside the intro.

## Verification

`node tests/residence-films.test.mjs` checks the six-screen mapping, backwards
navigation, both boundaries, clip order and every frame/original video file.
`node tests/residence-atlas.test.mjs` checks the photograph/plan provenance.
Browser checks cover the three clips, the final framed composition, all four
floors, camera point lightbox, atlas navigation and a 390 px mobile viewport.

## Autumn interface and photograph atlas — 3 October 2026

`residence-autumn.css` supplies the editorial layout; `residence-palette.css`
combines the villa's ice blue with dark garden green, warm brown and ivory.
The film canvas contracts from full screen to an inset frame and expands again.
A street-arrival sequence uses original photographs 38 and 37; the neighbourhood
sequence also moves between full screen and framed compositions. No generated
seasonal image is used. The kitchen collage uses the three actual kitchens:
photographs 21, 01 and 06.

The new atlas combines registered room polygons, camera positions and directions,
the supplied DXF dimensions and the owner's room-area schedule. Camera position
and photographed subject are separate: for example, photograph 16 looks into
the dressing room from the adjacent bedroom, and its displayed area belongs to
the dressing room. All four floors offer numbered camera points, thumbnails,
photograph enlargement and a room schedule. The dimension toggle shows the
selected subject room's registered measurement lines and the available areas.
Unspecified areas remain blank rather than being derived from a rectangle.

The four chapter panel now shows original room photographs with a registered
mini plan and real clickable photo points. It no longer loads the earlier studio
cutaway film or its white plinth. The matching room is highlighted; only an area
present in the supplied schedule is shown. All floor descriptions and separate
interactive-tour links remain available.

All 55 original photographs are available, organised by exterior and floor.
Original image 20 stays excluded as the duplicate of 04; numbering is preserved.
`node tools/build-residence-atlas.mjs <original-photogallery-directory>` rebuilds
`assets/residence/atlas-data.js` from the authoritative repository data.
`node tests/residence-atlas.test.mjs` checks the original files, camera
registration, floor/subject mapping, exact dimensions and room-area provenance.

“Life in Angora” is an English editorial guide with source links on each story:

- [Angora Evleri residents' association](https://www.angorakoop18.com/): shared
  green, sports, social and children's play areas; its account of everyday life.
- [Beysukent Çankaya Evi](https://www.cankaya.bel.tr/cankaya-evleri/beysukent-cankaya-evi):
  the community house in Cumhuriyet Park, Angora Caddesi, and its listed courses.
- [Bilkent Symphony Orchestra](https://bso.bilkent.edu.tr/en/): season concerts
  at Bilkent Concert Hall.
- [CerModern visitor information](https://www.cermodern.org/index.php/ziyaret):
  exhibitions, café and library in Sıhhiye.

Sources checked 3 October 2026. The guide links to current programmes instead
of freezing event dates, travel times or membership claims into the page. Its
property photograph is identified as the actual residence; it is not presented
as an image of a shared amenity or a cultural venue.
