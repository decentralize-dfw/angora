import bpy,bmesh,json,sys,re
from pathlib import Path
R=Path(r'C:\Users\yigit\Downloads\angora-main (2)\angora-main');W=Path(r'C:\Users\yigit\angora-tur10');T=Path(r'C:\Users\yigit\angora-tur9');A=W/'adim10'
bpy.ops.wm.open_mainfile(filepath=str(W/'adim09/kontrol-sahne.blend'));scene=bpy.context.scene;removed=[]
for ob in list(scene.objects):
 if ob.get('angora_role')!='EKLER':continue
 name=ob.name.lower();mats=' '.join(m.name for m in ob.data.materials) if ob.type=='MESH' else ''
 if any(x in name for x in ['korkuluk','kupeste','küpeşte','ferforje','galeri','dwg']) or 'A09_DWG' in mats or 'M2_Koyu_ceviz' in mats or name.startswith('a09_') and 'zemin_baglanti' in name:removed.append(ob.name);bpy.data.objects.remove(ob,do_unlink=True)
# Reload only the three original merged mesh sources; retain precisely the faces hidden by the former railing masks.
restored=[]
with bpy.data.libraries.load(str(A/'orijinal.blend'),link=False) as (src,dst):dst.objects=['metal (5)','metal1','WOOD1']
for ob in dst.objects:
 original=ob.name;scene.collection.objects.link(ob);bm=bmesh.new();bm.from_mesh(ob.data);mw=ob.matrix_world;gone=[]
 for f in bm.faces:
  c=mw@f.calc_center_median()
  if not (.12<=c.x<=4.19 and -.51<=c.y<=3.15 and .001<=c.z<=10.5):gone.append(f)
 bmesh.ops.delete(bm,geom=gone,context='FACES');bm.to_mesh(ob.data);bm.free();ob.name='ORIJINAL_KORKULUK_'+original;ob['angora_role']='BUILDING' if original.startswith('metal (5)') else 'INTERIOR';ob['orijinal_korkuluk']=True;ob['kaynak_glb']='BUILDING-opt-v4.glb' if original.startswith('metal (5)') else 'INTERIOR-opt-v2.glb';restored.append(dict(nesne=ob.name,yuz=len(ob.data.polygons),kaynak=ob['kaynak_glb']))
# Texture graphs and existing metre UV are retained; only requested source image bindings change.
for mat in bpy.data.materials:
 no=mat.get('angora_doku_no')
 if no not in [20,21,26]:continue
 folder=T/'malzeme-dokulari'/({20:'A08_ceviz',21:'A08_kiraz',26:'A10_terrakota'}[no])
 for n in mat.node_tree.nodes:
  if n.type!='TEX_IMAGE' or not n.image:continue
  base='albedo' if n.image.colorspace_settings.name=='sRGB' else ('normal' if any(l.to_node.type=='NORMAL_MAP' for l in n.outputs['Color'].links) else 'roughness')
  path=folder/(base+'.png')
  if not path.exists():path=folder/(base+'.jpg')
  n.image=bpy.data.images.load(str(path),check_existing=False);n.image.colorspace_settings.name='sRGB' if base=='albedo' else 'Non-Color'
bpy.ops.wm.save_as_mainfile(filepath=str(A/'sahne.blend'))
(A/'duzeltme-raporu.json').write_text(json.dumps({'silinen_EK_korkuluk':removed,'orijinal_geri_yuklenen':restored,'malzeme':'20 A08 ceviz;21 A08 kiraz;26 foto02 terrakota; gerçek UV korunur'},ensure_ascii=False,indent=1),encoding='utf-8');print('[A10] SAHNE',len(removed),restored,flush=True)
