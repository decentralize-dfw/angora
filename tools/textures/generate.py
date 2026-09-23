#!/usr/bin/env python3
"""Seamless PBR sheets for the exterior families.

Everything tiles: noise is sampled on a periodic lattice, every stroke is
drawn against the wrap, and low frequencies are kept OUT - a large shape
inside a tiling sheet is what turns a field into a grid the moment the
ground repeats it. Large-scale variation belongs in the shader's
world-space noise, which never repeats.

What makes these read as material rather than as noise is PER-ELEMENT
variation: every block, tile and slab carries its own colour, its own
wear, its own height. A masonry sheet where all the blocks match is a net,
not a wall. That, plus edge wear where elements meet, is most of the
distance between "procedural" and "photographed".

Channels follow glTF: the metallicRoughness sheet carries roughness in G
and metalness in B, which is what three's roughnessMap/metalnessMap read.

Run: python3 tools/textures/generate.py [family ...]
"""
import sys, math, random
import numpy as np
from PIL import Image, ImageDraw, ImageFilter

N = 1024                     # authoring size; export drops ORM to 256
OUT = 'assets/textures/'
MIRROR = 'viewer/public/textures/'


# ------------------------------------------------------------------ noise

def _lattice(rng, n, period):
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
    rng = np.random.default_rng(seed)
    total = sum(w * _lattice(rng, n, p) for p, w in octaves)
    return _norm(total)


def ridged(seed, octaves, n=N):
    """Turbulence: creases and veins rather than clouds."""
    rng = np.random.default_rng(seed)
    total = sum(w * (1.0 - np.abs(_lattice(rng, n, p) * 2 - 1)) for p, w in octaves)
    return _norm(total)


def _norm(a):
    lo, hi = float(a.min()), float(a.max())
    return (a - lo) / (hi - lo) if hi > lo else np.zeros_like(a)


def warp(field, seed, amount, n=N):
    """Domain warp - the cheapest way to stop noise looking like noise."""
    dx = (fbm(seed, [(6, .6), (14, .4)], n) - .5) * amount
    dy = (fbm(seed + 1, [(6, .6), (14, .4)], n) - .5) * amount
    ys, xs = np.meshgrid(np.arange(n), np.arange(n), indexing='ij')
    return field[(ys + dy).astype(int) % n, (xs + dx).astype(int) % n]


# --------------------------------------------------------------- elements

def courses(n, rows, per_row, seed, jitter=0.35):
    """Running-bond layout. Returns (element id map, mortar mask).

    Every course is offset by its own amount and every element gets a
    different width, so the bond never lines up into columns.
    """
    rng = random.Random(seed)
    ids = np.zeros((n, n), np.int32)
    mortar = Image.new('L', (n, n), 0)
    md = ImageDraw.Draw(mortar)
    rh = n / rows
    ident = 1
    for r in range(rows):
        y0, y1 = int(r * rh), int((r + 1) * rh)
        md.line([(0, y0), (n, y0)], fill=255, width=max(2, n // 220))
        cuts = sorted(rng.uniform(0, 1) for _ in range(per_row - 1))
        offset = rng.uniform(0, 1)
        edges = [0.0] + cuts + [1.0]
        for i in range(len(edges) - 1):
            a = (edges[i] + offset) % 1.0
            x = int(a * n)
            md.line([(x, y0), (x, y1)], fill=255, width=max(2, n // 220))
            ids[y0:y1, :] = 0   # filled below
        # id per element: paint spans, wrapping
        spans = [((edges[i] + offset) % 1.0, (edges[i + 1] + offset) % 1.0)
                 for i in range(len(edges) - 1)]
        for a, b in spans:
            xa, xb = int(a * n), int(b * n)
            if xb > xa:
                ids[y0:y1, xa:xb] = ident
            else:
                ids[y0:y1, xa:]; ids[y0:y1, xa:n] = ident; ids[y0:y1, :xb] = ident
            ident += 1
    mortar = np.asarray(mortar.filter(ImageFilter.GaussianBlur(n / 420)), np.float32) / 255.0
    return ids, mortar


def per_element(ids, seed, spread=1.0):
    """One random value per element id, painted back over its area."""
    rng = np.random.default_rng(seed)
    table = rng.random(int(ids.max()) + 2).astype(np.float32)
    return (table[ids] - 0.5) * spread + 0.5


# ---------------------------------------------------------------- outputs

def to_normal(height, strength=2.0):
    gx = (np.roll(height, -1, 1) - np.roll(height, 1, 1)) * strength
    gy = (np.roll(height, -1, 0) - np.roll(height, 1, 0)) * strength
    nz = np.ones_like(height)
    length = np.sqrt(gx * gx + gy * gy + nz * nz)
    rgb = np.stack([-gx / length, -gy / length, nz / length], -1)
    return Image.fromarray(((rgb * 0.5 + 0.5) * 255).astype(np.uint8), 'RGB')


def orm(rough, metal=0.0):
    g = np.clip(rough, 0, 1)
    b = np.full_like(g, metal, np.float32) if np.isscalar(metal) else np.clip(metal, 0, 1)
    return Image.fromarray((np.stack([np.zeros_like(g), g, b], -1) * 255).astype(np.uint8), 'RGB')


def ramp(t, *stops):
    """Multi-stop colour ramp; t in 0..1."""
    cols = [np.array(c, np.float32) for c in stops]
    k = len(cols) - 1
    scaled = np.clip(t, 0, 1) * k
    i = np.clip(np.floor(scaled).astype(int), 0, k - 1)
    f = (scaled - i)[..., None]
    lo = np.stack([cols[j] for j in range(k)])[i]
    hi = np.stack([cols[j + 1] for j in range(k)])[i]
    return lo * (1 - f) + hi * f


def save(name, image, size=512, quality=90):
    if image.size[0] != size:
        image = image.resize((size, size), Image.LANCZOS)
    for root in (OUT, MIRROR):
        image.save(root + name + '.webp', 'WEBP', quality=quality, method=6)
    print('  %-30s %d' % (name, size))


def colour(name, rgb, size=512):
    save(name, Image.fromarray(np.clip(rgb, 0, 255).astype(np.uint8), 'RGB'), size, 92)


# --------------------------------------------------------------- families

def limestone():
    """Coursed ashlar: retaining walls, boundary copings, garden stone.

    Per-block tone is the whole trick. A wall where every block matches is
    a net drawn on a plane; give each one its own value and a chipped edge
    and it becomes masonry.
    """
    ids, mortar = courses(N, 9, 5, seed=3)
    tone = per_element(ids, 4, spread=0.85)          # her blok kendi tonu
    grain = warp(fbm(61, [(30, .34), (90, .34), (240, .32)]), 62, N // 60)
    pits = (ridged(63, [(60, .5), (180, .5)]) ** 3) * 0.55
    # Kenar aşınması: harç çizgisinin yanı yontulmuş, ortası dolgun
    edge = np.asarray(Image.fromarray((mortar * 255).astype(np.uint8))
                      .filter(ImageFilter.GaussianBlur(N / 150)), np.float32) / 255.0
    face = 0.52 * tone + 0.30 * grain - 0.18 * pits
    height = np.clip(face * (1 - 0.9 * mortar) - 0.25 * edge, 0, 1)
    rgb = ramp(np.clip(face, 0, 1), (128, 121, 108), (176, 168, 152), (212, 205, 189))
    rgb *= (1 - 0.46 * mortar)[..., None]            # derz gölgesi
    rgb *= (1 - 0.14 * pits)[..., None]
    colour('limestone-basecolor', rgb)
    save('limestone-normal', to_normal(height, 4.2))
    save('limestone-orm', orm(0.58 + 0.20 * (1 - tone) + 0.16 * mortar + 0.10 * pits), 256, 86)


def stucco():
    """Sand-float render: villa facade, neighbours' plaster, white trim.

    Flat colour with relief on top reads as plastic. What a trowelled wall
    actually has is arc-shaped float marks, a fine aggregate under them,
    and a slow mottling from how the coat took - none of it strong, all of
    it uneven.
    """
    grain = fbm(11, [(70, .30), (190, .34), (420, .36)])
    mottle = warp(fbm(12, [(14, .55), (34, .45)]), 13, N // 40)
    # Mala izleri: sarmaya karşı beş kez çizilen geniş yaylar
    arcs = Image.new('L', (N, N), 0)
    ad = ImageDraw.Draw(arcs)
    rng = random.Random(14)
    for _ in range(950):
        cx, cy = rng.randrange(N), rng.randrange(N)
        r = rng.randint(N // 14, N // 6)
        a0 = rng.uniform(0, 360); sweep = rng.uniform(28, 74)
        for ox, oy in ((0, 0), (-N, 0), (N, 0), (0, -N), (0, N)):
            ad.arc([cx - r + ox, cy - r + oy, cx + r + ox, cy + r + oy],
                   a0, a0 + sweep, fill=rng.randint(120, 235), width=max(3, N // 190))
    arcs = np.asarray(arcs.filter(ImageFilter.GaussianBlur(N / 520)), np.float32) / 255.0
    height = 0.46 * grain + 0.30 * mottle + 0.24 * arcs
    base = 0.40 + 0.60 * (0.62 * mottle + 0.38 * grain)
    rgb = ramp(base, (138, 133, 124), (176, 171, 162), (211, 207, 198))
    rgb += (arcs * 26)[..., None] - (mottle * 10)[..., None]
    colour('stucco-basecolor', rgb)
    colour('stucco-basecolor-soft', rgb * 0.5 + 172 * 0.5)      # komşular: sönük
    save('stucco-normal', to_normal(height * 0.85, 4.0))
    save('stucco-orm', orm(0.66 + 0.22 * (1 - mottle) + 0.08 * grain), 256, 86)


def clay_tile():
    """Pantile roof: the villa's and the neighbours'.

    Rows of barrel tiles, each one its own fired colour - a roof of
    identical tiles is the giveaway. Overlaps shade, ridges catch, and the
    lower edge of each course carries the shadow of the one above.
    """
    rows, per = 9, 7
    y = np.linspace(0, rows, N, endpoint=False)
    x = np.linspace(0, per, N, endpoint=False)
    row_i = np.floor(y)[:, None].astype(int)
    col_i = (np.floor(x + (row_i % 2) * 0.5)).astype(int)
    ids = (row_i * 97 + col_i) % 4096 + 1
    fy = (y[:, None] - np.floor(y)[:, None])
    fx = (x + (row_i % 2) * 0.5); fx = fx - np.floor(fx)
    barrel = np.sin(np.clip(fx, 0, 1) * math.pi) ** 0.65          # yuvarlak profil
    lap = np.clip((fy - 0.72) / 0.28, 0, 1)                       # bindirme gölgesi
    tone = per_element(ids, 22, spread=0.95)
    grain = fbm(23, [(90, .4), (260, .35), (520, .25)])
    weather = warp(fbm(24, [(10, .6), (26, .4)]), 25, N // 44)
    height = np.clip(0.72 * barrel + 0.16 * grain - 0.44 * lap, 0, 1)
    t = np.clip(0.30 * tone + 0.34 * barrel + 0.18 * grain + 0.18 * weather, 0, 1)
    rgb = ramp(t, (96, 44, 28), (158, 78, 46), (196, 112, 66), (214, 146, 96))
    rgb *= (1 - 0.46 * lap)[..., None]
    rgb *= (1 - 0.16 * (1 - barrel))[..., None]
    colour('clay-tile-basecolor', rgb)
    save('clay-tile-normal', to_normal(height, 4.6))
    save('clay-tile-orm', orm(0.50 + 0.26 * weather + 0.18 * (1 - barrel)), 256, 86)


def travertine():
    """Pool terrace and entrance court: cut travertine, laid in slabs.

    Travertine's signature is the bedding - horizontal veins running
    through the stone - and the pitting where the beds opened. Per-slab
    tone again, because a terrace of identical slabs is a chequerboard.
    """
    ids, joint = courses(N, 6, 4, seed=31, jitter=0.2)
    tone = per_element(ids, 32, spread=0.55)
    # Yatakların yönü YATAY. İlk deneme izotropik ridged kullandı ve leke
    # çıktı; travertin yataklı bir taştır, damar yönü onun kimliğidir.
    beds = ridged(33, [(3, .5), (9, .3), (22, .2)])
    beds = np.repeat(beds[:, :1], N, axis=1)                  # satır boyunca sabit
    beds = warp(beds, 34, N // 160)                           # hafif kıvrım
    beds = np.clip((beds - 0.58) * 3.4, 0, 1) * 0.55          # ince ve açık
    pores = (fbm(35, [(120, .5), (300, .5)]) ** 4) * 0.8
    grain = fbm(36, [(150, .5), (400, .5)])
    height = np.clip(0.42 + 0.26 * tone - 0.34 * pores - 0.20 * beds - 0.9 * joint, 0, 1)
    t = np.clip(0.42 * tone + 0.26 * grain + 0.20 * (1 - beds) + 0.12, 0, 1)
    rgb = ramp(t, (168, 152, 136), (206, 192, 176), (231, 221, 206))
    rgb *= (1 - 0.16 * beds)[..., None]
    rgb *= (1 - 0.22 * pores)[..., None]
    rgb *= (1 - 0.40 * joint)[..., None]
    colour('travertine-basecolor', rgb)
    save('travertine-normal', to_normal(height, 3.8))
    save('travertine-orm', orm(0.34 + 0.26 * pores + 0.18 * beds + 0.14 * (1 - tone)), 256, 86)


def asphalt():
    """Road: aggregate in a binder, not a grey card.

    The delivery's own cell spans 39 levels across the whole road. Real
    asphalt is chips of three or four sizes bedded in tar, with the tar
    holding a sheen the stones do not.
    """
    coarse = fbm(41, [(34, 1)]); mid = fbm(42, [(85, 1)]); fine = fbm(43, [(210, 1)])
    chips = np.maximum(np.maximum(coarse ** 2.4, mid ** 2.8 * .8), fine ** 3.2 * .6)
    chips = warp(chips, 44, N // 110)
    binder = fbm(45, [(60, .5), (170, .5)])
    rng = np.random.default_rng(46)
    quartz = rng.random((N, N)) > 0.9965                      # açık taneler
    t = np.clip(0.30 + 0.52 * chips + 0.18 * binder, 0, 1)
    rgb = ramp(t, (58, 57, 56), (92, 90, 88), (132, 129, 125))
    rgb[quartz] = (188, 184, 178)
    colour('asphalt-basecolor', rgb)
    save('asphalt-normal', to_normal(chips * 0.55 + binder * 0.12, 3.0))
    save('asphalt-orm', orm(0.62 + 0.30 * chips - 0.14 * binder), 256, 86)


def grass():
    """Lawn seen from above.

    Clumps first - mown grass grows in tufts and the tufts catch light
    differently - then blades inside them, then a slow dry/lush drift well
    under the tile so it never becomes a recognisable shape.
    """
    clump = warp(fbm(51, [(40, .5), (95, .5)]), 52, N // 70)
    dry = fbm(53, [(26, .6), (60, .4)])
    fine = fbm(54, [(300, .5), (620, .5)])
    t = np.clip(0.34 * clump + 0.22 * dry + 0.44 * fine, 0, 1)
    rgb = ramp(t, (58, 78, 36), (86, 112, 48), (118, 142, 64), (146, 164, 88))
    img = Image.fromarray(np.clip(rgb, 0, 255).astype(np.uint8), 'RGB')
    blades = Image.new('RGB', (N, N), (0, 0, 0))
    bd = ImageDraw.Draw(blades)
    rng = random.Random(55)
    for _ in range(340000):
        x, y = rng.randrange(N), rng.randrange(N)
        ln = rng.randint(4, 10)          # 4.5 m modülde ~3.5-9 cm
        dx = rng.randint(-2, 2); dy = -rng.randint(ln // 2, ln)
        v = rng.randint(-30, 34)
        col = (max(0, 88 + v), max(0, 114 + v), max(0, 50 + int(v * .7)))
        for ox, oy in ((0, 0), (-N, 0), (N, 0), (0, -N), (0, N)):
            bd.line([(x + ox, y + oy), (x + dx + ox, y + dy + oy)], fill=col, width=1)
    bl = np.asarray(blades.filter(ImageFilter.GaussianBlur(N / 1400)), np.float32)
    out = np.asarray(img, np.float32)
    mask = (bl.sum(2) > 24)[..., None]
    out = np.where(mask, out * 0.24 + bl * 0.76, out)
    colour('grass-basecolor', out)
    save('grass-normal', to_normal(_norm(0.6 * fine + 0.4 * clump) * 0.4, 2.2))
    save('grass-orm', orm(0.82 + 0.12 * dry + 0.06 * fine), 256, 86)


def timber():
    """Stained boards: canopy beams, the neighbours' woodwork.

    Grain runs ALONG the board. Rings wander, spacing varies, and knots
    pull the grain around them - the knots are what stop it reading as
    corduroy.
    """
    rng = np.random.default_rng(81)
    ax = np.linspace(0, 1, N, endpoint=False)
    # Kıvrım ÇOK düşük: ilk iki deneme akan su gibi çıktı. Kereste düz
    # biçilir; gren tahtanın boyunca neredeyse doğrudur, budağın etrafında
    # kıvrılır - kıvrımı budak yapar, dalga değil.
    wander = _lattice(rng, N, 4)[:, :1] * 0.012 + _lattice(rng, N, 13)[:, :1] * 0.004
    spacing = 15.0 + _lattice(rng, N, 3)[:, :1] * 3.0
    bands = np.sin((ax[None, :] + wander) * spacing * 2 * math.pi) * .5 + .5
    bands = bands ** 1.7
    # Budaklar: grenin etrafından döndüğü noktalar
    knots = np.zeros((N, N), np.float32)
    r = random.Random(82)
    ys, xs = np.meshgrid(np.arange(N), np.arange(N), indexing='ij')
    for _ in range(7):
        kx, ky, kr = r.randrange(N), r.randrange(N), r.randint(N // 28, N // 15)
        for ox, oy in ((0, 0), (-N, 0), (N, 0), (0, -N), (0, N)):
            d = np.sqrt((xs - kx - ox) ** 2 + (ys - ky - oy) ** 2)
            knots = np.maximum(knots, np.clip(1 - d / kr, 0, 1) ** 1.6)
    bands = np.clip(bands * (1 - 0.7 * knots) + knots * 0.85, 0, 1)
    fibre = np.repeat(fbm(83, [(3, .5), (8, .5)])[:, :1], N, axis=1)
    height = np.clip(0.54 * bands + 0.22 * fibre + 0.24 * knots, 0, 1)
    rgb = ramp(height, (44, 30, 20), (78, 55, 35), (112, 84, 55))
    rgb *= (1 - 0.30 * knots)[..., None]
    colour('timber-basecolor', rgb)
    save('timber-normal', to_normal(height * 0.5, 2.8))
    save('timber-orm', orm(0.40 + 0.30 * (1 - height) + 0.14 * knots), 256, 86)


def metal():
    """Railings, frames, garden steel. Colour stays with the delivery -
    the villa's own metal cell measures a single RGB value, range 0 - and
    what it gains is a response: brushed grain, and enough roughness drift
    that a rail stops reading as a decal."""
    rng = np.random.default_rng(71)
    brush = np.repeat(_lattice(rng, N, 640)[:1, :], N, axis=0)
    brush = _norm(brush * 0.7 + fbm(72, [(24, .5), (900, .5)]) * 0.3)
    wear = warp(fbm(73, [(12, .6), (30, .4)]), 74, N // 60)
    save('metal-normal', to_normal(brush * 0.16, 1.6))
    save('metal-orm', orm(0.22 + 0.22 * brush + 0.20 * wear, metal=0.88), 256, 86)


FAMILIES = {'stucco': stucco, 'clay-tile': clay_tile, 'travertine': travertine,
            'asphalt': asphalt, 'grass': grass, 'limestone': limestone,
            'metal': metal, 'timber': timber}

if __name__ == '__main__':
    for name in (sys.argv[1:] or list(FAMILIES)):
        print(name + ':')
        FAMILIES[name]()
