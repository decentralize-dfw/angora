#!/usr/bin/env python3
"""The listing photographs at 400 px, for the narrated tour's side gallery.

The originals are half-megabyte frames meant to be opened full screen; the
gallery draws them in a 250 px card, three at a time, while a voiceover plays.
Sending the originals for that costs about twenty megabytes over a six-minute
tour. These are the same frames, long edge 400 px, and the whole set is 1,2 MB.

Run from the repository root after adding or replacing a photograph:
    python3 tools/make-photo-thumbs.py
"""
import glob
import os
from PIL import Image, ImageOps

SOURCES = 'photogallery'
THUMBS = os.path.join(SOURCES, 'thumbs')
EDGE = 400
QUALITY = 82


def main():
    os.makedirs(THUMBS, exist_ok=True)
    sources = sorted(
        path for path in glob.glob(os.path.join(SOURCES, 'angora_*.*'))
        if os.path.isfile(path))
    if not sources:
        raise SystemExit(f'no photographs under {SOURCES}/')
    read = written = 0
    for path in sources:
        # Always .jpg, whatever the original was: the viewer asks for the
        # source name with its extension swapped, so the two cannot drift.
        out = os.path.join(THUMBS, os.path.splitext(os.path.basename(path))[0] + '.jpg')
        image = ImageOps.exif_transpose(Image.open(path)).convert('RGB')
        image.thumbnail((EDGE, EDGE), Image.LANCZOS)
        image.save(out, 'JPEG', quality=QUALITY, optimize=True, progressive=True)
        read += os.path.getsize(path)
        written += os.path.getsize(out)
    print(f'{len(sources)} thumbnails  {read / 1048576:.1f} MB -> {written / 1048576:.2f} MB')


if __name__ == '__main__':
    main()
