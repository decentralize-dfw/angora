import sys,math,json,bmesh
from pathlib import Path
sys.path.insert(0,str(Path(__file__).parent))
import ortak as o
import bpy
from mathutils import Vector
o.basla('A05_');assert len(o.C.objects)>2000,'Önceki model eksik, kaydetme'
for ob in list(o.C.objects):
 if ob.name.startswith('A04_F42_') or ob.name.startswith('A04_F29_orta_spot'):bpy.data.objects.remove(ob,do_unlink=True)
white=o.malzeme('A05_F42_opal_beyaz',(.82,.80,.75),.45)
p=white.node_tree.nodes.get('Principled BSDF');p.inputs['Emission Color'].default_value=(1,.88,.70,1);p.inputs['Emission Strength'].default_value=.12
# Foto42: duvarda, aynı kotta ve yaklaşık 25cm aralıklı üç yuvarlak sıva üstü opal.
for k,y in enumerate([.18,-.07,-.32]):
 vs=[];fs=[];N=32;profile=[(0,0),(.067,0),(.064,.025),(.05,.048),(.025,.063),(0,.066)]
 for r,depth in profile:
  for j in range(N):vs.append((2.942-depth,y+r*math.cos(j*2*math.pi/N),5.55+r*math.sin(j*2*math.pi/N)))
 for a in range(len(profile)-1):
  for j in range(N):fs.append((a*N+j,a*N+(j+1)%N,(a+1)*N+(j+1)%N,(a+1)*N+j))
 ob=o.mesh(f'A05_F42_yuvarlak_{k+1}',vs,fs,white)
 for f in ob.data.polygons:f.use_smooth=True
for ob in o.C.objects:
 if ob.name.startswith('M6_Antre') and ob.get('adim04_tasindi'):
  ob.location.y-=.30;ob['adim04_tasindi']=False
boxes=json.loads((o.W/'silme-kutulari.json').read_text(encoding='utf-8'));boxes=[b for b in boxes if not b['ad'].startswith('A05_')]
for b in boxes:
 if b['ad']=='M2_INTERIOR_eski_beyaz_merdiven':
  b['max_face_span']=[1.10,1.25,.22];b['normal_axes']=[0,2];b['not']='Adım05: yalnız küçük basamak/rıht yüzleri; büyük duvar/tavan ve Y-normal yan yüzler korunur.'
boxes.append({'ad':'A05_mutfak_tavan_spotlari','katman':'mobilya','min':[-4.5,-3.3,5.5],'max':[-2.8,-.5,5.91],'not':'Foto21 mutfakta olmayan küçük tavan spotları; dolaplar aşağıda korunur.'})
(o.W/'silme-kutulari.json').write_text(json.dumps(boxes,ensure_ascii=False,indent=1),encoding='utf-8')
# Kartonpiyerde aynı noktadaki ayrı uçları tek ağda birleştir; ortak uç kapaklarını kaldır.
obs=[ob for ob in o.C.objects if ob.name.startswith('M1_kartonpiyer')]
if obs:
 vs=[];fs=[];ends=[]
 for ob in obs:
  me=ob.data;k=len(me.vertices)//2
  ends += [(ob,0,ob.matrix_world@me.vertices[0].co),(ob,1,ob.matrix_world@me.vertices[k].co)]
 for ob in obs:
  me=ob.data;off=len(vs);vs.extend([tuple(ob.matrix_world@v.co) for v in me.vertices])
  for f in me.polygons:
   if f.index in [0,1]:
    point=next(p for oo,side,p in ends if oo==ob and side==f.index)
    if any(oo!=ob and (p-point).length<.02 for oo,side,p in ends):continue
   fs.append(tuple(off+i for i in f.vertices))
 mat=o.malzeme('M1_Beyaz_saten_alci',(.82,.79,.72),.73)
 merged=o.mesh('A05_kartonpiyer_birlesik',vs,fs,mat)
 bm=bmesh.new();bm.from_mesh(merged.data);bmesh.ops.remove_doubles(bm,verts=list(bm.verts),dist=.0015);bmesh.ops.recalc_face_normals(bm,faces=list(bm.faces));bm.to_mesh(merged.data);bm.free()
 for ob in obs:bpy.data.objects.remove(ob,do_unlink=True)
o.bitir('A05',{'fotolar':[18,29,34,40,42,21,47],'normal_gucu':.15,'not':'Büyük mimari yüzleri silme maskesinden koru; yuvarlak duvar lambaları; fotoğraf tahta atlası.'})
