import bpy,json,numpy as np,re,math
from pathlib import Path
from mathutils import Vector
from mathutils.bvhtree import BVHTree
W=Path(r'C:\Users\yigit\angora-tur10');R=Path(r'C:\Users\yigit\Downloads\angora-main (2)\angora-main');A=W/'adim10';U=A/'uv';U.mkdir(exist_ok=True)
bpy.ops.wm.open_mainfile(filepath=str(A/'sahne.blend'));scene=bpy.context.scene
before=set(scene.objects);bpy.ops.import_scene.gltf(filepath=str(R/'build/bake/GARDEN-opt-v2-lm.glb'))
for ob in set(scene.objects)-before:ob['angora_role']='GARDEN'
def classify(mat):
 s=mat.name.lower();no=mat.get('angora_doku_no');bs=next((n for n in mat.node_tree.nodes if n.type=='BSDF_PRINCIPLED'),None) if mat.use_nodes else None
 if any(t in s for t in ['tree','leaf','leaves','bark','foliage','grass plant','glass','cam','mirror','ayna','metal','brass','pirinc','pirinç','zincir','spot','opal','bulb','krom','vana','paslanmaz','demir','ferforje','water','su ']):return None
 if bs and (bs.inputs['Metallic'].default_value>.6 or bs.inputs['Transmission Weight'].default_value>.5):return None
 if any(t in s for t in ['grass','limestone','garden','pool','canopy','white_trim']):return 'bahce'
 if no in [3,4,10,19,26,29,32] or s in ['wood_floor','wood-fl','terra_floor','stone_tile']:return 'zemin'
 if no==1 or any(t in s for t in ['stucco','roof','clay tile','gravel']):return 'cephe'
 if any(t in s for t in ['artwork','picture','quilt','curtain','upholstery','roughnss','blck']):return None
 return 'duvar'
matatlas={m.name:classify(m) for m in bpy.data.materials};records=[]
for oi,ob in enumerate(list(scene.objects)):
 if ob.type!='MESH':continue
 me=ob.data;me.calc_loop_triangles();verts=np.empty(len(me.vertices)*3,np.float32);me.vertices.foreach_get('co',verts);verts=verts.reshape(-1,3);mw=np.array(ob.matrix_world);world=(verts@mw[:3,:3].T+mw[:3,3]).astype(np.float32)
 tris=np.array([t.vertices[:] for t in me.loop_triangles],np.int32);loops=np.array([t.loops[:] for t in me.loop_triangles],np.int32);mis=np.array([t.material_index for t in me.loop_triangles]);norms=np.array([n.vector[:] for n in me.corner_normals]);norms=norms@np.linalg.inv(mw[:3,:3]);norms/=np.maximum(np.linalg.norm(norms,axis=1,keepdims=True),1e-10)
 uv=me.uv_layers.active_render or (me.uv_layers[0] if me.uv_layers else None);uvdata=np.array([d.uv[:] for d in uv.data]) if uv else np.zeros((len(me.loops),2))
 for mi in np.unique(mis):
  if mi>=len(me.materials) or me.materials[mi] is None:continue
  mat=me.materials[mi];sel=mis==mi;tt=tris[sel];ll=loops[sel];used,idx=np.unique(tt,return_inverse=True);nn=ob.name if len(np.unique(mis))==1 else ob.name+'__'+mat.name;new=bpy.data.meshes.new(nn);new.from_pydata(world[used].tolist(),[],idx.reshape(-1,3).tolist());new.materials.append(mat);new.update();uv0=new.uv_layers.new(name='UVMap');uv0.data.foreach_set('uv',uvdata[ll.ravel()].ravel());new.normals_split_custom_set(norms[ll.ravel()].tolist());obj=bpy.data.objects.new(nn+'_UV',new);scene.collection.objects.link(obj)
  for k in ob.keys():obj[k]=ob[k]
  obj['kaynak_nesne']=ob.name;obj['kat']=['bodrum','giris','kat1','cati'][sum(float(world[used][:,2].mean())>=h for h in [3.0986,6.3704,9.4695])];atlas=matatlas[mat.name]
  if ob.get('orijinal_korkuluk'):atlas=None
  if ob.get('angora_role')=='GARDEN' and atlas is not None:atlas='bahce';matatlas[mat.name]=atlas
  # Fixtures/radiators and all restored rails are excluded as complete material families.
  if any(s in mat.name.lower() for s in ['m6_','emaye','armatür']):atlas=None;matatlas[mat.name]=None
  obj['lightmap_atlas']=atlas or '';obj.name=nn
  records.append({'ob':obj.name,'mat':mat.name,'atlas':atlas,'role':ob.get('angora_role','EKLER')})
 bpy.data.objects.remove(ob,do_unlink=True)
 if oi%100==0:print('[UV] split',oi,flush=True)
# Enforce one atlas for every actual material name, including shared garden materials.
for rec in records:
 ob=bpy.data.objects[rec['ob']];rec['atlas']=None if ob.get('orijinal_korkuluk') else matatlas[rec['mat']];ob['lightmap_atlas']=rec['atlas'] or ''
# The same 0.60m front / 1m rear five-ray test as yuz_yonu.py, on final geometry including retaining walls.
av=[];af=[];fv=[];ff=[];na=nf=0
for rec in records:
 ob=bpy.data.objects[rec['ob']];me=ob.data;v=[x.co[:] for x in me.vertices];f=[tuple(p.vertices) for p in me.polygons];mat=me.materials[0]
 if any(s in mat.name.lower() for s in ['glass','cam','water']):continue
 fv.extend(v);ff.extend([tuple(i+nf for i in p) for p in f]);nf+=len(v)
 if rec['role']!='INTERIOR':av.extend(v);af.extend([tuple(i+na for i in p) for p in f]);na+=len(v)
arch=BVHTree.FromPolygons(av,af,all_triangles=True);full=BVHTree.FromPolygons(fv,ff,all_triangles=True);flips=[]
for rec in records:
 if not rec['atlas']:continue
 ob=bpy.data.objects[rec['ob']];me=ob.data;ids=[]
 for p in me.polygons:
  if p.area<1e-5:continue
  n=p.normal;c=p.center;ref=Vector((1,0,0)) if abs(n.x)<.9 else Vector((0,1,0));u=n.cross(ref).normalized();v=n.cross(u);t=math.tan(math.radians(25));dirs=[n]+[(n+t*d).normalized() for d in [u,-u,v,-v]]
  if sum(arch.ray_cast(c+d*.003,d,.60)[0] is not None for d in dirs)<3:continue
  if sum(full.ray_cast(c-d*.003,-d,1.)[0] is not None for d in dirs)>1:continue
  ids.append(p.index)
 for i in ids:me.polygons[i].flip()
 if ids:me.normals_split_custom_set([(0,0,0)]*len(me.loops));me.update()
 flips.append(dict(nesne=ob.name,cevrilen=len(ids),atlas=rec['atlas']))
 np.savez(U/(str(len(flips)-1)+'.npz'),pos=np.array([v.co[:] for v in me.vertices],np.float32),idx=np.array([p.vertices[:] for p in me.polygons],np.uint32));rec['data']=str(len(flips)-1)+'.npz'
 print('[UV] yon',ob.name,len(ids),flush=True)
(U/'girdi.json').write_text(json.dumps({'mesh':records,'materyal_atlas':matatlas,'ters_yuz':flips},ensure_ascii=False,indent=1),encoding='utf-8');bpy.ops.wm.save_as_mainfile(filepath=str(A/'uv-hazir.blend'));print('[UV] HAZIR',len(records),'ters',sum(x['cevrilen'] for x in flips),flush=True)

