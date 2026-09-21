import json,sys,gzip
from pathlib import Path
ROOT=Path(__file__).resolve().parents[2];sys.path.insert(0,str(ROOT/'.runtime/finishing/deps'))
import numpy as np,mapbox_earcut
from shapely.geometry import Polygon,box
from shapely.ops import unary_union
file=ROOT/'build/web/native-current/transition-sections.json.gz';data=json.loads(gzip.decompress(file.read_bytes()))
for s in data['slices']:
 if not s['i']:continue
 p=np.array(s['p']).reshape(-1,2);g=unary_union([Polygon(p[t]) for t in np.array(s['i']).reshape(-1,3)]).buffer(.018,join_style=2).buffer(-.018,join_style=2)
 if .08<s['height']<2.62:g=g.difference(box(-5.722,-6.81,-5.14,-3.43))
 pts=[];idx=[]
 for poly in [g] if g.geom_type=='Polygon' else g.geoms:
  if poly.geom_type!='Polygon' or poly.area<1e-8:continue
  rings=[poly.exterior,*poly.interiors];xy=np.array([v for r in rings for v in list(r.coords)[:-1]],dtype=np.float64);ends=np.cumsum([len(r.coords)-1 for r in rings],dtype=np.uint32);faces=mapbox_earcut.triangulate_float64(xy,ends);offset=len(pts)//2;pts.extend(xy.ravel().tolist());idx.extend((faces+offset).tolist())
 s['p']=pts;s['i']=idx
data['finishing']='18mm corner closure and owner-confirmed basement storage void'
file.write_bytes(gzip.compress(json.dumps(data,separators=(',',':')).encode(),mtime=0));print('MOVING_SECTIONS',len(data['slices']),file.stat().st_size)
