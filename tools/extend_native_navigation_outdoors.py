"""Give the native delivery the outdoors its walking surface never carried.

The native navigation is rasterised from the building's own floor layers
($ZEMİN / $ZEMİN KAPLAMA / $MERDİVEN), so it stops at the walls: its grid holds
the house and a metre or two of terrace and nothing else. The garden, the pool
surround, the drive and the ground under the balconies are simply absent, which
is why a visitor walking the model can open the basement door and then stop
dead. The R44 pass that solved this (build/walk-outdoors-r44.json) was run
against the *full* web delivery and never reached the native one.

Both deliveries describe the same house in the same world coordinates on the
same 12 cm step, and in the cells they share their heights agree to the
millimetre (median 0.000 m, p90 0.000 m over 17,840 shared walkable cells), so
the outdoor half of the full navigation can be carried across. What must not be
carried across is anything the native raster already has an opinion about.

The merge, per floor and per cell:

  * the native surface wins wherever it has support - its own heights, its own
    blocks, its own tighter body radius (0.21 m against 0.19 m) and headroom
    (1.68 m against 1.65 m). Nothing inside the house changes.
  * where the native surface has no support at all, the full surface may supply
    one, but only if it is free to stand on AND the native surface has no
    support on any LOWER floor at that same cell. That last clause is the whole
    safety of this: over a gallery void the floor below is native-supported, so
    the void stays a void and never becomes a walkable bridge; under a balcony
    or out on the lawn there is nothing below, so the ground comes through.

The grid grows to the union of the two, aligned to the native origin so every
existing native cell keeps its exact index and the interior is bit-identical.
Cell-indexed side data (threshold_seams) is re-indexed onto the new grid.
"""
import json
import math
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
NATIVE = ROOT / 'build/web/native-current/native-navigation.json'
FULL = ROOT / 'build/web/full/navigation.json'
REPORT = ROOT / 'build/walk-outdoors-native.json'
STEP_EPSILON = 1e-6
UNSUPPORTED = -32768


def decode(path):
    data = json.loads(Path(path).read_text())
    grid = data['grid']
    layers = []
    for layer in data['layers']:
        cells = {}
        for row_index, runs in enumerate(layer['rows']):
            for start, length, height, mask in runs:
                for col in range(start, start + length):
                    cells[(col, row_index)] = (height, mask)
        layers.append(cells)
    return data, grid, layers


def encode(cells, width, height):
    """Back to the delivery's run-length rows: [start, length, height, mask]."""
    rows = []
    for row in range(height):
        runs, run = [], None
        for col in range(width):
            value = cells.get((col, row))
            if value is None:
                run = None
                continue
            if run and run[2] == value[0] and run[3] == value[1] and run[0] + run[1] == col:
                run[1] += 1
            else:
                run = [col, 1, value[0], value[1]]
                runs.append(run)
        rows.append(runs)
    return rows


def main():
    native, native_grid, native_layers = decode(NATIVE)
    full, full_grid, full_layers = decode(FULL)
    if native_grid['step'] != full_grid['step']:
        sys.exit('The two deliveries are on different grid steps; nothing here would line up.')
    step = native_grid['step']

    # The union, aligned to the native origin: native cells keep their indices.
    def extend(origin, other_origin, native_count, other_count):
        before = 0
        while origin - before * step > other_origin + STEP_EPSILON:
            before += 1
        start = origin - before * step
        span = max(origin + native_count * step, other_origin + other_count * step)
        count = 0
        while start + count * step < span - STEP_EPSILON:
            count += 1
        return start, count, before

    x0, width, shift_x = extend(native_grid['x'], full_grid['x'], native_grid['width'], full_grid['width'])
    z0, height, shift_z = extend(native_grid['z'], full_grid['z'], native_grid['height'], full_grid['height'])
    grid = {'x': round(x0, 4), 'z': round(z0, 4), 'step': step, 'width': width, 'height': height}

    def full_at(floor, x, z):
        col = int((x - full_grid['x']) // step)
        row = int((z - full_grid['z']) // step)
        if col < 0 or row < 0 or col >= full_grid['width'] or row >= full_grid['height']:
            return None
        return full_layers[floor].get((col, row))

    merged = [dict() for _ in range(4)]
    added = [0, 0, 0, 0]
    refused_below = [0, 0, 0, 0]
    refused_blocked = [0, 0, 0, 0]
    for row in range(height):
        for col in range(width):
            native_col, native_row = col - shift_x, row - shift_z
            inside = 0 <= native_col < native_grid['width'] and 0 <= native_row < native_grid['height']
            here = [native_layers[f].get((native_col, native_row)) if inside else None for f in range(4)]
            for floor in range(4):
                if here[floor] is not None:
                    merged[floor][(col, row)] = here[floor]
                    continue
                x = x0 + (col + 0.5) * step
                z = z0 + (row + 0.5) * step
                outside = full_at(floor, x, z)
                if outside is None:
                    continue
                if outside[1] & 1:
                    refused_blocked[floor] += 1
                    continue
                # Anything the native raster supports underneath this cell means
                # the cell is inside the house's own volume - a void over a room,
                # a stairwell, the gallery. Ground only comes through where there
                # is nothing below it.
                if any(here[lower] is not None and here[lower][0] != UNSUPPORTED for lower in range(floor)):
                    refused_below[floor] += 1
                    continue
                merged[floor][(col, row)] = outside
                added[floor] += 1

    # The claim the whole merge rests on, proved here where both inputs are in
    # hand: every cell the native raster supported came through untouched. If
    # this ever fails the file is not written at all.
    preserved = altered = 0
    for floor in range(4):
        for (col, row), value in native_layers[floor].items():
            got = merged[floor].get((col + shift_x, row + shift_z))
            if got == value:
                preserved += 1
            else:
                altered += 1
    if altered:
        sys.exit(f'The merge changed {altered} cells the native raster already owned; refusing to write.')

    native['grid'] = grid
    for floor, layer in enumerate(native['layers']):
        cells = merged[floor]
        layer['rows'] = encode(cells, width, height)
        layer['supported_cells'] = sum(1 for value in cells.values() if value[0] != UNSUPPORTED)
        layer['walkable_furnished_cells'] = sum(1 for value in cells.values() if not value[1] & 3)
    for seam in native.get('threshold_seams', []):
        seam['cell'] = [seam['cell'][0] + shift_x, seam['cell'][1] + shift_z]

    # Places you can now stand but could not ask for. The room menu is built
    # from the station list, and in a headset it is the only way to reach
    # another storey at all, so the outdoors and the two balconies get one
    # each. Every anchor is snapped to the nearest cell that is actually free
    # to stand on, and faces the house.
    house = (0.5, -1.5)
    # The two balconies are already in the list and are skipped; they stay
    # named here so a rebuild that ever loses them puts them back.
    wanted = [
        ('f0-site-pool', 'Havuz', 0, 3.30, -14.00),
        ('f0-site-garden', 'Bahçe', 0, -0.50, -22.00),
        ('f1-site-approach', 'Ön bahçe', 1, 0.00, 8.00),
        ('f2-110', 'Balkon', 2, -0.98, -9.35),
        ('f2-109', 'Balkon', 2, -3.58, 5.30),
    ]
    eye = native['eye_height_m']
    added_stations = []
    for room_id, name, floor, ax, az in wanted:
        if any(station['room_id'] == room_id for station in native['stations']):
            continue
        best = None
        reach = int(3.0 / step)
        for dr in range(-reach, reach + 1):
            for dc in range(-reach, reach + 1):
                col = int((ax - x0) // step) + dc
                row = int((az - z0) // step) + dr
                value = merged[floor].get((col, row))
                if value is None or value[0] == UNSUPPORTED or value[1] & 3:
                    continue
                x = x0 + (col + 0.5) * step
                z = z0 + (row + 0.5) * step
                distance = (x - ax) ** 2 + (z - az) ** 2
                if best is None or distance < best[0]:
                    best = (distance, x, z, value[0] / 1000)
        if best is None:
            added_stations.append({'room_id': room_id, 'placed': False, 'reason': 'no free cell within 3 m'})
            continue
        _, x, z, ground = best
        # The walk's forward is (-sin yaw, -cos yaw), so this looks at the house.
        yaw = math.atan2(-(house[0] - x), -(house[1] - z))
        native['stations'].append({
            'room_id': room_id, 'name': name, 'floor_index': floor,
            'position': [round(x, 3), round(ground + eye, 3), round(z, 3)],
            'view_yaw_rad': round(yaw, 4), 'view_pitch_rad': -0.06,
            'anchor_distance_m': round(best[0] ** 0.5, 3), 'outdoors': True,
        })
        added_stations.append({'room_id': room_id, 'placed': True,
                               'position': native['stations'][-1]['position'],
                               'moved_m': round(best[0] ** 0.5, 3)})
    native['outdoors'] = {
        'from': 'build/web/full/navigation.json (R44 outdoor pass)',
        'rule': 'native support wins; the full surface fills only cells with no native support on this or any lower floor',
        'added_cells': added,
        'native_cells_preserved': preserved,
        'native_cells_altered': altered,
    }
    NATIVE.write_text(json.dumps(native, separators=(',', ':')))
    report = {
        'grid': grid,
        'shift': {'x': shift_x, 'z': shift_z},
        'added_cells': added,
        'refused_because_blocked_in_full': refused_blocked,
        'refused_because_native_supports_a_lower_floor': refused_below,
        'walkable_furnished_cells': [layer['walkable_furnished_cells'] for layer in native['layers']],
        'native_cells_preserved': preserved,
        'native_cells_altered': altered,
        'stations_added': added_stations,
    }
    REPORT.write_text(json.dumps(report, indent=2))
    print(json.dumps(report, indent=2))


if __name__ == '__main__':
    main()
