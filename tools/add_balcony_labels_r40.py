#!/usr/bin/env python3
"""R40 - name the balconies on the plan.

The villa has three balconies and the plan named none of them: the source
drawing labels BALKON Z10 on the entrance storey and BALKON 109 and 110 on the
first floor, and R30 recorded all three as "modelle yok" - not present as
rooms. They are present as slabs, though, and they are what the rear elevation
is mostly made of, so on a plan the storey above simply had two unexplained
platforms hanging off it.

Their positions are measured, not guessed: each is the area-weighted centroid
of the horizontal slab faces that sit at that storey's datum and fall outside
every enclosed room polygon of that storey - which is the definition of an
outdoor platform on a floor. The three that come out match the drawing's three
balconies in both position and storey.

They are added as label-only rooms. A balcony is not an enclosed space: it has
no derived polygon, no area, no project dimension and no walk station, so the
tag carries the name alone and does not offer the 360° tour that a room's tag
does. Nothing else in the room set changes.
"""
import json, hashlib
from pathlib import Path

ROOT = Path('/home/user/angora')
FULL = ROOT/'build/web/full'
PUB = ROOT/'viewer/public/models/full'

BALCONIES = [
    {'id': 'f1-Z10', 'floor_index': 1, 'code': 'Z10', 'name': 'Balkon',
     'position': [3.3, 3.126, -9.8], 'slab_area_m2': 21.4},
    {'id': 'f2-110', 'floor_index': 2, 'code': '110', 'name': 'Balkon',
     'position': [-0.98, 6.397, -9.35], 'slab_area_m2': 5.6},
    {'id': 'f2-109', 'floor_index': 2, 'code': '109', 'name': 'Balkon',
     'position': [-5.78, 6.397, 1.82], 'slab_area_m2': 2.8},
]
NOTE = ('Açık platform: kapalı hacim değil, bu yüzden türetilmiş poligonu, m² değeri ve proje ölçüsü '
        'yok; etiket yalnızca kaynak plandaki adı taşır. Konum, kat kotundaki yatay döşeme yüzlerinin '
        'oda poligonları dışında kalan kısmının alan ağırlıklı merkezidir.')

for base in (FULL, PUB):
    path = base/'rooms.json'
    data = json.loads(path.read_text())
    data['rooms'] = [r for r in data['rooms'] if r['id'] not in {b['id'] for b in BALCONIES}]
    for balcony in BALCONIES:
        data['rooms'].append({
            **balcony, 'label_only': True, 'dimensions': [],
            'label_anchor_status': 'measured_slab_centroid_outside_room_polygons',
            'name_source': 'build/reference/source-2d-floor-plans.png (BALKON Z10 / 109 / 110)',
            'photo_match_approved': False, 'photo_evidence': 'none', 'area_note': NOTE,
        })
    data.setdefault('area_notes', {})['balconies'] = (
        'Uc balkon etiketi eklendi (Z10, 109, 110); acik platform olduklari icin m2 ve olcu tasimazlar.')
    path.write_text(json.dumps(data, ensure_ascii=False, indent=1))
    manifest_path = base/'manifest.json'
    manifest = json.loads(manifest_path.read_text())
    if 'room_annotations' in manifest:
        manifest['room_annotations']['bytes'] = path.stat().st_size
        manifest['room_annotations']['sha256'] = hashlib.sha256(path.read_bytes()).hexdigest()
        manifest_path.write_text(json.dumps(manifest, ensure_ascii=False, indent=2))
    print(path, 'now carries', len(data['rooms']), 'rooms')

sums = ROOT/'SHA256SUMS.txt'
sums.write_text('\n'.join(
    f'{hashlib.sha256((ROOT/name).read_bytes()).hexdigest()}  {name}'
    for line in sums.read_text().splitlines() for name in [line.split(maxsplit=1)[1]]) + '\n')
print('SHA256SUMS.txt refreshed')
