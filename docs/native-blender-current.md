# Current editable native scene

`build/blender/angora-rooms-open-doors.blend` is the current editable scene, saved in Blender 5.2.1 LTS. It contains the interior and rear garden repairs made in the local Blender application. It supersedes the older linked `angora21-working.blend` for continuing this review.

The file is stored using Git LFS. Install Git LFS for your Git client, clone the repository, and run `git lfs pull`. Verify that the file is the binary Blender scene rather than a small text pointer before opening it. The original local source remains backed up separately.

The helper scripts under `tools/native_*.py` record the edits and are intended for the matching native scene and persistent Blender review namespace. Do not run them wholesale against the older linked scene. Reports and sampled geometry checks live under `build/qa/rooms-native` and `build/qa/garden-native`.

This commit preserves the native work; it does not claim that the published GLBs, navigation grids or browser UI already include it. A new export and runtime acceptance pass is required. The front porch route, surrounding roads and remaining exterior photo fit are still under review. Photograph-based detail is not a surveyed as-built guarantee.
