#!/usr/bin/env python3
"""FAZ 6 EK Bölüm 4 — per-cell roughness flatness, measured, not claimed.

The audit's method, reproduced exactly: for every batched material's
metallicRoughness texture, crop each angoraBatch member cell (the shader's
own atlasUV mapping: cell (id%g, id//g)/g + pad, span inner — all atlas
fractions) and read the G channel's hi-lo. A cell with hi-lo <= 6/255 is
FLAT. A member whose material carries no metallicRoughness texture is a
scalar — flat by definition. The audit counted 164/177 flat.

Usage:  python3 tools/qa/roughness-cells.py [build/web/batched/desktop]

Prints per-material rows and the total flat/member count. This measures
TEXTURE BYTES ONLY — İŞ B's runtime uDetail roughness drift is shader math
and never shows up here; report both numbers side by side, honestly.
"""
import io
import json
import struct
import sys
from pathlib import Path

from PIL import Image

root = Path(sys.argv[1] if len(sys.argv) > 1 else 'build/web/batched/desktop')
FLAT = 6


def parse_glb(path):
    data = path.read_bytes()
    magic, _ver, _length = struct.unpack_from('<III', data, 0)
    assert magic == 0x46546C67, path
    offset, gltf, binary = 12, None, None
    while offset < len(data):
        size, kind = struct.unpack_from('<II', data, offset)
        chunk = data[offset + 8:offset + 8 + size]
        if kind == 0x4E4F534A:
            gltf = json.loads(chunk)
        elif kind == 0x004E4942:
            binary = chunk
        offset += 8 + size
    return gltf, binary


def image_bytes(gltf, binary, index):
    image = gltf['images'][index]
    view = gltf['bufferViews'][image['bufferView']]
    start = view.get('byteOffset', 0)
    return binary[start:start + view['byteLength']]


total = flat_total = 0
rows = []
for glb in sorted(root.glob('*.glb')):
    if glb.name == 'shadow-proxy.glb':
        continue
    gltf, binary = parse_glb(glb)
    for material in gltf.get('materials', []):
        batch = (material.get('extras') or {}).get('angoraBatch')
        if not batch:
            continue
        members = batch['materials']
        grid, pad, inner = batch['grid'], batch['pad'], batch['inner']
        pbr = material.get('pbrMetallicRoughness', {})
        mr = pbr.get('metallicRoughnessTexture')
        atlas = None
        if mr is not None:
            texture = gltf['textures'][mr['index']]
            source = texture.get('source', texture.get('extensions', {})
                                 .get('EXT_texture_webp', {}).get('source'))
            atlas = Image.open(io.BytesIO(image_bytes(gltf, binary, source))).convert('RGB')
        flats = []
        for index, member in enumerate(members):
            total += 1
            if atlas is None:
                flats.append((member, 'scalar', 0))
                flat_total += 1
                continue
            w = atlas.width
            x0 = ((index % grid) / grid + pad) * w
            y0 = ((index // grid) / grid + pad) * w
            span = inner * w
            cell = atlas.crop((round(x0), round(y0), round(x0 + span), round(y0 + span)))
            g = cell.getchannel('G')
            lo, hi = g.getextrema()
            if hi - lo <= FLAT:
                flats.append((member, 'tex', hi - lo))
                flat_total += 1
        rows.append((glb.name, material.get('name', '?'), len(members), flats))

for name, mat, count, flats in rows:
    if flats:
        detail = ', '.join(f'{m} ({kind} Δ{d})' for m, kind, d in flats)
        print(f'{name} :: {mat}  {len(flats)}/{count} flat  [{detail}]')
    else:
        print(f'{name} :: {mat}  0/{count} flat')

print(f'\nTOTAL flat cells: {flat_total}/{total}  (flat = G channel hi-lo <= {FLAT}/255; '
      f'scalar = no metallicRoughness texture)')
