"""Static export of the registered viewer map, with an external HTML legend."""
from pathlib import Path
import json
import math

ROOT = Path(__file__).resolve().parents[1]
def read(name):
    return json.loads((ROOT / 'viewer/src' / f'{name}.json').read_text(encoding='utf-8'))
streets, site, places, local, ml = map(read, ['region-streets', 'region-site', 'region-places', 'region-local', 'region-buildings-ml'])
W, H, SCALE, CX, CY = 2400, 1600, .35, 1200, 820
parts = [f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {W} {H}" width="{W}" height="{H}">', '<title>Angora Evleri and its surroundings</title>', '<desc>North-up map from the villa viewer. The villa and dashed neighbourhood boundary are identified. All six amenity layers are shown as coloured dots without place names. The legend sits below the image.</desc>', '<defs><marker id="arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M 1 1 L 9 5 L 1 9" fill="none" stroke="#223e35" stroke-width="1.2"/></marker></defs><rect width="100%" height="100%" fill="#eef1ec"/>']
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
    shape(path(streets['boundary']['ring']), 'fill="#294f3b" fill-opacity=".04" stroke="#446455" stroke-width="2" stroke-dasharray="6 5" vector-effect="non-scaling-stroke"')
shape(''.join(path(p) for p in site['houses']), 'fill="#384d40" fill-opacity=".23"')
shape(path(site['plot']), 'fill="#476350" fill-opacity=".2"')
shape(path(site['villa']), 'fill="#223e35"')
if site.get('pool'):
    shape(path(site['pool']), 'fill="#9cbecb"')
for r in [500, 1000, 2000]:
    parts.append(f'<circle cx="0" cy="0" r="{r}" fill="none" stroke="#455b4e" stroke-opacity=".2" stroke-width="1" stroke-dasharray="2 7" vector-effect="non-scaling-stroke"/>')
parts.append('</g>')
project = lambda x, y: (CX + x*SCALE, CY + y*SCALE)
markers, counts = [], [0]*6
def mark(x, y, g, radius=8):
    px, py = project(x, y)
    if not 8 < px < W-8 or not 8 < py < H-8:
        return
    if any(m[2] == g and math.hypot(px-m[0], py-m[1]) < 4 for m in markers):
        return
    markers.append((px, py, g)); counts[g] += 1
    parts.append(f'<circle cx="{px:.2f}" cy="{py:.2f}" r="{radius}" fill="{places["groups"][g]}" stroke="#eef1ec" stroke-width="1.2"/>')
for x, y, g, name in places['dots']:
    mark(x, y, g)
for p in places['curated'] + local['places']:
    mark(p['x'], p['y'], p['g'], 10)
villa_x = sum(p[0] for p in site['villa'])/len(site['villa'])
villa_y = sum(p[1] for p in site['villa'])/len(site['villa'])
vx, vy = project(villa_x, villa_y)
parts.append(f'<circle cx="{vx:.2f}" cy="{vy:.2f}" r="27" fill="none" stroke="#223e35" stroke-width="2"/><circle cx="{vx:.2f}" cy="{vy:.2f}" r="9" fill="#223e35" stroke="#eef1ec" stroke-width="3"/>')
parts.append(f'<path d="M{vx+25:.2f},{vy-10:.2f} L{vx+90:.2f},{vy-65:.2f} H{vx+350:.2f}" fill="none" stroke="#223e35" stroke-width="2"/><text x="{vx+98:.2f}" y="{vy-82:.2f}" font-family="Arial,sans-serif" font-size="36" letter-spacing="3" fill="#223e35" paint-order="stroke" stroke="#eef1ec" stroke-width="9">ANGORA 21</text>')
labels = [{'name': 'ANGORA 21', 'anchor': [vx, vy]}]
if streets.get('boundary'):
    bx, by = max((project(x, y) for x, y in points(streets['boundary']['ring'])), key=lambda p: p[0])
    parts.append(f'<path d="M{bx+260:.2f},{by-130:.2f} H{bx+160:.2f} L{bx+5:.2f},{by:.2f}" fill="none" stroke="#223e35" stroke-width="2" marker-end="url(#arrow)"/><text x="{bx+270:.2f}" y="{by-120:.2f}" font-family="Arial,sans-serif" font-size="32" fill="#223e35" paint-order="stroke" stroke="#eef1ec" stroke-width="9">Angora Evleri</text>')
    labels.append({'name': 'Angora Evleri', 'anchor': [bx, by]})
names = ['Education', 'Health', 'Food & drink', 'Shopping', 'Parks & sport', 'Services']
parts.append(f'<text x="{W-80}" y="75" text-anchor="middle" font-family="Arial,sans-serif" font-size="27" fill="#496454">↑</text><text x="{W-80}" y="105" text-anchor="middle" font-family="Arial,sans-serif" font-size="15" fill="#496454">N</text>')
parts.append(f'<text x="{W-60}" y="{H-30}" text-anchor="end" font-family="Arial,sans-serif" font-size="13" fill="#7e8b81">Map data © OpenStreetMap contributors · Microsoft / Overture · Angora model</text></svg>')
assert all(counts), counts
target = ROOT / 'assets/residence/life'
(target/'angora-map.svg').write_text(''.join(parts), encoding='utf-8')
# Keep the flat image on phones, but make its two orientation callouts readable.
# The same projection, true POI positions and doubled dots are retained.
mobile = ''.join(parts).replace('font-size="36"', 'font-size="84"').replace('font-size="32"', 'font-size="72"').replace('stroke-width="9"', 'stroke-width="15"')
(target/'angora-map-mobile.svg').write_text(mobile, encoding='utf-8')
(target/'angora-map.json').write_text(json.dumps({'source': 'The viewer region-map datasets and projection', 'northUp': True, 'radiusMetres': 2000, 'allGroups': names, 'groupColors': places['groups'], 'markerCounts': counts, 'markerRadius': [8, 10], 'legend': 'HTML below the image', 'siteGates': False, 'labels': labels}, ensure_ascii=False, indent=2), encoding='utf-8')
print(f'Exported {len(markers)} map points, six categories, villa marker and boundary arrow.')
