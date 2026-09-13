# Current editable native scene

`build/blender/angora-rooms-open-doors.blend` is the current editable scene, saved in Blender 5.2.1 LTS. It contains the interior and rear garden repairs made in the local Blender application. It supersedes the older linked `angora21-working.blend` for continuing this review.

The file is stored using Git LFS. Install Git LFS for your Git client, clone the repository, and run `git lfs pull`. Verify that the file is the binary Blender scene rather than a small text pointer before opening it. The original local source remains backed up separately.

The helper scripts under `tools/native_*.py` record the edits and are intended for the matching native scene and persistent Blender review namespace. Do not run them wholesale against the older linked scene. Reports and sampled geometry checks live under `build/qa/rooms-native` and `build/qa/garden-native`.

The web delivery now comes from this saved native snapshot (SHA-256 `8a544d68c78b017dac689580ff241a997655ae8d5846a8dad6a95828bb621f9e`): seven GLBs, a fresh walking grid, 28 room starts and 192 wall/furniture section slices. Twelve dense vegetation objects have a reduced web derivative; native scene geometry remains fully detailed. The garden GLB is 9.9 MB.

The pedestrian and vehicle crossings now connect the CAD street edge to the property, and the front porch has a supported turning approach and entrance threshold. Sampled checks cover 244 front-route positions, 13 open door crossings and adjacent-floor stair routes. The surrounding CAD road network is retained. Photograph-based detail and surrounding road levels are not a surveyed as-built guarantee.

Validation on 13 September 2026: all 85 viewer tests pass, including transfer budgets, asset hashes, native door/road navigation, adjacent-floor connections, lift animation and interaction regressions. The Pages production bundle builds successfully. Desktop and portrait/landscape viewport controls were checked in the local browser. Physical mobile hardware, VR headsets and audible output have not been acceptance-tested.

The UI includes shorter camera rotations, keyboard/pointer focus recovery, paused tours while the page is hidden, responsive reframing, clearer panels and optional locally synthesized sound. GitHub publication requires a successful authenticated main push; a local build or commit alone does not mean the live site has updated.
