#!/usr/bin/env python3
"""FAZ 6 EK Bölüm 4 — frame saturation, measured, not eyeballed.

Mean HSV saturation (0..255) of each given capture PNG, sky excluded by a
luminance-and-blueness heuristic OFF by default (the audit's numbers were
whole-frame, so whole-frame is the default for comparability: C03 72.4 ->
58.8, C04 60.7 -> 52.4 in the audited pair).

Usage:  python3 tools/qa/saturation.py a.png b.png ...
"""
import sys

from PIL import Image

for path in sys.argv[1:]:
    image = Image.open(path).convert('RGB').convert('HSV')
    s = image.getchannel('S')
    stat = s.histogram()
    count = sum(stat)
    mean = sum(i * n for i, n in enumerate(stat)) / max(1, count)
    print(f'{path}  meanS={mean:.1f}')
