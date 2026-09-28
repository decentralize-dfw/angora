import bpy,sys,json,math,bmesh
from pathlib import Path
from mathutils import Vector,Matrix
sys.path.insert(0,r'C:\Users\yigit\angora-tur10\moduller')
import ortak as o
o.basla('A09_')
for ob in list(o.C.objects):
 if ('korkuluk' in ob.name.lower() or ob.name.startswith('A08_F18_galeri') or ob.name=='A08_Final_F47_ic_duvar'):
  bpy.data.objects.remove(ob,do_unlink=True)
iron=o.malzeme('A09_DWG_Demir',(.018,.020,.018),.38,.72);hand=o.malzeme('M2_Koyu_ceviz_kupeşte',(.066,.028,.012),.32);white=o.malzeme('M2_Beyaz_merdiven_alti',(.81,.79,.73),.8)
data=json.loads((o.W/'adim09/cad/panel.json').read_text(encoding='utf-8'))
archive=bpy.data.collections.get('ARSIV_DWG') or bpy.data.collections.new('ARSIV_DWG')
if not archive.users:bpy.context.scene.collection.children.link(archive)
archive.hide_render=False;archive.hide_viewport=False
# Actual DXF LINE/ARC paths, each swept with a 12mm square profile.
profile=bpy.data.curves.new('DWG_12mm_kare','CURVE');profile.dimensions='2D';sp=profile.splines.new('POLY');sp.points.add(3)
for p,xy in zip(sp.points,[(-.006,-.006),(.006,-.006),(.006,.006),(-.006,.006)]):p.co=(*xy,0,1)
sp.use_cyclic_u=True;profob=bpy.data.objects.new('DWG_12mm_profil',profile);archive.objects.link(profob)
parts=[]
for k in range(0,len(data['paths']),150):
 cu=bpy.data.curves.new('DWG_panel_kaynak_'+str(k),'CURVE');cu.dimensions='3D';cu.resolution_u=1;cu.bevel_mode='OBJECT';cu.bevel_object=profob;cu.use_fill_caps=True
 for path in data['paths'][k:k+150]:
  s=cu.splines.new('POLY');s.points.add(len(path['points'])-1)
  for p,(x,z) in zip(s.points,path['points']):p.co=(x,0,z+.08,1)
 ob=bpy.data.objects.new(cu.name,cu);archive.objects.link(ob);cu.materials.append(iron);bpy.context.view_layer.update();me=bpy.data.meshes.new_from_object(ob.evaluated_get(bpy.context.evaluated_depsgraph_get()));parts.append(me)
archive.hide_render=True;archive.hide_viewport=True
segments=[]
def rail(name,a,b):
 a,b=Vector(a),Vector(b);length=Vector((b.x-a.x,b.y-a.y,0)).length;ex=(b-a)/length;ey=Vector((-ex.y,ex.x,0));ez=Vector((0,0,1))
 o.boru(name+'_ahsap_kupeste',[a+ez*.90,b+ez*.90],.032,hand)
 for k in range(math.ceil(length)):
  remain=min(1.,length-k)
  for t in [.1275,.8725]:
   if t<remain:o.kutu(name+f'_zemin_baglanti_{k}_{t}',a+ex*(k+t)+ez*.04,(.012,.012,.08),iron,0)
  for j,source in enumerate(parts):
   me=source
   if remain<.999:
    me=source.copy();bm=bmesh.new();bm.from_mesh(me);bmesh.ops.bisect_plane(bm,geom=list(bm.verts)+list(bm.edges)+list(bm.faces),dist=.00001,plane_co=(remain,0,0),plane_no=(1,0,0),clear_outer=True,clear_inner=False);bm.to_mesh(me);bm.free()
   origin=a+ex*k;ob=bpy.data.objects.new(name+f'_DWG_{k}_{j}',me);o.C.objects.link(ob);ob.matrix_world=Matrix(((ex.x,ey.x,ez.x,origin.x),(ex.y,ey.y,ez.y,origin.y),(ex.z,ey.z,ez.z,origin.z),(0,0,0,1)));ob['DWG_blok']='KORKULUK 1';ob['profil_mm']=12
 segments.append(dict(ad=name,bas=list(a),son=list(b),kaynak='Döşeme boşluğu kenarı / mevcut ölçülen model',shear=float(ex.z)))
for level,(base,top,nlower,nupper) in enumerate([(0,3.0996,9,9),(3.0996,6.3714,10,9),(6.3714,9.4705,9,9)]):
 rise=(top-base)/(nlower+nupper);run=.2555
 for flight,(n,y,x,sgn,z0) in enumerate([(nlower,3.1272 if level==0 else 2.1271,3.1717-nlower*run,1,base),(nupper,1.9274,3.1717,-1,base+nlower*rise)]):
  end=x+sgn*n*run
  if level==2 and flight==1:end=1.108
  rail(f'A09_K{level}_{flight}',(x,y,z0),(end,y,z0+n*rise))
for i,(a,b,z) in enumerate([((.869,.904),(2.969,.904),3.0996),((.1835,-.4278),(.1835,.9627),6.3714),((.1835,.9627),(1.7182,.9627),6.3714),((1.108,1.9274),(1.108,3.128),9.4705)]):rail(f'A09_galeri_{i}',(*a,z),(*b,z))
(o.W/'adim09/korkuluk-yerlesim.json').write_text(json.dumps(segments,ensure_ascii=False,indent=1),encoding='utf-8')
# One vertical plane, beyond the lower flight's right edge. No sloping cover intersections.
o.kutu('A09_F47_tek_duvar',(2.57,2.0271,1.65),(3.48,.20,3.30),white,0)
p=o.W/'silme-kutulari.json';boxes=json.loads(p.read_text(encoding='utf-8'));boxes=[b for b in boxes if not b['ad'].startswith('A09_')]
boxes += [dict(ad='A09_F47_eski_beyaz_ust_basamak',katman='mobilya',min=[.75,2.125,.02],max=[4.19,3.16,3.12],malzemeler=['Simple White Wall'],normal_axes=[0,2],kes=True),dict(ad='A09_F47_egik_duvar_yuzleri',katman='mobilya',min=[.36,1.93,.02],max=[4.19,2.125,3.31],malzemeler=['Simple White Wall'],kes=True)]
# Bathroom 32 lower decorative strip, at the photographed washbasin +10cm elevation.
band=o.malzeme('A09_Banyo_bordur',(.42,.32,.2),.45)
for name,pos,size in [('arka',(1.74,9.035,7.32),(2.6,.008,.10)),('sol',(.875,8.0,7.32),(.008,2.1,.10))]:o.kutu('A09_F32_bordur_'+name,pos,size,band,0)
for b in list(boxes):
 if b['ad'].startswith('A09_F47') and b['katman']=='mobilya':
  q=dict(b);q['ad']+=' mimari';q['katman']='mimari';boxes.append(q)
p.write_text(json.dumps(boxes,ensure_ascii=False,indent=1),encoding='utf-8')
o.bitir('A09',{'korkuluk':'507 gerçek DXF LINE/ARC; 12mm kare profil, tek panel, eğim shear','yerlesim':'döşeme boşluğu kenarları; foto18 L galeri','F47':'eski beyaz basamak ve eğik yüzey maskesi; tek düz dikey duvar'})
