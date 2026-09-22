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

Beside the pixels, each frame's qaReport JSON is compared numerically:
pixelRatio and drawingBuffer exactly (at 1600x900 dpr=1 every budget clamps
to ratio 1.0, so a broken pixel budget is INVISIBLE to the pixel gate and
only the @2x numbers can catch it), draw calls, triangles and the flag set
exactly, memory estimates to 0.2 MiB.
"""
import json
import sys
from pathlib import Path

import numpy as np
from PIL import Image

NOISE_SHARE = 0.00005   # 0.005% of pixels
MIB_TOLERANCE = 0.2

def numeric_mismatches(a_json, b_json):
    try:
        a = json.loads(a_json.read_text())
        b = json.loads(b_json.read_text())
    except FileNotFoundError:
        return ['missing qaReport json']
    problems = []
    ar, br = a.get('renderer', {}), b.get('renderer', {})
    for key in ('pixelRatio', 'drawingBuffer', 'drawCalls', 'triangles'):
        if ar.get(key) != br.get(key):
            problems.append(f"renderer.{key}: {ar.get(key)} -> {br.get(key)}")
    if a.get('flags') != b.get('flags'):
        problems.append(f"flags: {a.get('flags')} -> {b.get('flags')}")
    am, bm = a.get('memory', {}), b.get('memory', {})
    for key in ('estimatedTextureMiB', 'estimatedGeometryMiB'):
        av, bv = am.get(key), bm.get(key)
        if av is None or bv is None:
            if av != bv:
                problems.append(f"memory.{key}: {av} -> {bv}")
        elif abs(av - bv) > MIB_TOLERANCE:
            problems.append(f"memory.{key}: {av} -> {bv}")
    return problems

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
        numbers = numeric_mismatches(a_png.with_suffix('.json'), b_png.with_suffix('.json'))
        pixel_verdict = ('identical' if changed == 0
                         else 'noise' if share <= NOISE_SHARE else 'changed')
        rows.append({
            'frame': str(rel),
            'changedPx': changed,
            'share': round(share, 8),
            'maxDelta': int(delta.max()),
            'bbox': None if changed == 0 else
                [int(xs.min()), int(ys.min()), int(xs.max()), int(ys.max())],
            'numericMismatches': numbers,
            'verdict': 'numeric-mismatch' if numbers else pixel_verdict,
        })
    report = {'a': str(a_root), 'b': str(b_root), 'noiseShare': NOISE_SHARE,
              'worstShare': round(worst, 8), 'frames': rows}
    text = json.dumps(report, indent=2)
    if out:
        Path(out).write_text(text)
    for row in rows:
        print(f"{row['frame']:<32} {row['verdict']:<16} "
              f"{row.get('changedPx', '-')} px  bbox={row.get('bbox')}")
        for problem in row.get('numericMismatches', []):
            print('    ', problem)
    print('worst share:', report['worstShare'])
    if any(r['verdict'] not in ('identical', 'noise') for r in rows):
        sys.exit(1)

if __name__ == '__main__':
    main()
