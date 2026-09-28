import bpy,json
from pathlib import Path
from mathutils import Vector
W=Path(r'C:\Users\yigit\angora-tur10')
r={'oda107':[],'merdiven_basamaklari':[]}
for o in bpy.data.objects:
 if o.type!='MESH':continue
 mats=[m.name if m else '' for m in o.data.materials]
 # Oda içindeki bağımsız yüzey adalarını yalnız oku.
 if 'interior-common' in o.data.name:
  vs=o.data.vertices; parent=list(range(len(vs)))
  def root(i):
   while parent[i]!=i:parent[i]=parent[parent[i]];i=parent[i]
   return i
  for e in o.data.edges:
   a,b=map(root,e.vertices)
   if a!=b:parent[a]=b
  groups={}
  for v in vs:groups.setdefault(root(v.index),[]).append(o.matrix_world@v.co)
  for pts in groups.values():
   lo=[min(p[i] for p in pts) for i in range(3)];hi=[max(p[i] for p in pts) for i in range(3)]
   if lo[0]>=-2.1 and hi[0]<=1.25 and lo[1]>=-5.1 and hi[1]<=-1.4 and lo[2]>=6.2 and hi[2]<=9.5:
    r['oda107'].append({'obj':o.name,'malzemeler':mats,'min':[round(x,4) for x in lo],'max':[round(x,4) for x in hi],'vertices':len(pts)})
 for p in o.data.polygons:
  mat=mats[p.material_index] if p.material_index<len(mats) else ''
  if mat!='Simple wood':continue
  pts=[o.matrix_world@o.data.vertices[i].co for i in p.vertices];c=sum(pts,Vector())/len(pts)
  if -1.2<c.x<4.3 and -1.7<c.y<3.8 and 6.2<c.z<10 and abs(p.normal.z)>.9:
   r['merdiven_basamaklari'].append({'merkez':[round(x,3) for x in c],'min':[round(min(q[i] for q in pts),3) for i in range(3)],'max':[round(max(q[i] for q in pts),3) for i in range(3)]})
(W/'geometri-olcum.json').write_text(json.dumps(r,ensure_ascii=False,indent=1),encoding='utf-8')
print('Oda parça:',len(r['oda107']),'Basamak yüzü:',len(r['merdiven_basamaklari']))

