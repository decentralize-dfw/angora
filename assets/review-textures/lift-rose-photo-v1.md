# Lift rose glass texture

Asset: `lift-rose-photo-v1.png`. Generated with the built-in imagegen tool on 2026-09-13 and copied into this project. This is a photo-derived reconstruction, not a pixel-exact photographic crop. Keep the original photographs as the fidelity reference.

Sources:
- `kat_1_bodrum_mutfak/WhatsApp Image 2026-08-26 at 11.54.10 (4).jpeg`: complete panel and proportions.
- `asansor/WhatsApp Image 2026-08-26 at 11.54.10 (10).jpeg`: close detail of the same panel.

Final prompt:
> Use case: precise-object-edit. Extract and perspective-rectify ONLY the tall narrow decorative frosted stained glass insert on the elevator door, for a 3D architectural model texture. Image 1 is the complete panel on the left wooden door, defining the exact full design and proportions; image 2 is the close detail reference of the SAME rose glass. Output a flat orthographic rectangular texture of just that glass, height approximately 3.2 times width, filling the image edge to edge. Preserve the photographed single burgundy red rose, its exact petal linework, green leaves, long curving golden ochre ribbons, thin silver lead lines and narrow perimeter lines in their original positions and shapes. Preserve the light grey translucent pebbled/frosted glass background; neutral even lighting without reflections of rooms. No wooden door/frame, metal cabin, surroundings, people, text, border outside the glass or invented floral ornaments. This is documentation of an existing object, not a redesign. PNG texture, high detail.

Native use: packed image on the three served landing doors, material alpha 0.8. Web controller must respect `lift_leaf_closed_pose` metadata and include the new pane and timber parts. Final web QA pending.
