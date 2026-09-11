#!/usr/bin/env python3
"""R41 - drop the walking eye height.

The tour stood at 1.62 m, which is a standing adult's eye. Walked, it puts the
ceiling close over you and the rooms read smaller than they are; an interior is
shot from lower for the same reason the lens is shot wider. EYE is the new
height, and both the stored height and every station's own y move together -
leaving one of them behind would make the camera drop or jump the first time
it took a step.
"""
import json, hashlib
from pathlib import Path

ROOT = Path('/home/user/angora')
FULL = ROOT/'build/web/full'
EYE = 1.50

nav = json.loads((FULL/'navigation.json').read_text())
previous = nav['eye_height_m']
delta = EYE - previous
nav['eye_height_m'] = EYE
for station in nav['stations']:
    station['position'][1] = round(station['position'][1] + delta, 4)
(FULL/'navigation.json').write_text(json.dumps(nav, ensure_ascii=False, separators=(',', ':')))

manifest = json.loads((FULL/'manifest.json').read_text())
manifest['navigation']['bytes'] = (FULL/'navigation.json').stat().st_size
manifest['navigation']['sha256'] = hashlib.sha256((FULL/'navigation.json').read_bytes()).hexdigest()
(FULL/'manifest.json').write_text(json.dumps(manifest, ensure_ascii=False, indent=2))

sums = ROOT/'SHA256SUMS.txt'
sums.write_text('\n'.join(
    f'{hashlib.sha256((ROOT/name).read_bytes()).hexdigest()}  {name}'
    for line in sums.read_text().splitlines() for name in [line.split(maxsplit=1)[1]]) + '\n')
print(f'eye height {previous} -> {EYE} m; {len(nav["stations"])} stations moved {delta:+.2f} m')
