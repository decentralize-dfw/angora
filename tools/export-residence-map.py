"""Static editorial export of the viewer's registered region map; all six POI layers."""
from pathlib import Path
import html
import json
import math
from PIL import ImageFont

ROOT = Path(__file__).resolve().parents[1]
def read(name):
    return json.loads((ROOT / 'viewer/src' / f'{name}.json').read_text(encoding='utf-8'))
streets, site, places, local, ml = map(read, ['region-streets', 'region-site', 'region-places', 'region-local', 'region-buildings-ml'])
W, H, SCALE, CX, CY = 2400, 1600, .35, 1200, 820
parts = [f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {W} {H}" width="{W}" height="{H}">', '<title>Angora Evleri and its surroundings</title>', '<desc>North-up map from the villa viewer. Education, health, food, shopping, parks and services are all visible. Site gates and application controls are excluded.</desc>', '<rect width="100%" height="100%" fill="#eef1ec"/>']
def points(raw):
    return list(zip(raw[::2], raw[1::2])) if raw and isinstance(raw[0], (float, int)) else raw
def path(raw, closed=True):
    return 'M' + ' '.join(f'{x:.2f},{y:.2f}' for x, y in points(raw)) + ('Z' if closed else '')
def shape(d, attrs):
    parts.append(f'<path d="{d}" {attrs}/>')
parts.append(f'<g transform="translate({CX} {CY}) scale({SCALE})">')
shape(''.join(path(p) for p in streets['green']), 'fill="#dce5d9" fill-opacity=".75"')
hidden = set(site['osm']['hideBuildings'])
hidden_ml = set(site['osm'].get('hideMl', []))
shape(''.join(path(p) for i, p in enumerate(streets['buildings']) if i not in hidden), 'fill="#162d22" fill-opacity=".1"')
shape(''.join(path(p) for i, p in enumerate(ml['buildings']) if i not in hidden_ml), 'fill="#162d22" fill-opacity=".1"')
shape(''.join(path(p) for p in site['roads']), 'fill="#cbd1c8" fill-rule="evenodd"')
replaced = set(site['osm']['replacedRoads'])
for cls, weight, alpha in [(3, .9, .12), (2, 1.5, .21), (1, 2.3, .27), (0, 3.2, .34)]:
    lines = [path(p, False) for i, (c, _, p) in enumerate(streets['roads']) if c == cls and i not in replaced]
    lines += [path(p, False) for c, p in site['osm']['keptRuns'] if c == cls]
    shape(''.join(lines), f'fill="none" stroke="#243e31" stroke-opacity="{alpha}" stroke-width="{weight}" stroke-linecap="round" stroke-linejoin="round" vector-effect="non-scaling-stroke"')
if streets.get('boundary'):
    shape(path(streets['boundary']['ring']), 'fill="#294f3b" fill-opacity=".04" stroke="#446455" stroke-width="1.6" stroke-dasharray="6 5" vector-effect="non-scaling-stroke"')
shape(''.join(path(p) for p in site['houses']), 'fill="#384d40" fill-opacity=".23"')
shape(path(site['plot']), 'fill="#476350" fill-opacity=".2"')
shape(path(site['villa']), 'fill="#223e35"')
if site.get('pool'):
    shape(path(site['pool']), 'fill="#9cbecb"')
for r in [500, 1000, 2000]:
    parts.append(f'<circle cx="0" cy="0" r="{r}" fill="none" stroke="#455b4e" stroke-opacity=".2" stroke-width="1" stroke-dasharray="2 7" vector-effect="non-scaling-stroke"/>')
parts.append('</g>')
project = lambda x, y: (CX + x*SCALE, CY + y*SCALE)
occupied = [(50, 35, 550, 90), (50, H-95, W-100, 70)]
markers = []
counts = [0]*6
def mark(x, y, g, radius=4):
    px, py = project(x, y)
    if not 35 < px < W-35 or not 125 < py < H-130:
        return
    if any(m[2] == g and math.hypot(px-m[0], py-m[1]) < 4 for m in markers):
        return
    markers.append((px, py, g)); counts[g] += 1
    parts.append(f'<circle cx="{px:.2f}" cy="{py:.2f}" r="{radius}" fill="{places["groups"][g]}" stroke="#eef1ec" stroke-width="1.2"/>')
for x, y, g, name in places['dots']:
    mark(x, y, g)
for p in places['curated'] + local['places']:
    mark(p['x'], p['y'], p['g'], 5)
labels = []
def label(name, x, y, color='#223e35', primary=False):
    px, py = project(x, y)
    font = 44 if primary else 32
    face=ImageFont.truetype('arial.ttf', font)
    width, height = max(70, face.getlength(name)+48), font+20
    # Label boxes occupy screen pixels. Try short placements around the exact
    # point, and omit a title if none is free; every category's dots remain.
    offsets = [(12, -height-5), (12, 6), (-width-12, -height-5), (-width-12, 6)]
    for dx, dy in offsets:
        box = (px+dx, py+dy, width, height)
        bx, by, bw, bh = box
        if bx < 45 or by < 130 or bx+bw > W-45 or by+bh > H-130:
            continue
        if any(bx < tx+tw+8 and bx+bw+8 > tx and by < ty+th+8 and by+bh+8 > ty for tx, ty, tw, th in occupied):
            continue
        occupied.append(box); labels.append({'name': name, 'box': box})
        background, text = ('#223e35', '#eef1ec') if primary else ('#f8f9f4', '#2c4336')
        parts.append(f'<rect x="{bx:.2f}" y="{by:.2f}" width="{bw:.2f}" height="{bh:.2f}" rx="{bh/2}" fill="{background}" stroke="#d3dbd1"/>')
        parts.append(f'<circle cx="{bx+15:.2f}" cy="{by+bh/2:.2f}" r="3.5" fill="{color}"/>')
        parts.append(f'<text x="{bx+26:.2f}" y="{by+bh/2+font*.34:.2f}" font-family="Arial,sans-serif" font-size="{font}" fill="{text}">{html.escape(name)}</text>')
        return
villa_x = sum(p[0] for p in site['villa'])/len(site['villa'])
villa_y = sum(p[1] for p in site['villa'])/len(site['villa'])
label('ANGORA 21', villa_x, villa_y, primary=True)
candidates = sorted(local['places'], key=lambda p: p.get('rank', 2)) + places['curated']
seen = set()
for p in candidates:
    name = p.get('en', p['name'])
    if name in seen or math.hypot(p['x'], p['y']) > 2100:
        continue
    seen.add(name); label(name, p['x'], p['y'], places['groups'][p['g']])
# Every category's markers remain. Titles use the viewer's curated and local
# selection, so the drawing is legible as one static neighbourhood view.
parts.append('<text x="60" y="68" font-family="Arial,sans-serif" font-size="19" letter-spacing="4" fill="#496454">ANGORA EVLERI · ANKARA</text><text x="60" y="108" font-family="Arial,sans-serif" font-size="16" fill="#79877e">The neighbourhood, in context.</text>')
names = ['Education', 'Health', 'Food & drink', 'Shopping', 'Parks & sport', 'Services']
for g, name in enumerate(names):
    x = 60 + g*295
    parts.append(f'<circle cx="{x}" cy="{H-73}" r="5" fill="{places["groups"][g]}"/><text x="{x+15}" y="{H-67}" font-family="Arial,sans-serif" font-size="17" fill="#496454">{html.escape(name)}</text>')
parts.append(f'<text x="{W-80}" y="75" text-anchor="middle" font-family="Arial,sans-serif" font-size="27" fill="#496454">↑</text><text x="{W-80}" y="105" text-anchor="middle" font-family="Arial,sans-serif" font-size="15" fill="#496454">N</text>')
parts.append(f'<text x="{W-60}" y="{H-30}" text-anchor="end" font-family="Arial,sans-serif" font-size="13" fill="#7e8b81">Map data © OpenStreetMap contributors · Microsoft / Overture · Angora model</text></svg>')
for i, a in enumerate(labels):
    ax, ay, aw, ah = a['box']
    for b in labels[i+1:]:
        bx, by, bw, bh = b['box']
        assert not (ax < bx+bw and ax+aw > bx and ay < by+bh and ay+ah > by), (a['name'], b['name'])
assert all(counts), counts
target = ROOT / 'assets/residence/life'
(target/'angora-map.svg').write_text(''.join(parts), encoding='utf-8')
(target/'angora-map.json').write_text(json.dumps({'source': 'The viewer region-map datasets and projection', 'northUp': True, 'radiusMetres': 2000, 'allGroups': names, 'markerCounts': counts, 'siteGates': False, 'labels': labels}, ensure_ascii=False, indent=2), encoding='utf-8')
print(f'Exported {len(markers)} map points, six visible categories, {len(labels)} non-overlapping labels.')
