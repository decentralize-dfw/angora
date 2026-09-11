#!/usr/bin/env python3
"""R40 - find the project dimension for the room spans the delivery only measured.

On the plan the villa reads as dimensioned in one direction only. Part of that
is real: nine rooms carry a dimension on one axis and nothing on the other.

The source drawing does dimension both axes. The four storeys sit side by side
in one model space, so each storey's plan panel carries its own x offset; the
offsets are recovered from the dimensions already verified (x: f0 +9.6381,
f1 -11.4680, f2 -34.4339, f3 solved here against the attic's own wall faces;
z: -73.3634 on all four). With those, every record in
build/cad/dimension-source.json can be placed in the model and tested.

A dimension is only accepted for a room when the room is a closed space of its
own - that is, when the delivery actually has two opposing faces to measure
between (tools/derive_room_polygons.py wrote them into room-spaces.json). The
test is then exact rather than heuristic: the two registered witness points
must land on that room's own opposing faces, either the finished faces or the
substrate faces 0.030 m behind them, within ACCEPT; and the drawing's own text
must agree with the separation it encloses.

Rooms that share an open volume are skipped on purpose. There is no partition
in the delivery to measure to, so any number put on that axis would be the
storey's clear width wearing a room's name - which is exactly what the existing
model-measured entries say about themselves, with their label switched off.

Output: build/cad/mined-dimensions-r40.json. Nothing is written into rooms.json
here; tools/apply_mined_dimensions_r40.py does that.
"""
import json
from pathlib import Path
from collections import defaultdict

ROOT = Path('/home/user/angora')
FULL = ROOT/'build/web/full'
ACCEPT = 0.006          # m, the acceptance residual the existing set was verified at
LINING = 0.030          # m, the measured wall finish lining
Z_OFFSET = 73.3634      # gltf_z = -(0.01*dwg_y + Z_OFFSET), every storey
X_OFFSET = {0: 9.6381, 1: -11.4680, 2: -34.4339}

dims = json.loads((ROOT/'build/cad/dimension-source.json').read_text())
rooms_doc = json.loads((FULL/'rooms.json').read_text())
spaces_doc = json.loads((FULL/'room-spaces.json').read_text())

rooms = {r['id']: r for r in rooms_doc['rooms']}
existing = defaultdict(dict)
for d in rooms_doc['dimensions']:
    if isinstance(d, dict): existing[d['room_id']][d['axis']] = d
solo = {s['members'][0]: s for s in spaces_doc['spaces'] if len(s['members']) == 1}

def extent(space, axis):
    values = [p[0] if axis == 'x' else p[1] for p in space['boundary_xz']]
    return min(values), max(values)

def place(point, floor, axis):
    return 0.01 * point[0] + X_OFFSET[floor] if axis == 'x' else -(0.01 * point[1] + Z_OFFSET)

# The attic panel is deliberately left unregistered on x. Its offset cannot be
# read off a verified dimension the way the other three can, and it cannot be
# solved either: at datum+1.0 the attic rooms are bounded by the roof slope
# meeting the floor, not by a pair of walls, so there is no face for a drawing
# dimension to land on and no residual to minimise. Fitting an offset to that
# would be fitting noise, and every attic x span it produced would be a number
# with a handle behind it and nothing else.
F3_UNREGISTERED = ('attic plan panel not registered on x: the storey has no verified x dimension to '
                   'read its offset from, and at datum+1.0 its rooms are bounded by the roof slope '
                   'rather than by wall pairs, so there is nothing to solve the offset against')

results, report, skipped = {}, [], []
for room_id, room in rooms.items():
    floor = room['floor_index']
    space = solo.get(room_id)
    for axis in ('x', 'z'):
        if existing[room_id].get(axis, {}).get('dimension_label_allowed'): continue
        if floor == 3 and axis == 'x':
            skipped.append((room_id, axis, F3_UNREGISTERED)); continue
        if not space:
            skipped.append((room_id, axis, 'shares an open volume; no partition to measure to'))
            continue
        lo, hi = extent(space, axis)
        # the drawing dimensions the structure, so either pair may be the one
        pairs = {'finished': (lo, hi), 'substrate': (lo - LINING, hi + LINING)}
        best = None
        for e in dims:
            a, b = e.get('defpoint2'), e.get('defpoint3')
            if not a or not b: continue
            pa, pb = place(a, floor, axis), place(b, floor, axis)
            other = 'z' if axis == 'x' else 'x'
            if abs(place(a, floor, other) - place(b, floor, other)) > 0.02: continue
            slo, shi = min(pa, pb), max(pa, pb)
            if abs((shi - slo) - e['actual_measurement'] / 100) > 0.004: continue
            for kind, (tlo, thi) in pairs.items():
                residual = max(abs(slo - tlo), abs(shi - thi))
                if residual > ACCEPT: continue
                if best is None or residual < best['residual_m']:
                    best = {'handle': e['handle'], 'text': e['text'], 'kind': kind,
                            'actual_cm': e['actual_measurement'], 'span_m': round(shi - slo, 4),
                            'faces_m': [round(tlo, 4), round(thi, 4)],
                            'finished_faces_m': [round(lo, 4), round(hi, 4)],
                            'residual_m': round(residual, 5), 'witness': [a, b],
                            'floor_index': floor, 'axis': axis,
                            'measure_line': {'axis': other,
                                             'value': round(place(a, floor, other), 4)}}
        if best: results[f'{room_id}|{axis}'] = best; report.append((room_id, axis, best['text'], best['kind'], best['residual_m']))
        else: skipped.append((room_id, axis, 'no drawing dimension lands on this room\'s faces'))

print(f'\naccepted {len(results)}:')
for row in sorted(report): print('  ', row)
print(f'\nnot dimensioned ({len(skipped)}):')
for row in sorted(skipped): print('  ', row)

(ROOT/'build/cad/mined-dimensions-r40.json').write_text(json.dumps({
    'version': 1, 'revision': 'R40',
    'method': ('each storey plan panel registered by its own x offset; a dimension is accepted only '
               'for a room that is a closed space in room-spaces.json, when both registered witness '
               'points land on that room\'s own opposing faces - finished or substrate - within '
               '%.3f m and the drawing text agrees with the separation enclosed' % ACCEPT),
    'registration': {'x_offset_per_floor': X_OFFSET, 'z_offset': Z_OFFSET, 'scale': 0.01,
                     'floor_3_x': F3_UNREGISTERED},
    'acceptance_residual_m': ACCEPT, 'wall_finish_lining_m': LINING,
    'source_dimension_file_sha256': rooms_doc['source_dimension_file_sha256'],
    'accepted': results,
    'not_dimensioned': [{'room_id': r, 'axis': a, 'reason': why} for r, a, why in skipped],
}, ensure_ascii=False, indent=1))
print('\nwrote build/cad/mined-dimensions-r40.json')
