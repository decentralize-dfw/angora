import bpy, math, json
from pathlib import Path
from mathutils import Vector
R=Path(r'C:\Users\yigit\Downloads\angora-main (2)\angora-main')
W=Path(r'C:\Users\yigit\angora-tur10')
bpy.ops.wm.open_mainfile(filepath=str(W/'ekler-calisma.blend'))
C=bpy.data.collections['EKLER']
# Foto 13 ve 17 için tek tek tasarlanan parçalar. Referanslara dönüşüm uygulanmaz.
for ob in list(C.objects):
 if ob.name.startswith('107_'): bpy.data.objects.remove(ob,do_unlink=True)
def move(ob,name,mat=None):
 ob.name=name
 for col in list(ob.users_collection):col.objects.unlink(ob)
 C.objects.link(ob)
 if mat:ob.data.materials.append(mat)
 return ob
def material(name,color,rough=.5,metal=0,em=0):
 m=bpy.data.materials.new(name);m.use_nodes=True
 p=m.node_tree.nodes.get('Principled BSDF');p.inputs['Base Color'].default_value=(*color,1)
 p.inputs['Roughness'].default_value=rough;p.inputs['Metallic'].default_value=metal
 if em:p.inputs['Emission Color'].default_value=(*color,1);p.inputs['Emission Strength'].default_value=em
 return m
black=material('107_Ferforje_siyah_saten',(.025,.028,.027),.36,.72)
brass=material('107_Eskitilmis_pirinc',(.36,.25,.13),.33,.8)
quilt=material('107_Gri_vizon_kapitone',(.24,.205,.18),.9)
thread=material('107_Kapitone_dikis',(.19,.16,.145),.94)
cream=material('107_Katlanmis_krem_yorgan',(.68,.59,.46),.94)
pink=material('107_Somon_potikare',(.61,.29,.20),.9)
pinklight=material('107_Yastik_ince_dikis',(.83,.55,.39),.91)
glass=material('107_Lamba_isikli_cam',(.94,.79,.49),.29,0,1.2)
ivory=material('107_Paspartu',(.82,.76,.63),.8)
def mesh(name,vs,fs,mat,uv=None):
 me=bpy.data.meshes.new(name);me.from_pydata(vs,[],fs);me.update()
 ob=bpy.data.objects.new(name,me);C.objects.link(ob)
 if mat:me.materials.append(mat)
 if uv:
  lay=me.uv_layers.new()
  for p in me.polygons:
   for li,vi in zip(p.loop_indices,p.vertices):lay.data[li].uv=uv[vi]
 return ob
def bevelbox(name,pos,size,mat,width=.015,segments=3):
 bpy.ops.mesh.primitive_cube_add(size=1,location=pos);ob=move(bpy.context.object,name,mat)
 ob.dimensions=size;bpy.ops.object.transform_apply(location=False,rotation=False,scale=True)
 if width:
  mod=ob.modifiers.new('Profil pahı','BEVEL');mod.width=width;mod.segments=segments
  bpy.ops.object.modifier_apply(modifier=mod.name)
 return ob
def tube(name,pts,r,mat,cyclic=False,res=2):
 cu=bpy.data.curves.new(name,'CURVE');cu.dimensions='3D';cu.resolution_u=12
 cu.bevel_depth=r;cu.bevel_resolution=res
 sp=cu.splines.new('POLY');sp.points.add(len(pts)-1)
 for p,co in zip(sp.points,pts):p.co=(*co,1)
 sp.use_cyclic_u=cyclic;ob=bpy.data.objects.new(name,cu);C.objects.link(ob);cu.materials.append(mat)
 bpy.context.view_layer.objects.active=ob;ob.select_set(True)
 bpy.ops.object.convert(target='MESH');ob.select_set(False)
 for p in ob.data.polygons:p.use_smooth=True
 return ob
def lathe(name,xy,profile,mat,n=24):
 vs=[(xy[0]+r*math.cos(2*math.pi*j/n),xy[1]+r*math.sin(2*math.pi*j/n),z) for r,z in profile for j in range(n)]
 fs=[(i*n+j,i*n+(j+1)%n,(i+1)*n+(j+1)%n,(i+1)*n+j) for i in range(len(profile)-1) for j in range(n)]
 fs.extend([tuple(reversed(range(n))),tuple((len(profile)-1)*n+j for j in range(n))])
 ob=mesh(name,vs,fs,mat)
 for p in ob.data.polygons:p.use_smooth=len(p.vertices)==4
 return ob
def ball(name,pos,r,mat):
 bpy.ops.mesh.primitive_uv_sphere_add(segments=16,ring_count=8,radius=r,location=pos)
 ob=move(bpy.context.object,name,mat)
 for p in ob.data.polygons:p.use_smooth=True
 return ob
F=6.3714; yc=-3.35
# İnce borulu, boğumlu, pirinç küre başlıklı gerçek karyola.
for x,h,end in [(-1.84,1.24,'Basucu'),(.24,1.01,'Ayakucu')]:
 for y,side in [(-4.16,'Pencere'),(-2.54,'Kapi')]:
  profile=[(.029,F+.018),(.029,F+.035),(.023,F+.055),(.023,F+.27),(.028,F+.278),(.028,F+.294),(.024,F+.305),(.024,F+h-.11),(.027,F+h-.105),(.027,F+h-.086),(.022,F+h-.076),(.022,F+h)]
  lathe('107_'+end+'_dikme_'+side,(x,y),profile,black)
  lathe('107_'+end+'_pirinc_ayak_'+side,(x,y),[(.032,F+.008),(.032,F+.023),(.029,F+.032),(.027,F+.046)],brass)
  lathe('107_'+end+'_pirinc_bogum_'+side,(x,y),[(.025,F+h),(.029,F+h+.012),(.028,F+h+.026),(.024,F+h+.035),(.027,F+h+.042)],brass)
  ball('107_'+end+'_pirinc_kure_'+side,(x,y,F+h+.069),.032,brass)
 for z in [F+h-.025,F+h-.15,F+.33]:tube('107_'+end+'_yatay_kayit',[(x,-4.16,z),(x,-2.54,z)],.012 if z>F+.4 else .019,black)
 for i,y in enumerate([-3.94,-3.71,-3.48,-3.25,-3.02,-2.79]):
  top=F+h-.025 if i%2==0 else F+h-.15
  tube('107_'+end+'_ince_cubuk_'+str(i),[(x,y,F+.34),(x,y,top+.012)],.0075,black)
  for z in [top,F+h-.15]:
   lathe('107_'+end+'_dokum_baglanti',(x,y),[(.011,z-.012),(.014,z-.006),(.014,z+.007),(.009,z+.015)],black,16)
for y in [-4.16,-2.54]:bevelbox('107_Karyola_yan_lama',(-.8,y,F+.285),(2.08,.035,.105),black,.007)
bevelbox('107_Yatak_siltesi',(-.8,yc,F+.475),(1.99,1.57,.29),ivory,.075,6)
# Örtü: yatak yüzünden yanlara yumuşak dökülme, küçük doğal dalgalar.
nx,ny=73,57;vs=[];fs=[]
for i in range(nx):
 x=-1.81+2.06*i/(nx-1)
 for j in range(ny):
  t=j/(ny-1);y=yc+(t-.5)*1.92
  over=max(0,abs(y-yc)-.755)
  z=F+.63-.37*min(1,over/.205)**.75
  z+=.010*math.sin(13*x+8*y)+.006*math.sin(25*y+2*x)
  y+=.008*math.sin(i*.45)*abs(2*t-1)**4
  vs.append((x,y,z))
for i in range(nx-1):
 for j in range(ny-1):a=i*ny+j;fs.append((a,a+ny,a+ny+1,a+1))
ob=mesh('107_Kapitone_ortu_dokum',vs,fs,quilt)
for p in ob.data.polygons:p.use_smooth=True
for j in range(21):
 y=yc-.73+j*.073
 pts=[]
 for i in range(65):
  x=-1.79+i*2.0/64; yy=y+.022*math.sin(x*13+j*.8)
  zz=F+.634+.010*math.sin(13*x+8*yy)+.006*math.sin(25*yy+2*x)
  pts.append((x,yy,zz))
 tube('107_Kapitone_kavisli_dikis',pts,.0012,thread,res=0)
# Ayak ucunda fotoğraftaki üç katlı krem yorgan ve kenar biyeleri.
for k in range(3):
 x=-.15-.018*k;z=F+.67+.046*k
 ob=bevelbox('107_Krem_yorgan_kat_'+str(k),(x,yc,z),(.66,1.54,.085),cream,.040,5)
 for p in ob.data.polygons:p.use_smooth=True
 pts=[(x+.27,yc-.72,z+.014),(x+.31,yc-.67,z+.020),(x+.31,yc+.67,z+.020),(x+.27,yc+.72,z+.014)]
 tube('107_Yorgan_kat_biyesi',pts,.003,ivory)
# Yastıklar: tombul gövde, ince fitil ve fırfırlı çevre; fotoğraftaki somon renk.
for index,y in enumerate([-3.78,-2.96]):
 ob=bevelbox('107_Somon_yastik_'+str(index),(-1.43,y,F+.745),(.42,.59,.15),pink,.069,6)
 ob.rotation_euler[1]=math.radians(-12);ob.rotation_euler[2]=math.radians(-6 if index==0 else 8)
 for p in ob.data.polygons:p.use_smooth=True
 pts=[]
 for k in range(129):
  a=2*math.pi*k/128;c=math.cos(a);s=math.sin(a)
  xx=.22*math.copysign(abs(c)**.45,c);yy=.315*math.copysign(abs(s)**.45,s)
  pts.append((-1.43+xx,y+yy,F+.75+.012*math.sin(k*2.3)))
 tube('107_Yastik_firfir_biye',pts,.009,pinklight,True,1)
 for j in range(17):
  yy=y-.25+j*.031
  tube('107_Yastik_potikare_dikis',[(-1.6,yy,F+.822),(-1.3,yy,F+.822)],.0014,pinklight,res=0)
# Pencere yanında yuvarlak, üç kavisli ayaklı siyah komodin (iki fotoğrafta aynı nesne).
tx,ty=-1.48,-4.53
lathe('107_Komodin_tabla',(tx,ty),[(.0,F+.69),(.225,F+.69),(.244,F+.704),(.244,F+.726),(.234,F+.737),(.0,F+.737)],black,48)
lathe('107_Komodin_alt_halka',(tx,ty),[(.0,F+.31),(.103,F+.31),(.112,F+.321),(.108,F+.334),(.0,F+.334)],black)
for k in range(3):
 a=2*math.pi*k/3;pts=[]
 for i in range(30):
  t=i/29;rad=.19-.115*math.sin(math.pi*t)
  pts.append((tx+rad*math.cos(a),ty+rad*math.sin(a),F+.045+t*.65))
 tube('107_Komodin_kavisli_ayak',pts,.010,black)
# Eklemli masa lambası, çift ince kol, pivotlar, kubbe ve dudak profili.
lathe('107_Masa_lambasi_taban',(tx,ty),[(.0,F+.74),(.085,F+.74),(.092,F+.755),(.076,F+.771),(.0,F+.782)],black)
p0=(tx,ty,F+.78);p1=(tx+.05,ty+.03,F+1.10);p2=(tx-.08,ty+.035,F+1.38);p3=(tx-.24,ty+.035,F+1.37)
for a,b in [(p0,p1),(p1,p2),(p2,p3)]:
 for dy in [-.012,.012]:tube('107_Lamba_cift_mafsalli_kol',[(a[0],a[1]+dy,a[2]),(b[0],b[1]+dy,b[2])],.0045,black)
for p in [p0,p1,p2]:ball('107_Lamba_mafsal',p,.017,black)
lathe('107_Lamba_kubbe',(p3[0],p3[1]),[(.09,F+1.32),(.093,F+1.33),(.087,F+1.36),(.069,F+1.395),(.04,F+1.417),(.01,F+1.423)],black,32)
lathe('107_Lamba_ic_cam',(p3[0],p3[1]),[(.0,F+1.319),(.081,F+1.319),(.082,F+1.327),(.0,F+1.327)],glass)
# Üçlü siyah tavan armatürü: düz kola yuvarlatılmış dirsekler ve çan profilleri.
cx,cy,cz=-.45,-3.35,9.14
lathe('107_Tavan_rozansi',(cx,cy),[(.10,cz),(.095,cz-.023),(.077,cz-.055),(.033,cz-.10)],black)
tube('107_Tavan_orta_aski',[(cx,cy,cz-.07),(cx,cy,cz-.43)],.011,black)
pts=[(cx-.42,cy,cz-.40),(cx-.42,cy,cz-.27),(cx-.415,cy,cz-.245),(cx-.4,cy,cz-.23),(cx-.38,cy,cz-.225),(cx+.38,cy,cz-.225),(cx+.4,cy,cz-.23),(cx+.415,cy,cz-.245),(cx+.42,cy,cz-.27),(cx+.42,cy,cz-.40)]
tube('107_Tavan_bukulmus_uc_spot_kolu',pts,.008,black)
for xx,zz in [(cx-.42,cz-.40),(cx,cz-.48),(cx+.42,cz-.40)]:
 lathe('107_Tavan_can_spot',(xx,cy),[(.023,zz),(.031,zz-.04),(.047,zz-.068),(.059,zz-.10),(.069,zz-.12),(.070,zz-.13),(.059,zz-.137)],black)
 lathe('107_Tavan_spot_cam',(xx,cy),[(.0,zz-.134),(.055,zz-.134),(.057,zz-.137),(.0,zz-.14)],glass)
# Gerçek fotoğrafın ilgili bölgesini UV koordinatlarıyla kullanan görüntü malzemesi.
def photo_mat(name,filename):
 m=material(name,(1,1,1),.91);im=bpy.data.images.load(str(R/'photogallery'/filename),check_existing=True)
 if max(im.size)>1024:
  q=1024/max(im.size);im.scale(round(im.size[0]*q),round(im.size[1]*q))
 im.pack();n=m.node_tree.nodes.new('ShaderNodeTexImage');n.image=im
 m.node_tree.links.new(n.outputs['Color'],m.node_tree.nodes['Principled BSDF'].inputs['Base Color'])
 return m
curtain=photo_mat('107_Gercek_damask_foto13','angora_13.jpg')
# Soldaki ve sağdaki özgün kumaş paneli; pileler geometri, desen gerçek fotoğraf UV'si.
for k,(xa,xb,quad) in enumerate([(-1.50,-.51,[(.15,.26),(.32,.29),(.32,.72),(.14,.75)]),(-.47,.51,[(.34,.29),(.455,.315),(.46,.60),(.335,.68)])]):
 vs=[];uv=[];fs=[];nu,nv=65,17
 for i in range(nu):
  u=i/(nu-1)
  for j in range(nv):
   v=j/(nv-1);x=xa+(xb-xa)*u
   y=-4.81+.050*math.cos(u*math.pi*18)+.009*math.sin(v*9+u*17)
   z=F+.055+v*2.48+.013*math.sin(u*22)*(1-v)
   vs.append((x,y,z))
   # quad: top-left, top-right, bottom-right, bottom-left (photo y downward).
   tl,tr,br,bl=quad;px=(bl[0]*(1-u)+br[0]*u)*(1-v)+(tl[0]*(1-u)+tr[0]*u)*v
   py=(bl[1]*(1-u)+br[1]*u)*(1-v)+(tl[1]*(1-u)+tr[1]*u)*v;uv.append((px,1-py))
 for i in range(nu-1):
  for j in range(nv-1):a=i*nv+j;fs.append((a,a+nv,a+nv+1,a+1))
 ob=mesh('107_Damask_perde_pileli_'+str(k),vs,fs,curtain,uv)
 for p in ob.data.polygons:p.use_smooth=True
tube('107_Siyah_perde_cubugu',[(-1.59,-4.81,F+2.59),(.61,-4.81,F+2.59)],.012,black)
for x in [-1.63,.65]:ball('107_Perdecubugu_uc_topuzu',(x,-4.81,F+2.59),.026,black)
for i in range(21):
 x=-1.48+i*.098;pts=[(x,-4.81+.018*math.cos(a*math.pi/12),F+2.565+.027*math.sin(a*math.pi/12)) for a in range(24)]
 tube('107_Perde_aski_halkasi',pts,.0027,black,True,1)
# Beş küçük çizim ve paspartusu fotoğraftaki siyah dikdörtgen çerçeve içinde.
art=photo_mat('107_Orijinal_bes_cizim','angora_40.jpg')
# Asıl resmin kaynak fotoğrafı referans malzemedeki Image_40'tır; aşağıda onu kullan.
source=bpy.data.materials.get('Room finish | Original bedroom line artwork')
if source:
 image_node=next((n for n in source.node_tree.nodes if n.type=='TEX_IMAGE' and n.image),None)
 if image_node:
  im=image_node.image;im.pack();art.node_tree.nodes.get('Image Texture').image=im
x=-1.917;z=F+2.05;ya,yb=yc-.55,yc+.55
bevelbox('107_Tablo_paspartu',(x,yc,z),(.026,1.10,.43),ivory,.004)
mesh('107_Tablo_ozgun_cizimler',[(x+.017,ya,z-.215),(x+.017,yb,z-.215),(x+.017,yb,z+.215),(x+.017,ya,z+.215)],[(0,1,2,3)],art,[(.041,1-.318),(.407,1-.326),(.407,1-.225),(.041,1-.203)])
for yy in [ya-.012,yb+.012]:bevelbox('107_Tablo_cerceve_dikey',(x+.023,yy,z),(.045,.028,.483),black,.005)
for zz in [z-.229,z+.229]:bevelbox('107_Tablo_cerceve_yatay',(x+.023,yc,zz),(.045,1.153,.028),black,.005)
boxes=[{'ad':'107 eski ahsap karyola, silte ve ortu','min':[-1.93,-4.205,F+.055],'max':[.30,-2.50,F+1.36]},
 {'ad':'107 eski buyuk sarkit','min':[-.72,-3.30,8.23],'max':[-.17,-2.70,9.20]},
 {'ad':'107 eski dar perde','min':[-1.39,-4.96,F+.02],'max':[.57,-4.865,8.81]}]
(W/'silme-kutulari.json').write_text(json.dumps(boxes,ensure_ascii=False,indent=1),encoding='utf-8')
# Yeni dosya diskten üretilir; açık Blender penceresine fare/klavye gönderilmez.
for ob in C.objects:ob.select_set(False)
bpy.ops.wm.save_as_mainfile(filepath=str(W/'ekler-calisma.blend'))
for ob in bpy.context.scene.objects:ob.select_set(False)
for ob in C.objects:ob.select_set(True)
out=R/'build/web/26092026/EKLER.glb'
bpy.ops.export_scene.gltf(filepath=str(out),use_selection=True,export_format='GLB',export_yup=True,export_apply=True,export_draco_mesh_compression_enable=False)
counts={o.name:sum(len(p.vertices)-2 for p in o.data.polygons) for o in C.objects if o.type=='MESH'}
(W/'geometri-raporu.json').write_text(json.dumps({'nesneler':counts,'toplam_ucgen':sum(counts.values()),'glb_bayt':out.stat().st_size},ensure_ascii=False,indent=1),encoding='utf-8')
print('[tur10] oda107 parca',len(counts),'ucgen',sum(counts.values()),'en_buyuk',max(counts.values()),'GLB',out.stat().st_size,flush=True)
