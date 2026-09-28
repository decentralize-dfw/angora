"""Fotoğraf dokuları: yüz merkezi kutularıyla seçme + metre ölçekli UV.
Render ve GLB dışa aktarımı aynı fonksiyonu kullanır. Işıklara dokunmaz.
"""
import bpy,json,re,math
from pathlib import Path

def uygula(objects,spec_path):
 spec_path=Path(spec_path);records=json.loads(spec_path.read_text(encoding='utf-8'))
 root=spec_path.parent/'malzeme-dokulari';cache={};total=0
 def match(name,rec):
  return name in rec['malzemeler'] or re.sub(r'\.\d{3}$','',name) in rec['malzemeler']
 def material(rec,original):
  key=(rec['no'],original)
  if key in cache:return cache[key]
  name=f'FOTO_{rec["no"]:02}_{original}'
  mat=bpy.data.materials.get(name) or bpy.data.materials.new(name);mat.use_nodes=True
  mat['angora_original']=original;mat['angora_doku_no']=rec['no']
  nt=mat.node_tree;nt.nodes.clear();bs=nt.nodes.new('ShaderNodeBsdfPrincipled');out=nt.nodes.new('ShaderNodeOutputMaterial');nt.links.new(bs.outputs[0],out.inputs[0])
  bs.inputs['Roughness'].default_value=rec.get('purluluk',.5)
  bs.inputs['Metallic'].default_value=.85 if rec['no']==14 else 0.
  if rec.get('mirror'):
   bs.inputs['Metallic'].default_value=1;bs.inputs['Base Color'].default_value=(.92,.92,.92,1);bs.inputs['Roughness'].default_value=.025;cache[key]=mat;return mat
  bs.inputs['Coat Weight'].default_value=rec.get('clearcoat') or 0.
  if rec['no'] in [9,13]:
   bs.inputs['Specular IOR Level'].default_value=.20
   bs.inputs['Coat Weight'].default_value=.01
  def tex(fname,color):
   path=root/rec['klasor']/fname
   if path.with_suffix('.png').exists():path=path.with_suffix('.png')
   if not path.exists():return None
   node=nt.nodes.new('ShaderNodeTexImage');node.image=bpy.data.images.load(str(path),check_existing=True);node.image.colorspace_settings.name='sRGB' if color else 'Non-Color';return node
  albedo=tex('albedo.jpg',True)
  if albedo:nt.links.new(albedo.outputs['Color'],bs.inputs['Base Color'])
  rough=tex('roughness.jpg',False)
  if rough:nt.links.new(rough.outputs['Color'],bs.inputs['Roughness'])
  strength=rec.get('normal_siddeti',.05)
  if strength:
   normal=tex('normal.jpg',False)
   if normal:
    nm=nt.nodes.new('ShaderNodeNormalMap');nm.space='WORLD' if rec['no'] in [3,19] else 'TANGENT';nm.inputs['Strength'].default_value=strength;nt.links.new(normal.outputs['Color'],nm.inputs['Color']);nt.links.new(nm.outputs['Normal'],bs.inputs['Normal'])
  cache[key]=mat;return mat
 for ob in objects:
  if ob.type!='MESH':continue
  me=ob.data
  if ob.name.startswith('wood_floor') and not ob.get('adim07_floor'):
   # Imported sub-millimetre floor steps and split normals share the visible diagonal.
   import bmesh
   mw0=ob.matrix_world;inv=mw0.inverted()
   for v in me.vertices:
    w=mw0@v.co
    for z in [3.0996,6.3714,9.4705]:
     if abs(w.z-z)<.003:w.z=z;v.co=inv@w;break
   bm=bmesh.new();bm.from_mesh(me);bmesh.ops.remove_doubles(bm,verts=list(bm.verts),dist=.0015);bmesh.ops.recalc_face_normals(bm,faces=list(bm.faces));bm.to_mesh(me);bm.free()
   if me.has_custom_normals:me.normals_split_custom_set([(0,0,0)]*len(me.loops))
   for face in me.polygons:face.use_smooth=False
   ob['adim07_floor']=True
  originals=[m.get('angora_original',re.sub(r'^FOTO_\d+_','',m.name)) if m else '' for m in me.materials]
  candidates={i:[r for r in records if match(n,r)] for i,n in enumerate(originals)}
  if not any(candidates.values()):continue
  mw=ob.matrix_world;coords=[mw@v.co for v in me.vertices];slots={};changed=[]
  for p in me.polygons:
   source=p.material_index;cand=candidates.get(source,[])
   if not cand:continue
   c=mw@p.center
   bounded=[r for r in cand if r.get('kutular') and any(all(b['min'][i]<=c[i]<=b['max'][i] for i in range(3)) for b in r['kutular'])]
   plain=[r for r in cand if 'kutular' not in r]
   rec=(bounded or plain or [None])[0]
   if rec is None:continue
   key=(rec['no'],originals[source])
   if key not in slots:
    mat=material(rec,originals[source]);idx=next((i for i,m in enumerate(me.materials) if m==mat),None)
    if idx is None:idx=len(me.materials);me.materials.append(mat)
    slots[key]=idx
   p.material_index=slots[key];changed.append((p,rec));total+=1
  if not changed:continue
  uv=me.uv_layers.get('UVMap') or me.uv_layers.new(name='UVMap');me.uv_layers.active=uv;uv.active_render=True
  for p,rec in changed:
   pts=[coords[v] for v in p.vertices];n=(pts[1]-pts[0]).cross(pts[2]-pts[0]);axis=max(range(3),key=lambda i:abs(n[i]))
   axes=(0,1) if axis==2 else ((0,2) if axis==1 else (1,2))
   if rec['no'] in [3,19] and axis==2:axes=(1,0)
   if rec.get('ahsap_tek_parca') and rec['no']==10:axes=(1,0) if axis==2 else ((1,2) if axis==0 else (0,2))
   if rec.get('ahsap_uzun_kenar'):
    spans=[max(pt[i] for pt in pts)-min(pt[i] for pt in pts) for i in axes]
    if spans[1]>spans[0]:axes=(axes[1],axes[0])
   sx,sy=rec.get('doku_olcusu_xy_m',[rec.get('doku_olcusu_m',1)]*2)
   if rec['no']==27 and axis!=2:sy=2.4
   for li,pt in zip(p.loop_indices,pts):
    if rec.get('ahsap_tek_parca') and rec['no']==10:
     lo=[min(v[i] for v in coords) for i in axes];hi=[max(v[i] for v in coords) for i in axes]
     uv.data[li].uv=(.01+.98*(pt[axes[0]]-lo[0])/max(hi[0]-lo[0],.001),.01+.98*(pt[axes[1]]-lo[1])/max(hi[1]-lo[1],.001))
    else:
     u,v=pt[axes[0]]/sx,pt[axes[1]]/sy
     angle=math.radians(45 if rec['no']==27 and axis==2 else rec.get('uv_aci',0))
     uv.data[li].uv=(u*math.cos(angle)-v*math.sin(angle),u*math.sin(angle)+v*math.cos(angle))
 print('[foto-doku]',len(cache),'malzeme',total,'yüz',flush=True)
