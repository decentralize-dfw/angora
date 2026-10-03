"""Encode deterministic native viewer samples; never upscale a browser recording."""
import hashlib
import json
import subprocess
from shapely.geometry import Polygon
from shapely.ops import unary_union
from pathlib import Path

repo=Path(__file__).resolve().parents[1]
root=repo/'assets/residence/chapters'
raw=repo/'build/presentation-capture'
poses=json.loads((root/'poses.json').read_text(encoding='utf-8'))
assert (poses['width'],poses['height'])==(2560,1440), 'Capture the actual 1440p viewer first'
def run(*args):
    subprocess.run(['ffmpeg','-hide_banner','-loglevel','error','-y',*map(str,args)],check=True)
for level in range(1,4):
    for suffix,filter_ in [('', 'null'),('-reverse','reverse')]:
        run('-framerate',30,'-i',raw/f'move-{level}-%03d.jpg','-vf',filter_,
            '-c:v','libx264','-preset','medium','-crf',15,'-pix_fmt','yuv420p',
            '-movflags','+faststart',root/f'level-{level}{suffix}.mp4')
for kind in ['iso','plan']:
    for floor in range(4):
        run('-i',root/f'{kind}-{floor}.png','-quality',95,root/f'{kind}-{floor}.webp')
# Section positions are indexed triangles, not a polygonal walk. Union the
# triangles and retain only their true boundaries; internal diagonals disappear.
atlas=json.loads((repo/'build/web/native-current/sections-current.json').read_text(encoding='utf-8'))
for floor,section in zip(poses['floors'],atlas['slices']):
    if 'contours' in floor:continue
    vertices=floor['contour'];indices=section['i'];triangles=[]
    for i in range(0,len(indices),3):
        polygon=Polygon([vertices[j] for j in indices[i:i+3]])
        if polygon.is_valid and polygon.area>1e-12:triangles.append(polygon)
    merged=unary_union(triangles)
    parts=list(merged.geoms) if hasattr(merged,'geoms') else [merged]
    parts=sorted([p for p in parts if p.geom_type=='Polygon'],key=lambda p:p.area,reverse=True)
    floor['contours']=[list(p.exterior.coords)[:-1] for p in parts]+[list(r.coords)[:-1] for p in parts for r in p.interiors]
    floor['contour']=floor['contours'][0]
(root/'poses.json').write_text(json.dumps(poses),encoding='utf-8')
crops=[]
for floor in poses['floors']:
    points=[p for room in floor['rooms'] for p in room['screen']]+[p for loop in floor['contours'] for p in loop];xs=[p[0] for p in points];ys=[p[1] for p in points]
    crops.append(dict(x=min(xs)-.025,y=min(ys)-.025,width=max(xs)-min(xs)+.05,height=max(ys)-min(ys)+.05))
manifest=dict(width=2560,height=1440,fps=30,duration=43/30,
    revision=hashlib.sha256((root/'poses.json').read_bytes()).hexdigest()[:12],
    source='Actual Tur 10 viewer. Deterministic native camera flight and section cuts, rendered at 2560 x 1440.',
    crops=crops,isometric={'clips':[f'level-{i}.mp4' for i in range(1,4)]})
(root/'native-manifest.json').write_text(json.dumps(manifest,indent=2),encoding='utf-8')
print('Prepared six native 1440p transition films and eight actual model stills.')
