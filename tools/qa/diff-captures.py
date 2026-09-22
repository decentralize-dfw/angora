#!/usr/bin/env python3
"""Pixel-diff two qa-capture directories (build/qa/<tagA> vs <tagB>).

Usage: python3 tools/qa/diff-captures.py <dirA> <dirB> [--out report.json]

Verdict per frame:
  identical   0 changed pixels
  noise       <= NOISE_SHARE of pixels changed - measured SwiftShader
              sub-pixel rasterisation jitter on thin geometry (railings,
              section hatches); bounded at 0.005% of the frame
  changed     anything above that

The tool never decides whether a change is GOOD - it only says where and how
big. Screenshots include the DOM chrome, so a UI change also reads as
'changed'; judge with the images beside the numbers.
"""
import json
import sys
from pathlib import Path

import numpy as np
from PIL import Image

NOISE_SHARE = 0.00005   # 0.005% of pixels

def main():
    args = [a for a in sys.argv[1:] if not a.startswith('--')]
    out = None
    if '--out' in sys.argv:
        out = sys.argv[sys.argv.index('--out') + 1]
    a_root, b_root = Path(args[0]), Path(args[1])
    rows, worst = [], 0.0
    for a_png in sorted(a_root.glob('*/*.png')):
        rel = a_png.relative_to(a_root)
        b_png = b_root / rel
        if not b_png.exists():
            rows.append({'frame': str(rel), 'verdict': 'missing-in-b'})
            continue
        a = np.asarray(Image.open(a_png).convert('RGB')).astype(int)
        b = np.asarray(Image.open(b_png).convert('RGB')).astype(int)
        if a.shape != b.shape:
            rows.append({'frame': str(rel), 'verdict': 'size-mismatch',
                         'a': a.shape, 'b': b.shape})
            continue
        delta = np.abs(a - b).sum(axis=2)
        changed = int((delta > 0).sum())
        share = changed / delta.size
        worst = max(worst, share)
        ys, xs = np.nonzero(delta)
        rows.append({
            'frame': str(rel),
            'changedPx': changed,
            'share': round(share, 8),
            'maxDelta': int(delta.max()),
            'bbox': None if changed == 0 else
                [int(xs.min()), int(ys.min()), int(xs.max()), int(ys.max())],
            'verdict': 'identical' if changed == 0
                else 'noise' if share <= NOISE_SHARE else 'changed',
        })
    report = {'a': str(a_root), 'b': str(b_root), 'noiseShare': NOISE_SHARE,
              'worstShare': round(worst, 8), 'frames': rows}
    text = json.dumps(report, indent=2)
    if out:
        Path(out).write_text(text)
    for row in rows:
        print(f"{row['frame']:<28} {row['verdict']:<12} "
              f"{row.get('changedPx', '-')} px  bbox={row.get('bbox')}")
    print('worst share:', report['worstShare'])
    if any(r['verdict'] not in ('identical', 'noise') for r in rows):
        sys.exit(1)

if __name__ == '__main__':
    main()
