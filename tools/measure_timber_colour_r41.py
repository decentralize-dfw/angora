#!/usr/bin/env python3
"""R41 - what colour is the house's dark joinery, and can the photographs say?

tools/sample_plaster_colour_r41.py settled the plaster because plaster is the
brightest large surface in every interior photograph and is nearly achromatic:
pick the bright, unsaturated pixels and the per-photograph medians agree.

The joinery will not come out the same way, and this records why rather than
leaving the question as an impression. Two estimators are run, both referenced
to the plaster in the same frame so the exposure cancels:

  BROAD   every warm, chromatic, darker-than-median pixel in each photograph
          against that photograph's plaster.
  ISOLATED a hand-checked crop of one door leaf against a lit plaster patch in
          the same shot, with no floor in either box.

They agree on hue and contradict each other on level, by about an order of
magnitude in opposite directions. That is not noise, it is the method failing:
in these photographs a door is never lit the way the plaster beside it is - it
is backlit through a doorway or standing in its own shade - so the ratio that
cancels exposure does not cancel illumination. BROAD is additionally
contaminated by the parquet, which is warm, chromatic, dark-ish and covers far
more of most frames than the doors do.

So this tool reports and does not apply. What it does establish is the hue: the
delivery's `wood_dark` sits at red/blue 2.1, both estimators put the
photographed timber well past that, and no plausible exposure error moves a
hue ratio that far. Settling the level needs a photograph with a door and a
wall in the same light - or a measurement on site.

Writes build/timber-colour-r41.json.
"""
import glob, json
from pathlib import Path
import numpy as np
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
FOLDERS = ['kat_3_hol', 'kat_3_yatak_odalari', 'kat_3_master_bedroom', 'kat_4',
           'kat_2_giris', 'kat_2_ust_salon']
# the plaster albedo this delivery was set to, from the 143-photograph sample
PLASTER = np.array([0.800, 0.7917, 0.7197])
# wood_dark's base colour map, averaged over its 512x512
WOOD_DARK_SRGB = np.array([47.7, 37.1, 31.4])
# the one crop checked by eye: a hall door leaf, and lit plaster above it
ISOLATED = ('kat_3_hol/WhatsApp Image 2026-08-26 at 11.52.44 (12).jpeg',
            (700, 430, 900, 1050), (430, 120, 700, 380))


def to_linear(srgb):
    c = np.asarray(srgb, float)/255.0
    return np.where(c <= 0.04045, c/12.92, ((c + 0.055)/1.055)**2.4)


def to_srgb(linear):
    c = np.asarray(linear, float)
    return np.where(c <= 0.0031308, c*12.92, 1.055*c**(1/2.4) - 0.055)*255


def broad():
    ratios = []
    for folder in FOLDERS:
        for path in sorted(glob.glob(str(ROOT/folder/'*'))):
            try:
                pixels = np.asarray(Image.open(path).convert('RGB'), float)
            except Exception:
                continue
            high = pixels.max(2); low = pixels.min(2); luminance = pixels.mean(2)
            saturation = np.where(high > 0, (high - low)/np.maximum(high, 1), 0)
            plaster = (saturation < 0.10) & (luminance > np.percentile(luminance, 92))
            timber = ((pixels[:, :, 0] > pixels[:, :, 1] + 8) & (pixels[:, :, 1] >= pixels[:, :, 2])
                      & (saturation > 0.25) & (luminance > 18)
                      & (luminance < np.percentile(luminance, 35)))
            if plaster.sum() < 800 or timber.sum() < 800:
                continue
            ratios.append(to_linear(np.median(pixels[timber], 0))/to_linear(np.median(pixels[plaster], 0)))
    return np.median(np.stack(ratios), 0), len(ratios)


def isolated():
    path, door_box, wall_box = ISOLATED
    pixels = np.asarray(Image.open(ROOT/path).convert('RGB'), float)
    def half(box, darker):
        patch = pixels[box[1]:box[3], box[0]:box[2]].reshape(-1, 3)
        level = patch.mean(1)
        keep = level < np.median(level) if darker else level > np.median(level)
        return np.median(patch[keep], 0)
    return to_linear(half(door_box, True))/to_linear(half(wall_box, False))


broad_ratio, photographs = broad()
isolated_ratio = isolated()
current = to_linear(WOOD_DARK_SRGB)
report = {
    'generated_for': 'R41',
    'applied': False,
    'reason': ('the two estimators agree on hue and contradict each other on level; '
               'in these photographs a door is never lit as the plaster beside it is'),
    'current_wood_dark': {
        'texture_mean_srgb': WOOD_DARK_SRGB.round(1).tolist(),
        'linear': current.round(4).tolist(),
        'red_over_blue': round(float(current[0]/current[2]), 2),
    },
    'estimators': {},
}
for name, ratio in (('broad', broad_ratio), ('isolated', isolated_ratio)):
    implied = PLASTER*ratio
    report['estimators'][name] = {
        'timber_over_plaster_linear': np.round(ratio, 4).tolist(),
        'implied_albedo_linear': np.round(implied, 4).tolist(),
        'implied_srgb': to_srgb(implied).round(0).tolist(),
        'red_over_blue': round(float(implied[0]/implied[2]), 2),
        'level_against_current': round(float((implied/current).mean()), 2),
    }
report['estimators']['broad']['photographs'] = photographs
report['estimators']['broad']['caveat'] = 'contaminated by the parquet, which is warm, dark and covers more of most frames than the doors'
report['estimators']['isolated']['caveat'] = 'the door leaf is in its own shade while the plaster patch is lit'
report['agreed'] = ('both estimators put the photographed timber redder than the delivery: '
                    f"red/blue {report['estimators']['broad']['red_over_blue']} and "
                    f"{report['estimators']['isolated']['red_over_blue']} against "
                    f"{report['current_wood_dark']['red_over_blue']}")
(ROOT/'build/timber-colour-r41.json').write_text(json.dumps(report, indent=2))
print(f"broad ({photographs} photographs): red/blue {report['estimators']['broad']['red_over_blue']}, "
      f"level x{report['estimators']['broad']['level_against_current']}")
print(f"isolated crop:               red/blue {report['estimators']['isolated']['red_over_blue']}, "
      f"level x{report['estimators']['isolated']['level_against_current']}")
print(f"delivery wood_dark:          red/blue {report['current_wood_dark']['red_over_blue']}")
print('not applied:', report['reason'])
