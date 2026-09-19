# Web delivery

Install with `pnpm install --frozen-lockfile`, then run `node build.mjs PATH_TO_NATIVE_GLTF_EXPORT_DIRECTORY`.
The input directory contains the authored `manifest.json`, six original glTF parts and their texture/buffer files. The source blend hash is recorded in the output report. Outputs go to `build/web/batched/{desktop,mobile}`.

Materials are sorted into finish families and compatible transparency/AO/indirect-light groups. Up to sixteen material tiles share a 512 px WebP atlas. Vertices retain repeating source UVs and a material index; the viewer wraps atlas lookups per fragment, with padded edges and bounded mip levels. AO and indirect-light UV channels remain separate. Existing vertex colors remain attached to the geometry. Glass uses an inexpensive alpha/environment response instead of a transmission scene pass.

The house, interior and garden are not decimated. Draco quantization is lossy: desktop house positions use 17 bits, mobile 16 bits. Only context geometry is simplified, with bounded relative error; desktop and mobile have separate settings recorded in `report.json`. This is a web quality/performance tradeoff, not a lossless texture claim. Original Blender files are not overwritten.

All six parts load before the first view, and remain resident. Switching floors performs no asset loading or decoder work. Decoder workers are released after loading. Baked AO/indirect illumination, HDR reflections and direct lights replace runtime GTAO, transmission and shadow scene passes for the batched delivery. Dimension geometry uses at most two additional draw calls; SVG witness endpoints identify the measured spans.

Run viewer tests with `node --test tests/*.test.mjs` from `viewer`. Tests enforce Draco, embedded WebP images no larger than 512 px, a 20 MiB model package budget, at most 40 model primitives, retained AO, and no repeat loads across all views. `#viewport` exposes actual all-pass frame statistics and loading timings for manual browser checks. The complete renderer budget is 50 calls, including annotations and section meshes.

Use `?profile=mobile` or `?profile=desktop` for reproducible profile testing. Automatic selection uses the primary pointer. Browser viewport emulation does not establish physical phone performance.
