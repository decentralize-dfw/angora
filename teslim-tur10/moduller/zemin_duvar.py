"""M1. Ölçülmüş döşeme/tavan sınırları, duvar ışın doğrulaması ve profil süpürme.
Foto 4,17,19,21: 10 cm ahşap süpürgelik, 12 cm beyaz klasik kartonpiyer.
"""
import sys, math, json
from pathlib import Path
sys.path.insert(0,str(Path(__file__).parent))
import ortak as o
import bpy
from mathutils import Vector
from mathutils.bvhtree import BVHTree
o.basla('M1_')
white=o.malzeme('M1_Beyaz_saten_alci',(.82,.79,.72),.73)
wood=o.malzeme('M1_Sicak_ceviz_supurgelik',(.115,.045,.018),.38)
# Yalnız mimari duvarlar; mobilya ışınlara karışmaz.
verts=[];faces=[]
for ob in bpy.data.collections['REFERANS'].all_objects:
 if ob.type!='MESH':continue
 for p in ob.data.polygons:
  m=ob.data.materials[p.material_index]
  if not m or m.name not in ['Simple White Wall','Stucco painted wall']:continue
  ids=[]
  for vi in p.vertices:ids.append(len(verts));verts.append(ob.matrix_world@ob.data.vertices[vi].co)
  faces.append(ids)
bvh=BVHTree.FromPolygons(verts,faces,all_triangles=False)
def yatay_bvh(matname,z):
 vs=[];fs=[]
 for ob in bpy.data.collections['REFERANS'].all_objects:
  if ob.type!='MESH':continue
  for p in ob.data.polygons:
   mat=ob.data.materials[p.material_index]
   if not mat or mat.name!=matname:continue
   pts=[ob.matrix_world@ob.data.vertices[i].co for i in p.vertices]
   if max(abs(v.z-z) for v in pts)>.008:continue
   fs.append(list(range(len(vs),len(vs)+len(pts))));vs.extend(pts)
 return BVHTree.FromPolygons(vs,fs,all_triangles=False)
data=json.loads((o.W/'mimari-olcum.json').read_text(encoding='utf-8'))
def duvar_kesit(z):
 from collections import defaultdict
 lines=defaultdict(list)
 for face in faces:
  pts=[verts[i] for i in face];hits=[]
  for a,b in zip(pts,pts[1:]+pts[:1]):
   if (a.z-z)*(b.z-z)<0:
    p=a+(b-a)*((z-a.z)/(b.z-a.z));hits.append(p)
  if len(hits)!=2 or (hits[1]-hits[0]).length<.01:continue
  a,b=hits;t=(b-a).normalized()
  if t.x<-.001 or (abs(t.x)<.001 and t.y<0):t=-t
  n=Vector((-t.y,t.x,0));key=(round(t.x,3),round(t.y,3),round(a.dot(n),3))
  lines[key].append(sorted([a.dot(t),b.dot(t)]))
 result=[]
 for (tx,ty,d),spans in lines.items():
  t=Vector((tx,ty,0)).normalized();n=Vector((-t.y,t.x,0));merged=[]
  for a,b in sorted(spans):
   if merged and a<=merged[-1][1]+.012:merged[-1][1]=max(merged[-1][1],b)
   else:merged.append([a,b])
  for a,b in merged:
   pa=n*d+t*a;pb=n*d+t*b
   result.append([[pa.x,pa.y],[pb.x,pb.y]])
 return result
# Profil koordinatları: duvardan içeri mesafe, zeminden/tavandan düşey uzaklık.
sk=[(0,0),(.016,0),(.016,.080),(.014,.086),(.018,.090),(.018,.096),(.011,.103),(0,.103)]
cr=[(0,0),(.112,0),(.112,.009),(.099,.015),(.099,.024),(.086,.026),(.080,.032),(.076,.041),(.066,.049),(.052,.055),(.041,.062),(.035,.074),(.032,.087),(.026,.093),(.026,.101),(.034,.106),(.034,.113),(.019,.117),(0,.117)]
stats={'supurgelik':0,'kartonpiyer':0,'duvar_yok':0};seen=set()
for d in data['doseme_sinirlari']:
 crown=d['mat']=='ceiling.001' and d['z'] in [2.62,5.89,8.99]
 floor=d['mat'] in ['WOOD-FL','terra_floor'] and d['z'] in [0,3.1,6.37,9.47]
 if not(crown or floor):continue
 z=d['z'];profile=cr if crown else sk
 plane=yatay_bvh(d['mat'],z)
 for aa,bb in duvar_kesit(z+(-.17 if crown else .20)):
  a=Vector((*aa,z));b=Vector((*bb,z));delta=b-a;length=delta.length
  if length<.15:continue
  t=delta.normalized();n=Vector((-t.y,t.x,0));mid=(a+b)/2
  sides=[]
  for sign in [-1,1]:
   q=mid+n*sign*.075+Vector((0,0,.035))
   h,_,_,_=plane.ray_cast(q,Vector((0,0,-1)),.07)
   if h is not None:sides.append(sign)
  if len(sides)!=1:continue
  interior=n*sides[0]
  # Sınır her zaman duvar değildir: kapı eşiği ve döşeme derzine profil üretme.
  probe=mid+Vector((0,0,-.18 if crown else .20));hits=[]
  for sign in [-1,1]:
   hit,normal,idx,dist=bvh.ray_cast(probe+n*sign*.22,-n*sign,.44)
   if hit is not None and abs(normal.z)<.2 and abs((hit-probe).dot(n))<.17:
    hits.append((abs((hit-probe).dot(n)),hit,n*sign))
  if not hits:stats['duvar_yok']+=1;continue
  _,hit,_=min(hits,key=lambda h:h[0]);inside=interior
  offset=(hit-probe).dot(n);a+=n*offset;b+=n*offset
  key=(tuple(round(x,2) for x in a),tuple(round(x,2) for x in b),crown)
  if key in seen:continue
  seen.add(key);vs=[]
  for end in [a,b]:
   for depth,height in profile:vs.append(tuple(end+inside*(depth+.001)+Vector((0,0,-height if crown else height))))
  k=len(profile);fs=[tuple(reversed(range(k))),tuple(range(k,2*k))]
  fs +=[(j,(j+1)%k,(j+1)%k+k,j+k) for j in range(k)]
  typ='kartonpiyer' if crown else 'supurgelik';stats[typ]+=1
  ob=o.mesh(f'M1_{typ}_{stats[typ]:03}',vs,fs,white if crown else wood)
  ob['kaynak_z']=z;ob['duvar_dogrulandi']=True
o.bitir('M1',stats)
