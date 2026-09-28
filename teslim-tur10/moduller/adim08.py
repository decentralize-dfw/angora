import sys,json,math,runpy
from pathlib import Path
sys.path.insert(0,str(Path(__file__).parent))
import ortak as o,bpy
from mathutils import Vector,Matrix
# Rebuild only M2 with the shared photo18/34 prototype.
runpy.run_path(str(Path(__file__).with_name('merdiven.py')),run_name='__main__')
for ob in list(o.C.objects):
 if ob.name.startswith(('A08_','M3G_')):bpy.data.objects.remove(ob,do_unlink=True)
white=o.malzeme('M2_Beyaz_merdiven_alti',(.81,.79,.73),.8);iron=o.malzeme('M2_Siyah_dovme_demir',(.018,.02,.018),.36,.72);hand=o.malzeme('M2_Koyu_ceviz_kupeşte',(.066,.028,.012),.32);brass=o.malzeme('M3G_Pirinc',(.42,.29,.10),.28,.8)
from korkuluk_motif import yap
# Missing near edge of the first-floor gallery, same prototype as every flight.
yap(o,'A08_F18_galeri',lambda t,h:(.1835+t,.9627,6.3714+h),1.5347,'birinci',iron,hand,brass)
# Solid volume under the basement second flight, and a wall closing its right gap.
profile=[(.8722,0),(3.1717,0),(3.1717,1.30),(.8722,2.85)];vs=[(x,y,z) for y in [.9273,1.9274] for x,z in profile];o.mesh('A08_F02_dolu_merdiven_alti',vs,[(3,2,1,0),(4,5,6,7),(0,1,5,4),(1,2,6,5),(2,3,7,6),(3,0,4,7)],white)
o.kutu('A08_F47_sag_duvar_kapatma',(2.55,3.17,1.55),(3.30,.10,3.10),white,.002)
# Full-open common bathroom leaf; frame stays put.
pivot=Vector((1.8226,-.5696,6.3713));tr=Matrix.Translation(pivot)@Matrix.Rotation(math.radians(55),4,'Z')@Matrix.Translation(-pivot)
for ob in o.C.objects:
 if ob.name.startswith('M3_05_') and any(k in ob.name for k in ['kanat','gobek','profil','kulp','mentese']) and not ob.get('A08_acik'):
  ob.matrix_world=tr@ob.matrix_world;ob['A08_acik']=True
# Photo40 true paired hinged leaves, independent jamb pivots.
wood=o.malzeme('M3_Koyu_ceviz_kapi',(.07,.035,.018),.48);glass=bpy.data.materials.get('M3G_Foto40_gul_desenli_cam')
floor=3.0996;left=1.25;right=2.57;y=-1.775
for x in [left,right]:
 o.kutu('A08_Cift_kasa',(x,y,floor+1.05),(.085,.16,2.1),wood,.004)
 for face in [-1,1]:o.kutu('A08_Cift_pervaz',(x,y+face*.095,floor+1.07),(.08,.025,2.14),wood,.004)
o.kutu('A08_Cift_ust_kasa',((left+right)/2,y,floor+2.07),(right-left+.085,.16,.085),wood,.004)
for side,angle,hx in [('sol',75,left+.045),('sag',105,right-.045)]:
 hinge=Vector((hx,y,floor+.012));u=Vector((math.cos(math.radians(angle)),math.sin(math.radians(angle)),0));v=Vector((-u.y,u.x,0));w=(right-left-.10)/2;h=2.025
 def box(name,uu,zz,sw,sh):
  ob=o.kutu('A08_Cift_'+side+'_'+name,hinge+u*uu+Vector((0,0,zz)),(sw,.042,sh),wood,.004);ob.rotation_euler.z=math.atan2(u.y,u.x);return ob
 for uu in [.037,w-.037]:box('dikme',uu,h/2,.074,h)
 box('alt',w/2,.075,w,.15);box('ust',w/2,h-.055,w,.11)
 verts=[hinge+u*uu+Vector((0,0,z)) for uu,z in [(.074,.15),(w-.074,.15),(w-.074,h-.11),(.074,h-.11)]];ob=o.mesh('A08_Cift_'+side+'_cam',verts,[(0,1,2,3)],glass);uv=ob.data.uv_layers.new(name='UVMap')
 for li,co in zip(ob.data.polygons[0].loop_indices,[(0,0),(1,0),(1,1),(0,1)]):uv.data[li].uv=co
 for z in [.23,1,1.8]:o.boru('A08_Cift_'+side+'_mentese',[hinge+Vector((0,0,z-.035)),hinge+Vector((0,0,z+.035))],.009,brass)
 q=hinge+u*(w-.045)+v*.035+Vector((0,0,.98));o.boru('A08_Cift_'+side+'_kol',[q,q+v*.04,q+v*.04-u*.07],.008,brass)
# Smooth revolved shades and black curved arms, photo13/17 one shared fixture.
black=o.malzeme('A08_Siyah_spot',(.014,.015,.017),.33,.65);opal=o.malzeme('A08_Sicak_opal',(.9,.86,.75),.25);bs=opal.node_tree.nodes.get('Principled BSDF');bs.inputs['Emission Color'].default_value=(1,.84,.64,1);bs.inputs['Emission Strength'].default_value=3

def lathe(name,pos,profile,mat,axis=None):
 vs=[(r*math.cos(j*2*math.pi/48),r*math.sin(j*2*math.pi/48),z) for r,z in profile for j in range(48)];fs=[(k*48+j,k*48+(j+1)%48,(k+1)*48+(j+1)%48,(k+1)*48+j) for k in range(len(profile)-1) for j in range(48)];ob=o.mesh(name,vs,fs,mat);ob.location=pos
 if axis:ob.rotation_euler=Vector(axis).to_track_quat('Z','Y').to_euler()
 for f in ob.data.polygons:f.use_smooth=True
 return ob
center=Vector((-.45,-3.0,8.94));lathe('A08_F13_17_rozet',center,[(0,0),(.075,0),(.075,-.025),(0,-.025)],black)
for k in range(3):
 a=k*2*math.pi/3;end=center+Vector((.26*math.cos(a),.26*math.sin(a),-.30));pts=[center+Vector((.26*math.cos(a)*t,.26*math.sin(a)*t,-.025-.275*t*t)) for t in [j/20 for j in range(21)]];o.boru('A08_F13_17_kol',pts,.012,black);lathe('A08_F13_17_spot',end,[(.022,.045),(.027,0),(.061,-.095),(.064,-.105),(.053,-.112)],black);lathe('A08_F13_17_ampul',end,[(.047,-.110),(.040,-.125),(0,-.132)],opal)
# Attic WC wall sconce, physically emitting glass; render helper also adds its light.
lathe('A08_F06_aplik_rozet',(.05,5.98,11.36),[(0,0),(.06,0),(.06,.018),(0,.02)],black,(1,0,0));o.boru('A08_F06_aplik_kol',[(.05,5.98,11.36),(.20,5.98,11.36),(.24,5.98,11.43)],.012,black);lathe('A08_F06_opal',(.24,5.98,11.43),[(.03,-.03),(.065,0),(.078,.09),(.04,.13),(0,.13)],opal)
# Cream rectangle/border already exists in the base model: its separate WHT floor material is handled in texture specs.
boxes=json.loads((o.W/'silme-kutulari.json').read_text(encoding='utf-8'));boxes=[b for b in boxes if not b['ad'].startswith('A08_')];boxes.append({'ad':'A08_F13_17_eski_abajur','katman':'mobilya','min':[-.9,-3.5,8.0],'max':[.05,-2.5,9.1],'malzemeler':['ROUGHNSS1'],'not':'Ölçülen düşük poligonlu sarkıt yerine foto13/17 üç kollu siyah armatür.'});(o.W/'silme-kutulari.json').write_text(json.dumps(boxes,ensure_ascii=False,indent=1),encoding='utf-8')
o.bitir('A08',{'tek_korkuluk':'foto18/34 ortak prototype mesh','galeri18':'yakın kenar eklendi','kapilar':'11 tam açık, 40 çift menteşeli iki kanat','armatürler':[13,17,6],'merdiven_alti':'bodrum ikinci kol dolu; sağ duvar kapatıldı'})
