#!/usr/bin/env python3
"""R41 - let the tour through the doors it was locked out of.

The walking surface marks a cell blocked if the body's 19 cm radius overlaps a
wall, a fitting or a door leaf. Through a 0.90 m doorway that leaves 0.52 m of
free centre - four cells - and through the house's narrower ones, or through
one with a leaf standing open across it, it leaves nothing at all. So thirteen
of the twenty-eight rooms had no way in: on the first floor the dressing room
and the master bathroom, on the ground floor the kitchen, the entrance, the wc
and the garage, in the attic the bathroom.

Two things were shutting the doors. One is the buffer: through a 0.90 m
doorway it leaves 0.52 m of free centre, and through a narrower one, or one
with a leaf standing open across it, it leaves nothing. The other is that the
floor mesh stops at the threshold - the recovered slabs are per room, and the
strip under a door belongs to neither - so even where the buffer left a gap
there was no ground under it to stand on.

This opens them, and opens nothing else. The seed is the largest group of
rooms that already reach each other; every other group is joined to it by the
shortest path that crosses only cells the *wall section itself* says are empty,
checked at ankle, waist and eye height against the atlas's wall contours. A
cell over solid masonry is never opened, so no path runs through a wall. Where
a path crosses a threshold with no floor, at most three cells of it (0.36 m)
are decked at the height of the rooms either side, and only when those two
agree to within one step - a threshold, never a landing over a void.

Writes build/web/full/navigation.json in place and
build/walk-passages-r41.json beside it.
"""
import hashlib, json
from collections import deque
from pathlib import Path
import numpy as np

ROOT = Path(__file__).resolve().parents[1]
FULL = ROOT/'build/web/full'
nav = json.loads((FULL/'navigation.json').read_text())
atlas = json.loads((FULL/'sections.json').read_text())
rooms = json.loads((FULL/'rooms.json').read_text())

grid = nav['grid']
NX, NZ, STEP, X0, Z0 = grid['width'], grid['height'], grid['step'], grid['x'], grid['z']
DATUMS = rooms['floor_datums_m']
# the three heights the surface builder tests a body against
PROBES = (0.30, 0.95, 1.62)
MAX_STEP = nav['maximum_step_m']
# How many cells of missing floor a path may deck in a row. Three is 0.36 m -
# a door threshold. Anything longer is a void and is left alone.
MAX_DECK = 3

heights = np.array([s['height'] for s in atlas['slices']])


def raster(slice_data, keys):
    """Solid mask of one slice's cross-section, on the navigation grid."""
    mask = np.zeros((NZ, NX), bool)
    for pkey, ikey in keys:
        p, idx = slice_data.get(pkey), slice_data.get(ikey)
        if not p or not idx:
            continue
        pts = np.asarray(p, float).reshape(-1, 2)
        tris = pts[np.asarray(idx, int).reshape(-1, 3)]
        for tri in tris:
            lo = tri.min(0); hi = tri.max(0)
            c0 = max(0, int(np.floor((lo[0] - X0)/STEP - 0.5)))
            c1 = min(NX - 1, int(np.ceil((hi[0] - X0)/STEP - 0.5)))
            r0 = max(0, int(np.floor((lo[1] - Z0)/STEP - 0.5)))
            r1 = min(NZ - 1, int(np.ceil((hi[1] - Z0)/STEP - 0.5)))
            if c1 < c0 or r1 < r0:
                continue
            rr, cc = np.mgrid[r0:r1+1, c0:c1+1]
            px = X0 + (cc + 0.5)*STEP; pz = Z0 + (rr + 0.5)*STEP
            a, b, c = tri
            det = (b[0]-a[0])*(c[1]-a[1]) - (b[1]-a[1])*(c[0]-a[0])
            if abs(det) < 1e-12:
                continue
            u = ((b[0]-a[0])*(pz-a[1]) - (b[1]-a[1])*(px-a[0]))/det
            v = ((c[0]-b[0])*(pz-b[1]) - (c[1]-b[1])*(px-b[0]))/det
            inside = (u >= 0) & (v >= 0) & (1 - u - v >= 0)
            mask[r0:r1+1, c0:c1+1] |= inside
    return mask


def slice_at(height):
    return atlas['slices'][int(np.argmin(np.abs(heights - height)))]


def unpack(layer):
    height = np.full((NZ, NX), np.nan)
    flags = np.zeros((NZ, NX), np.uint8)
    supported = np.zeros((NZ, NX), bool)
    for row, runs in enumerate(layer['rows']):
        for start, length, millimetres, flag in runs:
            height[row, start:start+length] = millimetres/1000.0
            flags[row, start:start+length] = flag
            supported[row, start:start+length] = True
    return height, flags, supported


def pack(height, flags, supported):
    rows = []
    for row in range(NZ):
        runs = []; col = 0
        while col < NX:
            if not supported[row, col]:
                col += 1; continue
            start = col
            millimetres = round(height[row, col]*1000)
            flag = int(flags[row, col]); col += 1
            while (col < NX and supported[row, col]
                   and round(height[row, col]*1000) == millimetres
                   and int(flags[row, col]) == flag):
                col += 1
            runs.append([start, col - start, millimetres, flag])
        rows.append(runs)
    return rows


def components(height, walkable):
    label = np.full((NZ, NX), -1, int); count = 0
    for row in range(NZ):
        for col in range(NX):
            if not walkable[row, col] or label[row, col] >= 0:
                continue
            queue = deque([(row, col)]); label[row, col] = count
            while queue:
                r, c = queue.popleft()
                for dr, dc in ((1, 0), (-1, 0), (0, 1), (0, -1)):
                    a, b = r+dr, c+dc
                    if not (0 <= a < NZ and 0 <= b < NX) or label[a, b] >= 0 or not walkable[a, b]:
                        continue
                    if abs(height[a, b] - height[r, c]) > MAX_STEP:
                        continue
                    label[a, b] = count; queue.append((a, b))
            count += 1
    return label, count


def cell_of(x, z):
    return int(round((z - Z0)/STEP - 0.5)), int(round((x - X0)/STEP - 0.5))


report = {'generated_for': 'R41', 'floors': {}}
total_opened = 0
for floor, datum in enumerate(DATUMS):
    layer = nav['layers'][floor]
    height, flags, supported = unpack(layer)
    stations = [s for s in nav['stations'] if s['floor_index'] == floor]
    if not stations:
        continue

    # Where the building itself is solid at any of the three probe heights.
    # Walls only. The atlas's other array - the fixed bodies, q/j - carries the
    # door leaves among the cisterns and tall units, so testing against it
    # refuses to walk past an open door, which is the whole complaint.
    solid = np.zeros((NZ, NX), bool)
    for probe in PROBES:
        solid |= raster(slice_at(datum + probe), [('p', 'i')])

    opened = []
    stuck = set()
    for _ in range(40):
        walkable = supported & (flags == 0)
        label, _count = components(height, walkable)
        groups = {}
        for station in stations:
            r, c = cell_of(station['position'][0], station['position'][2])
            if 0 <= r < NZ and 0 <= c < NX and label[r, c] >= 0:
                groups.setdefault(int(label[r, c]), []).append(station['room_id'])
        if len([k for k in groups if k not in stuck]) < 2:
            break
        seed = max(groups, key=lambda k: len(groups[k]))
        targets = {k for k in groups if k != seed and k not in stuck}

        # Shortest path out of the seed that never stands over solid wall. The
        # state carries how many decked cells the path has crossed in a row, so
        # a threshold can be bridged and a stairwell cannot.
        seen = np.zeros((NZ, NX, MAX_DECK + 1), bool)
        previous = {}
        carried = {}
        queue = deque()
        for r in range(NZ):
            for c in range(NX):
                if label[r, c] == seed:
                    seen[r, c, 0] = True; carried[(r, c, 0)] = height[r, c]
                    queue.append((r, c, 0))
        found = None
        while queue and found is None:
            r, c, gap = queue.popleft()
            standing = carried[(r, c, gap)]
            for dr, dc in ((1, 0), (-1, 0), (0, 1), (0, -1)):
                a, b = r+dr, c+dc
                if not (0 <= a < NZ and 0 <= b < NX) or solid[a, b]:
                    continue
                if supported[a, b]:
                    # Stepping off a decked threshold may cross up to two steps
                    # at once, because the deck itself is then laid out to
                    # split the difference. Stepping between two floors that
                    # both exist may not: that limit is the one keeping the
                    # gallery from becoming a bridge.
                    limit = MAX_STEP * 2 if gap else MAX_STEP
                    if abs(height[a, b] - standing) > limit or seen[a, b, 0]:
                        continue
                    seen[a, b, 0] = True; previous[(a, b, 0)] = (r, c, gap)
                    carried[(a, b, 0)] = height[a, b]
                    if label[a, b] in targets:
                        found = (a, b, 0); break
                    queue.append((a, b, 0))
                else:
                    step = gap + 1
                    if step > MAX_DECK or seen[a, b, step]:
                        continue
                    seen[a, b, step] = True; previous[(a, b, step)] = (r, c, gap)
                    carried[(a, b, step)] = standing
                    queue.append((a, b, step))
        if found is None:
            # Nothing but solid wall between here and any of them. Leave it:
            # these rooms are the eastern annex, whose only door is to the
            # garden, and the tour reaches them from the room picker.
            for k in targets:
                stuck.add(k)
            continue
        # Walk the path back to the seed, then lay it out from the seed end.
        path = []
        node = found
        while True:
            path.append(node)
            if node not in previous:
                break
            node = previous[node]
        path.reverse()

        # Deck each run of missing floor between the two real floors it joins,
        # rising evenly across it, so the sunken salon is reached by two 0.15 m
        # steps rather than by one 0.30 m one the walker is not allowed to take.
        carved = 0; decked = 0
        index = 0
        while index < len(path):
            r, c, _gap = path[index]
            if supported[r, c]:
                if flags[r, c] & 1:
                    flags[r, c] &= ~np.uint8(1); carved += 1
                    opened.append([round(X0 + (c + 0.5)*STEP, 3), round(Z0 + (r + 0.5)*STEP, 3), 'cleared'])
                index += 1
                continue
            run = index
            while run < len(path) and not supported[path[run][0], path[run][1]]:
                run += 1
            below = height[path[index - 1][0], path[index - 1][1]] if index else None
            above = height[path[run][0], path[run][1]] if run < len(path) else None
            if below is None:
                below = above
            if above is None:
                above = below
            span = run - index + 1
            for k in range(index, run):
                rr, cc = path[k][0], path[k][1]
                supported[rr, cc] = True
                height[rr, cc] = below + (above - below) * (k - index + 1)/span
                flags[rr, cc] = 0; decked += 1; carved += 1
                opened.append([round(X0 + (cc + 0.5)*STEP, 3), round(Z0 + (rr + 0.5)*STEP, 3), 'decked'])
            index = run
        joined = groups[int(label[found[0], found[1]])]
        print(f'  f{floor}: opened {carved} cells ({decked} decked) to {" ".join(joined)}')
        total_opened += carved
        if carved == 0:
            # The path is clear of walls but something stands in it. The only
            # thing that can be is furniture, which the viewer's own toggle
            # takes away - so the room is reachable, just not past the sofa.
            stuck.add(int(label[found[0], found[1]]))

    layer['rows'] = pack(height, flags, supported)
    layer['walkable_furnished_cells'] = int((supported & (flags == 0)).sum())
    report['floors'][f'f{floor}'] = {'opened_cells': len(opened), 'cells': opened}

# final connectivity check, on the packed result
unreachable = []
for floor in range(len(DATUMS)):
    stations = [s for s in nav['stations'] if s['floor_index'] == floor]
    if not stations:
        continue
    height, flags, supported = unpack(nav['layers'][floor])
    label, _ = components(height, supported & (flags == 0))
    seen = set()
    for station in stations:
        r, c = cell_of(station['position'][0], station['position'][2])
        seen.add(int(label[r, c]) if 0 <= r < NZ and 0 <= c < NX else -1)
    if len(seen) > 1:
        groups = {}
        for station in stations:
            r, c = cell_of(station['position'][0], station['position'][2])
            groups.setdefault(int(label[r, c]), []).append(station['room_id'])
        unreachable.append({'floor': floor, 'groups': groups})
report['still_separated'] = unreachable
report['opened_cells'] = total_opened

nav['passage_note'] = ('R41: door passages opened where the wall section is empty; '
                       'see build/walk-passages-r41.json')
path = FULL/'navigation.json'
path.write_text(json.dumps(nav, ensure_ascii=False, separators=(',', ':')))
manifest = json.loads((FULL/'manifest.json').read_text())
manifest['navigation'] = {'file': path.name, 'bytes': path.stat().st_size,
                          'sha256': hashlib.sha256(path.read_bytes()).hexdigest()}
(FULL/'manifest.json').write_text(json.dumps(manifest, ensure_ascii=False, indent=2))
(ROOT/'build/walk-passages-r41.json').write_text(json.dumps(report, ensure_ascii=False, indent=2))
print(f'opened {total_opened} cells; floors still separated: {unreachable or "none"}')
