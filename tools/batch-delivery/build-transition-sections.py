import ast,json,sys,time,gzip
from pathlib import Path
import numpy as np
ROOT=Path(__file__).resolve().parents[2]
sys.path.insert(0,str(ROOT.parent/'model-finalization/python-deps'))
import mapbox_earcut
from shapely.geometry import LineString,Polygon,Point
from shapely.ops import unary_union,snap,linemerge
data=json.loads((ROOT.parent/'model-finalization/transition-wall-triangles.json').read_text())
TRIS=np.asarray(data['triangles']);MIN=TRIS[:,:,2].min(1);MAX=TRIS[:,:,2].max(1)
tree=ast.parse((ROOT/'tools/build_section_atlas.py').read_text());fn=next(n for n in tree.body if isinstance(n,ast.FunctionDef) and n.name=='section')
def compact_edges(segments):
 net=unary_union(segments);net=linemerge(net) if net.geom_type=='MultiLineString' else net
 lines=[net] if net.geom_type=='LineString' else list(net.geoms);out=[]
 for line in lines:
  pts=np.array(line.simplify(.001).coords)
  for a,b in zip(pts,pts[1:]):
   length=np.linalg.norm(b-a)
   if length>.004:out.append((a,b,(b-a)/length,length))
 return out
for i,n in enumerate(fn.body):
 if isinstance(n,ast.Assign) and any(isinstance(t,ast.Name) and t.id=='candidates' for t in n.targets):fn.body.insert(i,ast.parse('edges=compact_edges(segments)').body[0]);break
ast.fix_missing_locations(fn);exec(compile(ast.Module(body=[fn],type_ignores=[]),'section','exec'))
slices=[];start=time.monotonic()
for h in np.arange(0,16.49,.08):
 h=round(float(h),4);slices.append(section(h))
 if len(slices)%25==0:print(len(slices),round(time.monotonic()-start,1),flush=True)
dest=ROOT/'build/web/native-current/transition-sections.json.gz'
dest.write_bytes(gzip.compress(json.dumps({'coordinate_system':'glTF_XZ','step':.08,'source_objects':data['objects'],'slices':slices},separators=(',',':')).encode(),mtime=0))
print('DONE',dest.stat().st_size,flush=True)
