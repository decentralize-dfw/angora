# Angora material maps

`pbr-maps.zip` contains the color, OpenGL (+Y) normal, roughness, metalness and
packed ORM PNG maps listed in `manifest.json`. Extract it in this directory to
inspect or reuse individual maps. They are also packed inside the Blender
libraries and embedded in the GLB exports.

These are baked photo-interpreted materials, not calibrated scans. Homogeneous
dielectric surfaces use a zero metalness map; polished metals use a metal map.
ORM uses R = neutral AO, G = roughness, B = metalness. No geometric AO bake is
claimed. Material repeat sizes are recorded in metres.

Regenerate after the geometry build with Blender running `tools/bake_pbr.py`.

Revision 14 corrects linear-to-sRGB encoding in 62 constant base-color maps.
The source colors are preserved; this fixes an export darkening error, not a
new photo-calibration pass. `color-encoding-report.json` records the authored
linear values and the expected PNG bytes. Normal, roughness, and metalness maps
are unchanged by this correction.
