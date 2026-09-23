#!/usr/bin/env python3
"""Seamless PBR sheets for the exterior families.

Every map here TILES: the noise is sampled on a periodic lattice and every
stroke is drawn five times (centre plus the four wrapped neighbours), so a
sheet laid edge to edge shows no seam. Low frequencies are kept OUT on
purpose - a big blob inside a tiling sheet becomes a recognisable pattern
the moment the ground repeats it, and large-scale variation belongs in the
shader's world-space noise, which never repeats.

Channels follow glTF: the metallicRoughness sheet carries roughness in G
and metalness in B, which is what three's roughnessMap/metalnessMap read.

Run: python3 tools/textures/generate.py [family ...]
"""
import sys, math, random
import numpy as np
from PIL import Image, ImageDraw, ImageFilter

N = 512
OUT = 'assets/textures/'
MIRROR = 'viewer/public/textures/'


def noise(rng, n, period):
    g = rng.random((period, period)).astype(np.float32)
    ax = np.linspace(0, period, n, endpoint=False)
    i0 = np.floor(ax).astype(int) % period
    i1 = (i0 + 1) % period
    f = ax - np.floor(ax)
    f = (f * f * (3 - 2 * f)).astype(np.float32)
    fy, fx = f[:, None], f[None, :]
    a = g[np.ix_(i0, i0)]; b = g[np.ix_(i0, i1)]
    c = g[np.ix_(i1, i0)]; d = g[np.ix_(i1, i1)]
    return (a * (1 - fx) + b * fx) * (1 - fy) + (c * (1 - fx) + d * fx) * fy


def fbm(seed, octaves, n=N):
    """Sum of periodic octaves, normalised to 0..1."""
    rng = np.random.default_rng(seed)
    total = sum(w * noise(rng, n, p) for p, w in octaves)
    return (total - total.min()) / float(total.max() - total.min())


def to_normal(height, strength=2.0):
    """Tangent-space normal from a height field, wrapping at the edges."""
    gx = (np.roll(height, -1, 1) - np.roll(height, 1, 1)) * strength
    gy = (np.roll(height, -1, 0) - np.roll(height, 1, 0)) * strength
    nz = np.ones_like(height)
    length = np.sqrt(gx * gx + gy * gy + nz * nz)
    rgb = np.stack([-gx / length, -gy / length, nz / length], -1)
    return Image.fromarray(((rgb * 0.5 + 0.5) * 255).astype(np.uint8), 'RGB')


def orm(rough, metal=0.0):
    """glTF metallicRoughness: R unused, G roughness, B metalness."""
    g = np.clip(rough, 0, 1)
    b = np.full_like(g, metal) if np.isscalar(metal) else np.clip(metal, 0, 1)
    rgb = np.stack([np.zeros_like(g), g, b], -1)
    return Image.fromarray((rgb * 255).astype(np.uint8), 'RGB')


def ramp(t, lo, hi):
    lo = np.array(lo, np.float32); hi = np.array(hi, np.float32)
    return lo + (hi - lo) * t[..., None]


def save(name, image):
    image.save(OUT + name, optimize=True)
    image.save(MIRROR + name, optimize=True)
    print('  %-36s %s' % (name, 'x'.join(map(str, image.size))))


# ---------------------------------------------------------------- families

def stucco():
    """Villa facade and the neighbours' plaster: sand-float render.

    Fine grain with a faint float-trowel drift. Roughness is high and
    UNEVEN - the point of the whole exercise: a wall lit by one sun must
    not answer it identically at every pixel.
    """
    grain = fbm(11, [(24, .34), (64, .30), (150, .22), (300, .14)])
    save('stucco-basecolor.png',
         Image.fromarray(ramp(0.45 + 0.55 * grain, (150, 146, 139), (196, 192, 184))
                         .astype(np.uint8), 'RGB'))
    save('stucco-normal.png', to_normal(grain * 0.55, 3.2))
    save('stucco-orm.png', orm(0.72 + 0.20 * fbm(12, [(20, .5), (70, .3), (180, .2)])))


def clay_tile():
    """Roof tile: keep the authored colour and relief, add the response."""
    wear = fbm(21, [(18, .44), (55, .32), (140, .24)])
    save('clay-tile-orm.png', orm(0.58 + 0.30 * wear))


def travertine():
    save('travertine-orm.png', orm(0.38 + 0.34 * fbm(31, [(22, .42), (70, .34), (170, .24)])))


def asphalt():
    """Road: aggregate, not a grey card. The delivery's cell spans 39 levels."""
    agg = fbm(41, [(30, .30), (90, .34), (220, .36)])
    rgb = ramp(agg, (86, 84, 82), (140, 137, 132))
    speck = np.random.default_rng(42).random((N, N)) > 0.988
    rgb[speck] = (176, 172, 166)
    save('asphalt-basecolor.png', Image.fromarray(rgb.astype(np.uint8), 'RGB'))
    save('asphalt-normal.png', to_normal(agg * 0.5, 2.6))
    save('asphalt-orm.png', orm(0.80 + 0.16 * fbm(43, [(26, .5), (90, .3), (200, .2)])))


def grass():
    save('grass-normal.png', to_normal(fbm(51, [(40, .4), (120, .34), (280, .26)]) * 0.35, 2.0))
    save('grass-orm.png', orm(0.86 + 0.10 * fbm(52, [(24, .6), (80, .4)])))


def limestone():
    """Retaining walls, boundary copings, the neighbours' stonework.

    Coursed blocks: a mortar grid cut into the height, with the courses
    offset row by row so the bond reads as masonry rather than as a net.
    """
    stone = fbm(61, [(20, .38), (60, .32), (160, .30)])
    height = stone.copy()
    joints = Image.new('L', (N, N), 0)
    jd = ImageDraw.Draw(joints)
    rows, rh = 8, N // 8
    for r in range(rows):
        y = r * rh
        jd.line([(0, y), (N, y)], fill=255, width=3)
        offset = (r % 2) * (N // 12)
        for c in range(6):
            x = (offset + c * (N // 6)) % N
            jd.line([(x, y), (x, y + rh)], fill=255, width=3)
    joints = joints.filter(ImageFilter.GaussianBlur(1.6))
    jm = np.asarray(joints, np.float32) / 255.0
    height = height * (1 - 0.85 * jm)
    rgb = ramp(0.35 + 0.65 * stone, (150, 143, 129), (206, 199, 184))
    rgb *= (1 - 0.42 * jm)[..., None]
    save('limestone-basecolor.png', Image.fromarray(np.clip(rgb, 0, 255).astype(np.uint8), 'RGB'))
    save('limestone-normal.png', to_normal(height * 0.8, 3.6))
    save('limestone-orm.png', orm(0.62 + 0.26 * stone + 0.12 * jm))


def metal():
    """Railings, frames, garden steel. The delivery ships these FLAT: the
    villa's own metal cell measures a single RGB value, range 0. Colour
    stays with the delivery; what it gains is a response - brushed grain,
    and enough roughness drift that a rail stops looking like a decal."""
    grain = fbm(71, [(8, .30), (420, .52), (900, .18)])
    save('metal-orm.png', orm(0.30 + 0.26 * grain, metal=0.85))
    save('metal-normal.png', to_normal(grain * 0.22, 1.4))


def timber():
    """The neighbours' dark stained woodwork and the canopy beams."""
    # Grain runs ALONG the board. The first pass summed two isotropic
    # noises and produced swirls - wood is directional or it is not wood.
    # Rings: parallel bands across the width, wandering slightly, with the
    # wander itself periodic so the sheet still tiles. Fibre: noise
    # stretched hard along the length.
    rng = np.random.default_rng(81)
    ax = np.linspace(0, 1, N, endpoint=False)
    wander = noise(rng, N, 6)[:, :1] * 0.06 + noise(rng, N, 18)[:, :1] * 0.02
    bands = np.sin((ax[None, :] + wander) * 14.0 * 2 * math.pi) * 0.5 + 0.5
    bands = bands ** 1.6                      # tight dark lines, wide pale field
    fibre = np.repeat(fbm(82, [(3, .5), (9, .5)], n=N)[:, :1], N, axis=1)
    streak = fbm(83, [(2, .4), (6, .6)], n=N)
    height = 0.58 * bands + 0.24 * fibre + 0.18 * streak
    save('timber-basecolor.png',
         Image.fromarray(ramp(height, (58, 40, 27), (104, 76, 50)).astype(np.uint8), 'RGB'))
    save('timber-normal.png', to_normal(height * 0.5, 2.4))
    save('timber-orm.png', orm(0.46 + 0.28 * height))


FAMILIES = {'stucco': stucco, 'clay-tile': clay_tile, 'travertine': travertine,
            'asphalt': asphalt, 'grass': grass, 'limestone': limestone,
            'metal': metal, 'timber': timber}

if __name__ == '__main__':
    want = sys.argv[1:] or list(FAMILIES)
    for name in want:
        print(name + ':')
        FAMILIES[name]()
