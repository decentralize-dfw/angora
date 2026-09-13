"""Derive web section geometry from the current Blender export."""
import sys,json,ast,time,os
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
sys.path.insert(0,str(ROOT/'.runtime/python'))
import numpy as np
import mapbox_earcut
from shapely.geometry import LineString,Polygon,Point,MultiLineString
from shapely.ops import unary_union,snap,polygonize,linemerge
SOURCE=Path(sys.argv[1])if len(sys.argv)>1 else (ROOT/'build/web/native-current'if (ROOT/'build/web/native-current').exists()else ROOT.parent/'angora-review/build/web/native-current')
TRIS=np.load(SOURCE/'caps-wall.npy');MIN=TRIS[:,:,2].min(1);MAX=TRIS[:,:,2].max(1)
# Reuse the existing geometric wall-section algorithm, including its void checks.
tree=ast.parse((ROOT/'tools/build_section_atlas.py').read_text(encoding='utf-8'))
fn=next(n for n in tree.body if isinstance(n,ast.FunctionDef) and n.name=='section')
# Collapse collinear CAD triangle subdivisions before the pairwise thickness
# search. They carry no additional shape but multiply the candidate matrix.
def compact_edges(segments):
    network=unary_union(segments)
    merged=linemerge(network)if network.geom_type=='MultiLineString'else network
    lines=[merged]if merged.geom_type=='LineString'else list(merged.geoms)
    result=[]
    for line in lines:
        points=np.array(line.simplify(.001,preserve_topology=True).coords)
        for a,b in zip(points,points[1:]):
            length=np.linalg.norm(b-a)
            if length>.004:result.append((a,b,(b-a)/length,length))
    return result
for index,node in enumerate(fn.body):
    if isinstance(node,ast.Assign) and any(isinstance(t,ast.Name)and t.id=='candidates'for t in node.targets):
        fn.body.insert(index,ast.parse('edges=compact_edges(segments)').body[0]);break
ast.fix_missing_locations(fn)
for node in ast.walk(fn):
    if isinstance(node,ast.If) and isinstance(node.test,ast.Call) and isinstance(node.test.func,ast.Name) and node.test.func.id=='len':
        for index,child in enumerate(node.body):
            if isinstance(child,ast.Assign)and any(isinstance(t,ast.Name)and t.id=='ids'for t in child.targets):
                replacement=ast.parse('''ta=np.sum(delta*u[:,None,:],axis=2)
tb=ta+(u@u.T)*lengths[None,:]
overlap=np.minimum(lengths[:,None],np.maximum(ta,tb))-np.maximum(0,np.minimum(ta,tb))
ids=np.argwhere(np.triu(parallel&(normal_distance>.034)&(normal_distance<.502)&(overlap>.004),1))''').body
                node.body[index:index+1]=replacement;break
ast.fix_missing_locations(fn)
exec(compile(ast.Module(body=[fn],type_ignores=[]),'native-wall-section','exec'))
base=json.loads((ROOT/'build/web/full/sections.json').read_text())
body={}
for key in ('fixed','furniture'):
    t=np.load(SOURCE/('caps-'+key+'.npy'));body[key]=(t,t[:,:,2].min(1),t[:,:,2].max(1))

def body_section(kind,height):
    t,lo,hi=body[kind];active=t[(lo<height)&(hi>height)].astype(np.float64)
    if not len(active):return [],[]
    segments=[]
    # Vectorized edge interpolation leaves GEOS only the actual cut segments.
    endpoints=np.zeros((len(active),2,2));counts=np.zeros(len(active),dtype=np.int8)
    for i,j in ((0,1),(1,2),(2,0)):
        a,b=active[:,i],active[:,j];valid=(a[:,2]<height)!=(b[:,2]<height);ids=np.flatnonzero(valid)
        p=a[ids]+(b[ids]-a[ids])*((height-a[ids,2])/(b[ids,2]-a[ids,2]))[:,None]
        endpoints[ids,counts[ids],:]=p[:,:2];counts[ids]+=1
    for pair in endpoints[counts==2]:
        if np.linalg.norm(pair[0]-pair[1])>1e-7:segments.append(LineString(np.round(pair,5)))
    if not segments:return [],[]
    parts=[p for p in polygonize(unary_union(segments))if p.area>=.001]
    if not parts:return [],[]
    merged=unary_union(parts).simplify(.003,preserve_topology=True)
    polygons=[merged]if merged.geom_type=='Polygon'else list(merged.geoms)
    positions=[];indices=[]
    for poly in polygons:
        if poly.geom_type!='Polygon' or poly.area<.004:continue
        rings=[poly.exterior]+list(poly.interiors)
        xy=np.array([p for ring in rings for p in list(ring.coords)[:-1]],dtype=np.float64)
        ends=np.cumsum([len(ring.coords)-1 for ring in rings],dtype=np.uint32)
        faces=mapbox_earcut.triangulate_float64(xy,ends);offset=len(positions)//2
        positions.extend(round(float(v),5)for x,y in xy for v in (x,-y));indices.extend(offset+int(i)for i in faces)
    return positions,indices

slices=[]
for n,old in enumerate(base['slices']):
    if not int(os.environ.get('ANGORA_SECTION_START','0'))<=n<int(os.environ.get('ANGORA_SECTION_END',str(len(base['slices'])))):continue
    checkpoint=SOURCE/('section-slice-'+str(n)+'.json')
    if checkpoint.exists():
        record=json.loads(checkpoint.read_text())
        if os.environ.get('ANGORA_SECTION_REFRESH_FIXED')=='1':
            record['q'],record['j']=body_section('fixed',old['height'])
            checkpoint.write_text(json.dumps(record),encoding='utf-8')
        slices.append(record);continue
    h=old['height'];start=time.monotonic();record=section(h)
    if n>=128:print('WALL',n,h,round(time.monotonic()-start,2),flush=True)
    record['q'],record['j']=body_section('fixed',h)
    record['fq'],record['fj']=body_section('furniture',h)
    slices.append(record)
    temporary=checkpoint.with_suffix('.'+str(os.getpid())+'.tmp')
    temporary.write_text(json.dumps(record),encoding='utf-8');temporary.replace(checkpoint)
    if n%16==0:print('SECTIONS',n,len(base['slices']),flush=True)
if len(slices)!=len(base['slices']):
    print('SECTION RANGE COMPLETE',len(slices),flush=True);sys.exit(0)
base.update(slices=slices,revision='native-open-doors-roads',source_native_sha256=json.loads((SOURCE/'level-1.json').read_text())['source_native_sha256'],method='Current native evaluated wall faces and closed object cross sections')
(SOURCE/'sections.json').write_text(json.dumps(base,separators=(',',':')),encoding='utf-8')
print('NATIVE SECTIONS COMPLETE',len(slices),flush=True)
