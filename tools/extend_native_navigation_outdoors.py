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
  * the STAIRWELL is taken from the full surface whole, on all four layers.
    The native raster has no interior staircase in it at all - not one cell
    between two storey datums anywhere inside the house - so its four storeys
    are four islands and a visitor can only change floor by the lift or the
    room menu, in a headset not even that. Treads cannot be spliced in one at
    a time: a cell holds one height per layer, and in the stairwell the native
    raster spent layer 0's on the basement slab, so there is nowhere to put a
    tread without evicting the floor under it cell by cell, and the landings
    at each end would not line up. The full surface has the whole flight and
    is vertically connected - walked, its four storeys are one region - so the
    shaft comes across intact.

    The shaft finds itself, by what a flight of stairs is: NARROW IN PLAN AND
    TALL IN SECTION. A tread is a cell whose height lies strictly between two
    storey datums; the treads are grouped by touching; and a group is a
    staircase when it stacks on three or more storeys, fits inside six metres
    each way in plan, and climbs at least one storey. The front garden's slope
    also stacks on three storeys - it rises through them - but it is fifteen
    metres across, so it is not a stair. The group is then grown by half a
    metre so the landing at each end comes with it.

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

    # A tread sits clear of its own storey's floor and clear of the one above.
    datums = [0.0, 3.0996, 6.3714, 9.4705]
    def is_tread(floor, height_mm):
        height = height_mm / 1000
        top = datums[floor + 1] - 0.05 if floor + 1 < len(datums) else datums[floor] + 2.0
        return datums[floor] + 0.05 < height < top

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

    # --- the stairwell, taken whole -------------------------------------
    # Treads on the full surface, by plan cell: which layers carry one.
    tread_layers = {}
    for floor in range(4):
        for (col, row), (height, mask) in full_layers[floor].items():
            if mask & 3 or height == UNSUPPORTED or not is_tread(floor, height):
                continue
            tread_layers.setdefault((col, row), set()).add(floor)
    # Connected groups of those cells, eight ways.
    groups, seen_cells = [], set()
    for cell in tread_layers:
        if cell in seen_cells:
            continue
        stack, group = [cell], []
        seen_cells.add(cell)
        while stack:
            col, row = stack.pop()
            group.append((col, row))
            for dc in (-1, 0, 1):
                for dr in (-1, 0, 1):
                    other = (col + dc, row + dr)
                    if other in tread_layers and other not in seen_cells:
                        seen_cells.add(other)
                        stack.append(other)
        groups.append(group)
    # A staircase is a group that stacks: three storeys or more, at the same
    # place in plan. A garden slope or a ramped approach is one layer deep.
    SHAFT_SPAN_M, SHAFT_RISE_M = 6.0, 2.5
    shaft = set()
    shafts = []
    for group in groups:
        layers_here = set()
        heights = []
        for cell in group:
            layers_here |= tread_layers[cell]
            for floor in tread_layers[cell]:
                heights.append(full_layers[floor][cell][0] / 1000)
        if len(layers_here) < 3:
            continue
        span_x = (max(c for c, _ in group) - min(c for c, _ in group) + 1) * step
        span_z = (max(r for _, r in group) - min(r for _, r in group) + 1) * step
        rise = max(heights) - min(heights)
        if span_x > SHAFT_SPAN_M or span_z > SHAFT_SPAN_M or rise < SHAFT_RISE_M:
            continue
        shafts.append({'cells': len(group), 'layers': sorted(layers_here),
                       'span_m': [round(span_x, 2), round(span_z, 2)], 'rise_m': round(rise, 2)})
        shaft |= set(group)
    # Onto the new grid, through the world rather than through indices: the two
    # deliveries are offset by a third of a cell, so full's columns are not the
    # new grid's columns plus a constant. Then grown by half a metre, so the
    # landing at each end of the flight comes with it.
    def to_new(col, row):
        x = full_grid['x'] + (col + 0.5) * step
        z = full_grid['z'] + (row + 0.5) * step
        return int((x - x0) // step), int((z - z0) // step)

    grow = int(round(0.5 / step))
    grown = set()
    for cell in shaft:
        col, row = to_new(*cell)
        for dc in range(-grow, grow + 1):
            for dr in range(-grow, grow + 1):
                grown.add((col + dc, row + dr))
    stairwell_changed = 0
    for col, row in grown:
        if not (0 <= col < width and 0 <= row < height):
            continue
        x = x0 + (col + 0.5) * step
        z = z0 + (row + 0.5) * step
        for floor in range(4):
            before = merged[floor].get((col, row))
            value = full_at(floor, x, z)
            if value == before:
                continue
            if value is None:
                merged[floor].pop((col, row), None)
            else:
                merged[floor][(col, row)] = value
            stairwell_changed += 1
    shaft_note = {'groups': shafts, 'cells': len(shaft), 'with_landings': len(grown),
                  'cells_changed': stairwell_changed}

    # The claim the whole merge rests on, proved here where both inputs are in
    # hand: every cell the native raster supported came through untouched
    # OUTSIDE the stairwell, which is the one place the full surface overrides
    # it and is reported separately above. If this ever fails the file is not
    # written at all.
    preserved = altered = 0
    for floor in range(4):
        for (col, row), value in native_layers[floor].items():
            if (col + shift_x, row + shift_z) in grown:
                continue
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
        'stairwell': shaft_note,
        'native_cells_preserved': preserved,
        'native_cells_altered': altered,
    }
    NATIVE.write_text(json.dumps(native, separators=(',', ':')))
    report = {
        'grid': grid,
        'stairwell': shaft_note,
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
