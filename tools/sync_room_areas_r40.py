#!/usr/bin/env python3
"""R40 - carry the re-derived spaces back into rooms.json.

tools/derive_room_polygons.py owns the polygons; rooms.json carries a copy of
them plus the per-room area fields the viewer reads. After a geometry change -
the B03 enclosure, the new Giriş doorway - the two drift apart, so this copies
the spaces across and refreshes every solo room's area and every shared room's
note from the same source. Nothing else in rooms.json is touched.
"""
import json, hashlib
from pathlib import Path

ROOT = Path('/home/user/angora')
FULL = ROOT/'build/web/full'
PUB = ROOT/'viewer/public/models/full'

spaces = json.loads((FULL/'room-spaces.json').read_text())['spaces']
by_room = {member: space for space in spaces for member in space['members']}
changed = []

for base in (FULL, PUB):
    path = base/'rooms.json'
    data = json.loads(path.read_text())
    data['spaces'] = spaces
    for room in data['rooms']:
        space = by_room.get(room['id'])
        if space is None:                       # label-only balconies
            continue
        room['space_id'] = space['space_id']
        if len(space['members']) == 1:
            if room.get('area_m2') != space['area_m2']:
                changed.append((room['id'], room.get('area_m2'), space['area_m2']))
            room['area_m2'] = space['area_m2']
            room['area_to_substrate_m2'] = space['area_to_substrate_m2']
            room.setdefault('area_method_label',
                            'r39_solid_inner_faces_sliced_at_datum_plus_1.0m; finished face / substrate face')
            room.pop('shared_space_note', None)
        else:
            room.pop('area_m2', None); room.pop('area_to_substrate_m2', None)
            room.pop('area_method_label', None)
            room['shared_space_note'] = {
                'space_id': space['space_id'], 'members': space['members'],
                'space_area_m2': space['area_m2'],
                'reason': 'R40 duvar katılarında bu etiketler arasında bölme yok; alan paylaşılan hacmindir'}
    path.write_text(json.dumps(data, ensure_ascii=False, indent=1))
    manifest_path = base/'manifest.json'
    manifest = json.loads(manifest_path.read_text())
    if 'room_annotations' in manifest:
        manifest['room_annotations']['bytes'] = path.stat().st_size
        manifest['room_annotations']['sha256'] = hashlib.sha256(path.read_bytes()).hexdigest()
        manifest_path.write_text(json.dumps(manifest, ensure_ascii=False, indent=2))

for row in sorted(set(changed)): print('area changed:', row)
sums = ROOT/'SHA256SUMS.txt'
sums.write_text('\n'.join(
    f'{hashlib.sha256((ROOT/name).read_bytes()).hexdigest()}  {name}'
    for line in sums.read_text().splitlines() for name in [line.split(maxsplit=1)[1]]) + '\n')
print('rooms.json synced to room-spaces.json; SHA256SUMS.txt refreshed')
