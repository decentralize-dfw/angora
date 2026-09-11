#!/usr/bin/env python3
"""R40 - re-seat the floor-0 walk stations after the B03 enclosure.

The B03 partition walls and the garden dining set's 0.60 m move south changed
the floor-0 obstacle mask; the stations stored in navigation.json were picked
against the open-loft mask (the f0-B04 station now sits under the moved dining
table). This recomputes the six floor-0 stations with the same rules
tools/build_walk_navigation.py uses - nearest walkable supported cell to the
room's registered position (must be within 1.9 m), then the yaw with the
longest clear 0.12 m-stepped walk probe out of 48 directions - and leaves
every other floor untouched. Refreshes the manifest hash and SHA256SUMS.txt.
"""
import json, math, hashlib
from pathlib import Path
import numpy as np

ROOT = Path('/home/user/angora')
FULL = ROOT/'build/web/full'
nav = json.loads((FULL/'navigation.json').read_text())
rooms = json.loads((FULL/'rooms.json').read_text())

g = nav['grid']; x0, z0, step, nx, nz = g['x'], g['z'], g['step'], g['width'], g['height']
layer = next(l for l in nav['layers'] if l['floor_index'] == 0)
support = np.full(nz*nx, np.inf); mask = np.ones(nz*nx, dtype=np.uint8)
for r, runs in enumerate(layer['rows']):
    for c0, ln, hmm, flag in runs:
        idx = r*nx + np.arange(c0, c0+ln)
        support[idx] = hmm/1000.0; mask[idx] = flag
xy = np.column_stack(np.meshgrid(x0+(np.arange(nx)+.5)*step, z0+(np.arange(nz)+.5)*step)[::1]).reshape(-1, 2) \
    if False else None
gx, gz = np.meshgrid(x0+(np.arange(nx)+.5)*step, z0+(np.arange(nz)+.5)*step)
xy = np.column_stack([gx.ravel(), -gz.ravel()])
supported = np.isfinite(support)

changed = []
for st in nav['stations']:
    if st['floor_index'] != 0:
        continue
    room = next(r for r in rooms['rooms'] if r['id'] == st['room_id'])
    x, y, z = room['position']
    distance = np.linalg.norm(xy - [x, -z], axis=1)
    valid = (mask == 0) & supported & (abs(support - (y - .026)) < .15)
    ids = np.flatnonzero(valid)
    assert len(ids), (st['room_id'], 'no reachable surface')
    index = ids[np.argmin(distance[ids])]
    assert distance[index] < 1.9, (st['room_id'], 'no nearby safe station', distance[index])
    origin = xy[index]; best_yaw, best_clear = 0., -1.
    for yaw in np.linspace(-np.pi, np.pi, 48, endpoint=False):
        direction = np.array([-np.sin(yaw), np.cos(yaw)]); clear = 0.
        for dm in np.arange(.12, 4.01, .12):
            probe = origin + direction*dm
            col = int(np.floor((probe[0]-x0)/step)); row = int(np.floor((-probe[1]-z0)/step))
            if not (0 <= col < nx and 0 <= row < nz): break
            t = row*nx + col
            if mask[t] or not np.isfinite(support[t]) or abs(support[t]-support[index]) > .24: break
            clear = dm
        if clear > best_clear: best_clear, best_yaw = clear, yaw
    new = {'position': [round(float(xy[index, 0]), 4), round(float(support[index]+1.62), 4), round(float(-xy[index, 1]), 4)],
           'view_yaw_rad': round(float(best_yaw), 4),
           'anchor_distance_m': round(float(distance[index]), 3)}
    if new['position'] != st['position'] or new['view_yaw_rad'] != st['view_yaw_rad']:
        changed.append((st['room_id'], st['position'], '->', new['position'], 'yaw', st['view_yaw_rad'], '->', new['view_yaw_rad']))
    st.update(new)

(FULL/'navigation.json').write_text(json.dumps(nav, ensure_ascii=False, separators=(',', ':')))
manifest = json.loads((FULL/'manifest.json').read_text())
manifest['navigation']['bytes'] = (FULL/'navigation.json').stat().st_size
manifest['navigation']['sha256'] = hashlib.sha256((FULL/'navigation.json').read_bytes()).hexdigest()
(FULL/'manifest.json').write_text(json.dumps(manifest, ensure_ascii=False, indent=2))
sums = ROOT/'SHA256SUMS.txt'
sums.write_text('\n'.join(
    f'{hashlib.sha256((ROOT/name).read_bytes()).hexdigest()}  {name}'
    for line in sums.read_text().splitlines()
    for name in [line.split(maxsplit=1)[1]]) + '\n')
for c in changed: print(*c)
print('stations updated:', len(changed))
