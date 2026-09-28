"""Bölge haritası için eksik bina izleri - Overture Maps (buildings teması).

    pip install pyarrow fsspec aiohttp shapely
    SSL_CERT_FILE=... python3 tools/region/fetch_overture_buildings.py [release]

Ürün sahibi (28.09): "bölgedeki tüm haritanın accurate olması gerekiyor,
bina footprintlerinin, 2 km'ye kadar". OSM Beysukent ve çevresinde binaların
yarısından fazlasını taşımıyor. Overture'ın bina teması OSM'i temel alır,
OSM'in olmadığı yerde Microsoft ML Building Footprints (uydu görüntüsünden)
ekler. Buradan yalnız OSM DIŞI kayıtlar alınır; OSM binaları zaten
region-streets.json'da. Lisans: ODbL (Overture / Microsoft).

Çıktı: viewer/src/region-buildings-ml.json  {source, fetched, buildings:[[x0,y0,...]]}
Projeksiyon region-streets ile aynı (extract_region_streets_r45.mjs): adres
noktası merkezli, x=doğu, y=güney, metre.
"""
import json, math, os, re, sys, datetime, urllib.request
import concurrent.futures as cf
import fsspec, pyarrow.parquet as pq, pyarrow.compute as pc
from shapely import wkb

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
RELEASE = sys.argv[1] if len(sys.argv) > 1 else '2026-09-23.1'
BASE = 'https://overturemaps-us-west-2.s3.amazonaws.com/'
PREFIX = f'release/{RELEASE}/theme=buildings/type=building/'
CLAT, CLON = 39.87021694, 32.71868652
M_LAT = 111132; M_LON = 111320 * math.cos(math.radians(CLAT))
RADIUS = 2300  # m; harita 2 km yarıçapa kadar gösterir
LON = (CLON - RADIUS / M_LON, CLON + RADIUS / M_LON); LAT = (CLAT - RADIUS / M_LAT, CLAT + RADIUS / M_LAT)

fs = fsspec.filesystem('https', client_kwargs={'trust_env': True})
listing = urllib.request.urlopen(f'{BASE}?list-type=2&prefix={PREFIX}&max-keys=1000').read().decode()
keys = re.findall(r'<Key>([^<]*)</Key>', listing)

def scan(key):
    with fs.open(BASE + key, block_size=2 ** 20) as f:
        md = pq.ParquetFile(f).metadata
        names = [md.schema.column(i).path for i in range(md.num_columns)]
        ix = {n: names.index(n) for n in ('bbox.xmin', 'bbox.xmax', 'bbox.ymin', 'bbox.ymax')}
        hits = []
        for g in range(md.num_row_groups):
            rg = md.row_group(g); st = lambda n: rg.column(ix[n]).statistics
            if st('bbox.xmax').max >= LON[0] and st('bbox.xmin').min <= LON[1] and st('bbox.ymax').max >= LAT[0] and st('bbox.ymin').min <= LAT[1]:
                hits.append(g)
        return key, hits

with cf.ThreadPoolExecutor(16) as ex:
    hits = {k: h for k, h in ex.map(scan, keys) if h}

buildings = []
for key, groups in hits.items():
    with fs.open(BASE + key, block_size=8 * 2 ** 20) as f:
        t = pq.ParquetFile(f).read_row_groups(groups, columns=['geometry', 'bbox', 'sources'])
    b = t.column('bbox').combine_chunks()
    xmin, ymin = pc.struct_field(b, 'xmin'), pc.struct_field(b, 'ymin')
    t = t.filter(pc.and_(pc.and_(pc.greater_equal(xmin, LON[0]), pc.less_equal(xmin, LON[1])),
                         pc.and_(pc.greater_equal(ymin, LAT[0]), pc.less_equal(ymin, LAT[1]))))
    for i in range(t.num_rows):
        sources = {s.get('dataset') for s in (t.column('sources')[i].as_py() or []) if s}
        if 'OpenStreetMap' in sources:
            continue  # OSM binası region-streets.json'da
        g = wkb.loads(t.column('geometry')[i].as_py())
        for p in ([g] if g.geom_type == 'Polygon' else list(getattr(g, 'geoms', []))):
            ring = []
            for x, y in list(p.exterior.coords)[:-1]:
                px, py = round((x - CLON) * M_LON, 1), round(-(y - CLAT) * M_LAT, 1)
                ring += [px, py]
            if len(ring) >= 6 and min(math.hypot(ring[k], ring[k + 1]) for k in range(0, len(ring), 2)) <= RADIUS:
                buildings.append(ring)

out = {'source': f'Overture Maps {RELEASE} buildings - Microsoft ML Building Footprints (OSM dışı), ODbL',
       'fetched': datetime.datetime.now(datetime.timezone.utc).strftime('%Y-%m-%dT%H:%MZ'), 'buildings': buildings}
path = os.path.join(ROOT, 'viewer', 'src', 'region-buildings-ml.json')
json.dump(out, open(path, 'w'), separators=(',', ':'))
print(len(buildings), 'bina ->', path, os.path.getsize(path), 'B')
