# Native model delivery

The current application uses `build/web/native-current/` for Pages. This is the canonical, self-contained model package. Publication to main was authorized on September 19, 2026. The editable scene is `build/blender/angora-material-lighting.blend` (Git LFS); the original owner scene was not overwritten.

From `viewer`, `npm run dev` and `npm run build` first copy the canonical assets into the ignored `public/models/native-current/` directory. The Pages build references the canonical package directly. A model export can be staged with:

```
node tools/stage_native_delivery.mjs <working-export-web-directory> build/web/native-current
```

The staging tool verifies source hashes, copies the active glTF dependency closure, relocates metadata and verifies output bytes. After verification it removes obsolete files only from destinations already identified by a package verification report. It never pushes or publishes.

Current package: 266 dependency files, approximately 158.7 MiB. This is transfer/storage size, not GPU memory. The app keeps only the selected floor's furniture resident. Geometry buffers and shared textures use content hashes so browser caches cannot pair new glTF with old geometry.

The September 19 recheck repaired missing exported stone/retaining-wall AO, rebaked eight AO groups at 2K/4K with 64 Cycles samples, and preserved five indirect daylight maps and 175 surface material graphs. Compression passes RGB and alpha error gates for both UASTC and BC7; rejected maps retain original images. Devices without ASTC/BC7 support use original image fallbacks. This is not a mathematically lossless compression claim. Estimated texture residency with supported compression is 109.0 / 120.5 / 162.1 / 133.4 MiB for floors 0–3, excluding geometry, driver and decoder memory.

Unused UV attributes were removed without modifying Draco bitstreams, positions, normals or topology. New roof plan fills follow source tile/substrate/inner-surface traces. Thin open source returns are explicitly represented as 12 mm drawing strokes, not fabricated solid volumes. A trace-coverage audit is separate from physical-volume acceptance.

123 application tests pass after integrating the newer main branch, including texture/UV delivery and camera framing around the floor dock. The existing regional map, language support and walking lens are retained. The native model continues to use its own authored materials and precomputed section atlas. See `build/qa/native-finalization/RECHECK-2026-09-19.md` for detailed prepublication evidence and limitations.

The authoritative house source geometry is preserved. The source scene, material/AO/light baking scripts and detailed review evidence remain in the sibling `model-finalization` working folder. The packaged model includes runtime metadata, not Blender working files.

Outstanding acceptance items: exact map registration for the two marked missing context buildings and street elevations; the merged basement Salon area; physical phone stability. Desktop viewport emulation does not close the phone acceptance item.
