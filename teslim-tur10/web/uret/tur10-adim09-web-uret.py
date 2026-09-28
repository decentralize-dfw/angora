import bpy,bmesh,json,math,hashlib,re,sys,numpy as np
from pathlib import Path
from mathutils import Vector
W=Path(r'C:\Users\yigit\angora-tur10');R=Path(r'C:\Users\yigit\Downloads\angora-main (2)\angora-main');D=Path(r'C:\Users\yigit\angora-git\teslim-tur10/web');D.mkdir(exist_ok=True);C=W/'adim09/web-calisma';TX=C/'dokular2048';TX.mkdir(exist_ok=True)
bpy.ops.wm.open_mainfile(filepath=str(W/'adim09/kontrol-sahne.blend'));scene=bpy.context.scene
src=json.loads((C/'kaynak-bounds.json').read_text(encoding='utf-8'));report={'kaynak_birim':'metre','koordinat_sistemi':'GLB Y-up; denetim Blender Z-up','tolerans_m':.001,'kaynak_kontrol':[],'katlara_ayirma':[],'doku_donusum':[],'notlar':[]}
def bbox(ob):
 a=np.empty(len(ob.data.vertices)*3,dtype=np.float32);ob.data.vertices.foreach_get('co',a);a=a.reshape(-1,3);m=np.array(ob.matrix_world);a=a@m[:3,:3].T+m[:3,3]
 return [a.min(0).tolist(),a.max(0).tolist()] if len(a) else None
meshes=[o for o in scene.objects if o.type=='MESH'];roles={}
for ob in meshes:
 role=ob.get('angora_role','EKLER');roles[ob.name]=role;key=role+'|'+ob.name;ob['kaynak_nesne']=ob.name;ob['kaynak_grup']=role
 if key in src:
  old=src[key];bb=bbox(ob);delta=float(np.max(np.abs(np.array(bb)-np.array(old['bbox'])))) if bb else 0
  changed=len(ob.data.vertices)!=old['v'] or len(ob.data.polygons)!=old['f'];report['kaynak_kontrol'].append(dict(ad=ob.name,grup=role,kaynak_bbox=old['bbox'],son_bbox=bb,geometri_degisti=changed,sinir_farki_m=delta,dokunulmayan_gecerli=changed or delta<=.001))
  ob['mesh_adi_orijinal']=old['mesh']
 else:ob['mesh_adi_orijinal']='EK_'+ob.data.name
# Light geometry stays; actual lights are recorded separately and never selected for export.
lights=[]
for ob in scene.objects:
 if ob.type!='LIGHT':continue
 l=ob.data;xyz=list(ob.matrix_world.translation);lights.append(dict(ad=ob.name,tur=l.type,konum=[xyz[0],xyz[2],-xyz[1]],konum_blender=xyz,guc=float(l.energy),guc_birimi='W' if l.type!='SUN' else 'W/m2',renk=list(l.color),armatür_adi=ob.name,matris_blender=[list(r) for r in ob.matrix_world],boyut=float(getattr(l,'size',0)),boyut_y=float(getattr(l,'size_y',0)),sekil=getattr(l,'shape',None)))
(D/'isiklar-v2.json').write_text(json.dumps({'koordinat':'glTF Y-up, metre','isiklar':lights,'gok':{'tur':'NISHITA','strength':.65},'not':'Kontrol sahnesindeki efektif ışık güçleri; GLB ışık nesnesi içermez.'},ensure_ascii=False,indent=1),encoding='utf-8')
# Cache 2048px images, preserving aspect ratio and channel/color interpretation.
cache={};usedmats=set(m for ob in meshes for m in ob.data.materials if m)
def convert_image(image,kind,swap=False):
 key=(image.as_pointer(),kind,swap)
 if key in cache:return cache[key]
 tag=hashlib.sha256((image.name+'|'+image.filepath+'|'+kind+str(swap)).encode()).hexdigest()[:14];p=TX/(tag+('.jpg' if kind=='albedo' else '.png'))
 w,h=image.size;buf=np.empty(w*h*4,np.float32);image.pixels.foreach_get(buf);q=bpy.data.images.new('WEB_'+tag,width=w,height=h,alpha=True,float_buffer=True);q.colorspace_settings.name=image.colorspace_settings.name;q.pixels.foreach_set(buf);del buf
 if not w or not h:raise RuntimeError('Boş doku '+image.name)
 q.scale(max(1,round(w*2048/max(w,h))),max(1,round(h*2048/max(w,h))))
 if swap:
  a=np.empty(q.size[0]*q.size[1]*4,np.float32);q.pixels.foreach_get(a);a=a.reshape(-1,4);a[:,[0,1]]=a[:,[1,0]];q.pixels.foreach_set(a.ravel())
 q.filepath_raw=str(p);q.file_format='JPEG' if kind=='albedo' else 'PNG';q.colorspace_settings.name='sRGB' if kind=='albedo' else 'Non-Color';q.save();bpy.data.images.remove(q);q=bpy.data.images.load(str(p),check_existing=False);q.colorspace_settings.name='sRGB' if kind=='albedo' else 'Non-Color';cache[key]=q;report['doku_donusum'].append(dict(kaynak=image.name,dosya=p.name,tur=kind,boyut=list(q.size),world_to_tangent=swap));return q
for mat in usedmats:
 orig=mat.get('angora_original',re.sub(r'^FOTO_\d+_','',mat.name));mat['orijinal_ad']=orig if not orig.startswith(('M1_','M2_','M3_','A08_','A09_','M3G_')) else 'EK_'+orig
 if not mat.use_nodes:continue
 nt=mat.node_tree;bs=next((n for n in nt.nodes if n.type=='BSDF_PRINCIPLED'),None)
 if not bs:continue
 alpha_value=None
 if bs.inputs['Alpha'].is_linked:
  an=bs.inputs['Alpha'].links[0].from_node
  if an.type=='TEX_IMAGE' and an.image:
   ap=np.empty(an.image.size[0]*an.image.size[1]*4,np.float32);an.image.pixels.foreach_get(ap);alpha=ap.reshape(-1,4)[::17,3];alpha_value=float(np.median(alpha));report['notlar'].append({'alfa_malzeme':mat.name,'min':float(alpha.min()),'max':float(alpha.max()),'skaler':alpha_value})
 worldnorm=any(n.type=='NORMAL_MAP' and n.space=='WORLD' for n in nt.nodes)
 for n in list(nt.nodes):
  if n.type!='TEX_IMAGE' or not n.image:continue
  outputs=[l.to_socket.name for l in nt.links if l.from_node==n];isnormal=any(l.to_node.type=='NORMAL_MAP' for l in nt.links if l.from_node==n)
  color=n.image.colorspace_settings.name=='sRGB';kind='albedo' if color else ('normal' if isnormal else 'data')
  n.image=convert_image(n.image,kind,worldnorm and isnormal)
 for n in nt.nodes:
  if n.type=='NORMAL_MAP' and n.space=='WORLD':n.space='TANGENT'
 # Constant-alpha JPEG conversion: preserve opacity via factor where alpha was uniform.
 if bs.inputs['Alpha'].is_linked:
  link=bs.inputs['Alpha'].links[0]
  if link.from_node.type=='TEX_IMAGE':
   original=link.from_node.image;nt.links.remove(link);bs.inputs['Alpha'].default_value=alpha_value if alpha_value is not None else 1.0
   report['notlar'].append('JPEG albedo alfa bağlantısı skaler opaklığa dönüştürüldü: '+mat.name)
# Per-floor meshes with original parent name. UVs and split normals are interpolated through cuts.
levels=[3.0986,6.3704,9.4695];floors=['bodrum','giris','kat1','cati'];outputs={'BUILDING':[],'INTERIOR':[]}
def floorid(z):return sum(z>=h for h in levels)
for number,ob in enumerate(meshes):
 if not ob.data.polygons:continue
 role=ob.get('kaynak_grup','EKLER');group='INTERIOR' if role=='INTERIOR' else 'BUILDING';oldname=ob.name;oldmeshname=ob['mesh_adi_orijinal'];bb=bbox(ob);low,high=floorid(bb[0][2]+.001),floorid(bb[1][2]-.001)
 if low==high or role=='EKLER':
  kat=floors[floorid((bb[0][2]+bb[1][2])/2)];ob['kat']=kat
  if role=='EKLER':ob.name='EK_'+oldname
  outputs[group].append(ob);continue
 oldmw=ob.matrix_world.copy();bm=bmesh.new();bm.from_mesh(ob.data);bm.faces.ensure_lookup_table();normal_layer=bm.loops.layers.float_vector.new('web_normal')
 try:
  normals=[tuple(n.vector) for n in ob.data.corner_normals]
  for face in bm.faces:
   for loop,li in zip(face.loops,ob.data.polygons[face.index].loop_indices):loop[normal_layer]=normals[li]
 except Exception:normal_layer=None
 inv=oldmw.inverted()
 for z in levels:
  if bb[0][2]<z<bb[1][2]:bmesh.ops.bisect_plane(bm,geom=list(bm.verts)+list(bm.edges)+list(bm.faces),dist=.000001,plane_co=inv@Vector((0,0,z)),plane_no=oldmw.to_3x3().transposed()@Vector((0,0,1)),clear_outer=False,clear_inner=False)
 facekat=bm.faces.layers.int.new('web_kat')
 for f in bm.faces:f[facekat]=floorid((oldmw@f.calc_center_median()).z)
 parent=bpy.data.objects.new('WEB_PARENT_'+oldname,None);scene.collection.objects.link(parent);parent['kat']=floors[low];parent['katlar']=floors[low:high+1];parent['kaynak_nesne']=oldname;parent['kaynak_grup']=role
 outputs[group].append(parent);children=[]
 for k in range(4):
  part=bm.copy();fk=part.faces.layers.int.get('web_kat');gone=[f for f in part.faces if f[fk]!=k]
  if len(gone)==len(part.faces):part.free();continue
  bmesh.ops.delete(part,geom=gone,context='FACES');me=bpy.data.meshes.new('WEB_MESH_'+oldname+'_'+floors[k]);part.to_mesh(me);part.free()
  for m in ob.data.materials:me.materials.append(m)
  if 'web_normal' in me.attributes:
   try:me.normals_split_custom_set([tuple(a.vector.normalized()) for a in me.attributes['web_normal'].data])
   except Exception as e:report['notlar'].append('Normal aktarımı: '+oldname+' '+str(e))
  child=bpy.data.objects.new('EK_'+oldname+'_'+floors[k],me);scene.collection.objects.link(child);child.parent=parent;child.matrix_world=oldmw;child['kat']=floors[k];child['kaynak_nesne']=oldname;child['kaynak_grup']=role;child['mesh_adi_orijinal']=oldmeshname;outputs[group].append(child);children.append(child.name)
 bm.free();bpy.data.objects.remove(ob,do_unlink=True);parent.name=oldname;report['katlara_ayirma'].append(dict(kaynak=oldname,parcalar=children))
 if number%10==0:print('[web] kat ayırma',number,len(meshes),flush=True)
# Capture material and node names for exact restoration in the GLB JSON (duplicate names legal).
names={m.name:m.get('orijinal_ad',m.name) for m in usedmats};(C/'malzeme-adlari.json').write_text(json.dumps(names,ensure_ascii=False),encoding='utf-8')
for group,filename in [('BUILDING','BUILDING-opt-v6.glb'),('INTERIOR','INTERIOR-opt-v3.glb')]:
 bpy.ops.object.select_all(action='DESELECT')
 for ob in outputs[group]:ob.select_set(True)
 bpy.ops.export_scene.gltf(filepath=str(D/filename),export_format='GLB',use_selection=True,export_yup=True,export_apply=True,export_extras=True,export_lights=False,export_cameras=False,export_animations=False,export_image_format='AUTO',export_image_quality=95,export_draco_mesh_compression_enable=False,export_materials='EXPORT')
 print('[web] EXPORT',filename,(D/filename).stat().st_size,flush=True)
bpy.ops.wm.save_as_mainfile(filepath=str(C/'web-hazir.blend'))
(D/'web-kontrol.json').write_text(json.dumps(report,ensure_ascii=False,indent=1),encoding='utf-8');print('[web] HAZIR',flush=True)
