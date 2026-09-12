#!/usr/bin/env python3
"""R41 - measure the house's plaster colour off the photographs.

The review asked, of the attic ceiling: "tavan bu renk mi resimlerden bakinca?"
It was not. The walls carried a cream (linear 0.823, 0.784, 0.694 - red a good
5% over green, blue 12% under it) and the ceilings a warmer white again, while
every photograph of the house shows a near-neutral off-white with the faintest
green cast and no red in it at all.

Rather than eyeball a replacement, this measures one. In each photograph the
plaster is the brightest large surface and it is nearly achromatic, so the
sample is every pixel that is in the top decile of luminance and under 10%
saturation - which picks the lit walls and ceilings and rejects the timber, the
floors, the sky through a window and anything coloured. The per-photograph
medians agree closely (the spread is exposure, not colour), so their median is
the house's plaster.

That gives a colour but not a level: a photograph's exposure says nothing about
albedo. The level is set by what the paint is - a matt emulsion, which sits
near 0.82 - and applied to the measured chromaticity. The ceilings keep the
half-stop they are brighter than the walls.

Writes build/plaster-colour-r41.json for tools/apply_plaster_colour_r41.mjs.
"""
import glob, json
from pathlib import Path
import numpy as np
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
# every interior photo set in the delivery, so the answer is the house's and
# not one room's
FOLDERS = ['kat_1_bodrum_mutfak', 'kat_1_bodrum_salon', 'kat_2_giris', 'kat_2_ust_salon',
           'kat_2_ust_mutfak', 'kat_3_hol', 'kat_3_master_bedroom', 'kat_3_yatak_odalari',
           'kat_4']
LUMINANCE_PERCENTILE = 92
MAX_SATURATION = 0.10
MIN_PIXELS = 500
WALL_ALBEDO = 0.800
CEILING_ALBEDO = 0.845


def srgb_to_linear(channel):
    c = np.asarray(channel, float)/255.0
    return np.where(c <= 0.04045, c/12.92, ((c + 0.055)/1.055)**2.4)


samples = []
for folder in FOLDERS:
    for path in sorted(glob.glob(str(ROOT/folder/'*'))):
        try:
            pixels = np.asarray(Image.open(path).convert('RGB'), float)
        except Exception:
            continue
        high = pixels.max(2); low = pixels.min(2)
        saturation = np.where(high > 0, (high - low)/np.maximum(high, 1), 0)
        luminance = pixels.mean(2)
        mask = (saturation < MAX_SATURATION) & (luminance > np.percentile(luminance, LUMINANCE_PERCENTILE))
        if mask.sum() < MIN_PIXELS:
            continue
        samples.append({'photo': f'{folder}/{Path(path).name}', 'pixels': int(mask.sum()),
                        'srgb': [round(float(v), 1) for v in np.median(pixels[mask], 0)]})

if len(samples) < 20:
    raise SystemExit(f'only {len(samples)} usable photographs; refusing to set a colour from that')

median = np.median(np.stack([s['srgb'] for s in samples]), 0)
linear = srgb_to_linear(median)
chroma = linear/linear.max()
wall = chroma*WALL_ALBEDO
ceiling = chroma*CEILING_ALBEDO

report = {
    'generated_for': 'R41',
    'method': ('median of the per-photograph medians of pixels above the '
               f'{LUMINANCE_PERCENTILE}th luminance percentile and under '
               f'{MAX_SATURATION:.2f} saturation'),
    'photographs': len(samples),
    'median_srgb': [round(float(v), 1) for v in median],
    'median_linear': [round(float(v), 4) for v in linear],
    'chromaticity': [round(float(v), 4) for v in chroma],
    'wall_albedo': WALL_ALBEDO, 'ceiling_albedo': CEILING_ALBEDO,
    'interior_base_color_factor': [round(float(v), 4) for v in wall] + [1.0],
    'ceiling_base_color_factor': [round(float(v), 4) for v in ceiling] + [1.0],
    'samples': samples,
}
(ROOT/'build/plaster-colour-r41.json').write_text(json.dumps(report, ensure_ascii=False, indent=2))
print(f'{len(samples)} photographs -> plaster sRGB {median.round(1)}')
print(f'  interior {report["interior_base_color_factor"]}')
print(f'  ceiling  {report["ceiling_base_color_factor"]}')
