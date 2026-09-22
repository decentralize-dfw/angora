#!/usr/bin/env python3
"""Stack an ÖNCE/SONRA pair into one labeled comparison image.

Usage: compose-ab.py <before.png> <after.png> <out.png> [--label "C03 - villa"]

The owner should not need a diff tool to see what changed: one image, the
old frame above the new, each carrying its own label bar.
"""
import sys

from PIL import Image, ImageDraw

def bar(width, text, colour):
    strip = Image.new('RGB', (width, 44), colour)
    draw = ImageDraw.Draw(strip)
    draw.text((16, 12), text, fill='white')
    return strip

def main():
    args = [a for a in sys.argv[1:] if not a.startswith('--')]
    label = ''
    if '--label' in sys.argv:
        label = sys.argv[sys.argv.index('--label') + 1]
    before = Image.open(args[0]).convert('RGB')
    after = Image.open(args[1]).convert('RGB')
    width = max(before.width, after.width)
    if before.width != width:
        before = before.resize((width, round(before.height * width / before.width)))
    if after.width != width:
        after = after.resize((width, round(after.height * width / after.width)))
    top = bar(width, ('ÖNCE — ' + label).strip(' —'), (90, 44, 36))
    mid = bar(width, ('SONRA — ' + label).strip(' —'), (16, 92, 70))
    out = Image.new('RGB', (width, top.height + before.height + mid.height + after.height))
    y = 0
    for piece in (top, before, mid, after):
        out.paste(piece, (0, y))
        y += piece.height
    out.save(args[2])
    print('wrote', args[2], out.size)

if __name__ == '__main__':
    main()
