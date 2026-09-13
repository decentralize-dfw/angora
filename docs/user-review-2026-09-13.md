# User photograph correction queue — 13 September 2026

Web export is now regenerated: see `web-review-delivery-2026-09-13.md`. Earlier source-only checkpoints below are historical. The current browser assets, navigation and sections share source SHA `612f1e43b4f6a2191b36f87942ac3439fea29791f4cec7087a2e2656a3974f2e`.

## Source delivery checkpoint

The editable Blender snapshot recorded at 13:09 is included in this commit with packed textures and repair scripts. SHA-256: `71b0beb426e313f65a2878018a014411efbcfe11bfb2a9c0b6e53912b6f7fd34`.

Additional source changes after the checkpoint below: 77 tall thuja instances using three shared meshes; pool dolphin revision 3 removes the malformed jaw projection, with the white background keyed out in Blender. Exact dolphin fidelity and final alpha baking remain unfinished.

This commit updates the editable source. The browser GLBs, navigation and section assets still represent the previous delivery and have not been regenerated. The numbered items below remain a verification queue, not a claim that source edits are absent. Export and browser integration are outstanding tasks.

All items below are OPEN until their native edit and matching browser view are verified. Previous geometric QA did not establish visual fidelity. Final bake and shipping compression follow this review, not before it.

1. C04 ceiling: correct colour, broken/overlapping polygons and visible blue external wall faces (SS1).
2. Attic landing roof/wall junction: complete the junction and eliminate interior exposure of blue facade faces throughout (SS2).
3. C04 bed: rotate 90 degrees counterclockwise from the present placement and move against the photographed wall; free the entrance. Fix room roof/walls (SS3).
4. Floor-change hotspots: place on actual intermediate stair landings, with no floating or through-wall markers (SS4, SS6).
5. First-floor walls: remove nonexistent horizontal texture. Move both lounge armchairs against the wall. Correct white middle pane in triple window. Lift doors initially closed; clickable opening toggle and actual passenger floor changes.
6. Dressing room: continue wardrobe on the right-hand wall.
7. First-floor rear bedroom: restore real balcony doorway and accessible balcony (SS7).
8. Adjacent bedroom: replace incorrectly introduced balcony doorway with the actual window; previous 106/107 interpretation must be reversed after reference mapping.
9. Remove the nonexistent shelf-like stair-landing projection (SS8).
10. All lift landing doors: photograph-derived decorative PNG with 80% opacity, not plain glass (SS9).
11. Ground-floor kitchen: move exterior radiator to correct interior location and add photographed corner seating (SS10).
12. Basement: remove the photographed-as-absent plan bathroom; match wooden stair flight down to bottom step (SS11).
13. Basement kitchen: match counter corner and cabinet arrangement; hob and hood must align and fit clear of cupboards (SS12).
14. Enable garden and balcony circulation; recreate the high thuja privacy planting from photos.
15. Outbuilding entrance: match raised platform, steps and paving in supplied real photograph (SS13).
16. Pool: visible water and dolphin floor mosaic from reference (SS14).
17. Underground water tank at user-marked position (SS14); dimensions/depth cannot be inferred from a painted surface rectangle alone.
18. Front/rear gardens: reconcile slopes, levels, flowers and paving with real photographs and available CAD.

Reference precedence: the user's explicit corrections and actual site photographs override earlier inferred room labels and generic additions. Do not treat a render screenshot as a photograph of the real house. Preserve an editable source and a pre-review backup.

Final deliverable requested by user: after ALL repairs and checks, create ONE presentation board containing corrected screenshots; beneath each screenshot state the original error that was corrected. Use the completed model, not intermediate renders.

## Native checkpoint, 13 September, 12:53

Working source: `build/blender/angora-rooms-open-doors.blend`. These changes are not yet exported to the browser or pushed. All numbered items remain open until browser verification.

- Interior plaster relief removed; attic lining and blue interior faces repaired. C04 bed and television chest repositioned. C01's remaining stepped ceiling seam was traced to the 3.36–3.99448 m Y junction and repaired locally, retaining the stair roof projection. C01/C03/C05 panorama inspection completed; final exported views still required.
- Dressing wardrobe right return, first-floor chair placement, triple-window centre, 106 balcony door and 107 window corrected in the native scene.
- Basement plan-only bathroom and stair shelf projection removed. Actual small photographed WC remains. The removed bathroom's former door must be excluded from passage counts.
- Ground kitchen interior radiator, table/chairs, under-window radiator and timber blind fitted from photographs. Basement counter/sink opening, hob/hood alignment and upper joinery corrected.
- Three lift landing doors authored closed. Packed `assets/review-textures/lift-rose-photo-v1.png` uses 80% opacity. This is a photo-derived reconstruction, not an exact photographic crop. Web controller still assumes the old open pose and needs updating before delivery.
- `all-room-station-clearance.json`: 27 camera stations, 64 radial body probes each at 0.19 m radius, zero hits; all have floor support. This is a local station test, not a complete route/navigation test. Door samples also returned zero obstructions and missing floor support; the obsolete D13 record is being excluded from future audits.
- Garden/pool/outbuilding corrections, navigation and lift interaction, full browser checks, final compression and final board remain pending.
