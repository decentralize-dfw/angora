# Reviewed web model delivery

Seven GLB assets, navigation for 27 room stations and 192 geometric section slices were regenerated from saved Blender SHA-256 `612f1e43b4f6a2191b36f87942ac3439fea29791f4cec7087a2e2656a3974f2e`.

Both `build/web/full` and `viewer/public/models/full` contain the same delivery. Removed bathroom B10 no longer has a station, room label, space or dimension annotation. The actual WC remains. Twelve retained door crossings and the street approach are checked against the regenerated navigation.

Lift playback now accepts closed native leaf poses. The pool decal has a baked PNG alpha channel; the editable source contains the same packed image. Ceiling probe lighting is desaturated to prevent the outdoor grass colour tinting the interior finish.

Validation: 87 automated tests and Vite production build. Browser smoke check: attic section and C04 room tour load with the new geometry; the room menu excludes the removed bathroom. Full photo-fidelity review and remaining garden/UI work are separate outstanding tasks.

Reproduction: execute `tools/export_review_web.py` inside Blender's roompass console namespace, then run `prepare-native-navigation.mjs`, `build-native-sections.py` and `stage-native-delivery.mjs` with the generated output directory. Always use a fresh output directory for a changed model to avoid reusing section checkpoints.
