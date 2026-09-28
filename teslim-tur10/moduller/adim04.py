"""Adım04: fotoğrafa özel armatürler, devreden yerel mimari düzeltmeler."""
import sys,math,json,bmesh
from pathlib import Path
sys.path.insert(0,str(Path(__file__).parent))
import ortak as o
import bpy
from mathutils import Vector
o.basla('A04_')
white=o.malzeme('A04_Opal_cam',(.85,.81,.72),.3)
p=white.node_tree.nodes.get('Principled BSDF');p.inputs['Emission Color'].default_value=(1,.79,.52,1);p.inputs['Emission Strength'].default_value=2.5
plaster=o.malzeme('M1_Beyaz_saten_alci',(.82,.79,.72),.73)
brass=o.malzeme('A04_Eskitme_pirinc',(.26,.18,.07),.32,.8)
black=o.malzeme('A04_Siyah_zincir',(.023,.02,.016),.36,.65)
def lathe(name,center,profile,mat,n=32):
 vs=[(center[0]+r*math.cos(j*2*math.pi/n),center[1]+r*math.sin(j*2*math.pi/n),center[2]+z) for r,z in profile for j in range(n)]
 fs=[(k*n+j,k*n+(j+1)%n,(k+1)*n+(j+1)%n,(k+1)*n+j) for k in range(len(profile)-1) for j in range(n)]
 ob=o.mesh('A04_'+name,vs,fs,mat)
 for f in ob.data.polygons:f.use_smooth=True
 return ob
def plaf(name,x,y,z,r=.18):
 lathe(name+'_rozet',(x,y,z),[(0,0),(r*.87,0),(r,-.025),(r,-.045),(r*.90,-.055),(0,-.055)],brass)
 lathe(name+'_opal',(x,y,z),[(r*.85,-.051),(r*.77,-.105),(r*.56,-.15),(r*.12,-.177),(0,-.18)],white)
 lathe(name+'_topuz',(x,y,z),[(0,-.177),(.019,-.184),(.012,-.212),(0,-.22)],brass,16)
plaf('F18_plafonyer',-.25,-.65,8.97,.19)
plaf('F40_plafonyer',1.38,-.73,5.87,.19)
# Foto42: üç bağımsız yönlendirilebilir opal spot, ince ortak ray.
o.kutu('A04_F42_spot_ray',(1.65,.40,5.865),(.67,.055,.025),brass,.008)
for i in range(3):
 x=1.65+(i-1)*.26
 o.boru('A04_F42_spot_mafsal',[(x,.40,5.85),(x,.40,5.77),(x,.44,5.73)],.012,brass)
 lathe('F42_spot',(x,.44,5.73),[(.027,0),(.053,-.07),(.058,-.09),(.047,-.096),(0,-.098)],white,24)
def applique(name,pos,normal):
 pos=Vector(pos);n=Vector(normal);up=Vector((0,0,1));side=n.cross(up)
 q=pos+n*.03
 o.boru('A04_'+name+'_rozet',[q-up*.055,q+up*.055],.046,brass)
 pts=[q+n*(.19*math.sin(t*math.pi/2))+up*(-.09*math.sin(t*math.pi)) for t in [i/20 for i in range(21)]]
 o.boru('A04_'+name+'_kol',pts,.012,brass)
 end=q+n*.19
 lathe(name+'_cam',end,[(.024,0),(.055,.045),(.046,.12),(.030,.15),(0,.155)],white,24)
applique('F18_ust_aplik',(4.12,2.82,8.76),(-1,0,0))
applique('F18_alt_aplik',(2.10,.86,6.0),(0,1,0))
# Foto29: iki beyaz yarım küre ve ortadaki aşağı bakan küçük spot.
for i,x in enumerate([-.57,-.32]):
 ob=lathe(f'F29_spot_{i}',(0,0,0),[(0,0),(.06,0),(.055,-.04),(.03,-.065),(0,-.075)],white,24)
 ob.rotation_euler.x=math.pi/2;ob.location=(x,3.515,11.79)
applique('F29_orta_spot',(.47,3.515,11.60),(0,-1,0))
# Aynı merdiven boşluğunun 18/34'te görülen tek zincirli sarkıtı.
cx=.67;cy=.28;top=8.96;bottom=5.55
lathe('F18_34_zincir_tavan',(cx,cy,top),[(0,0),(.09,-.018),(.07,-.055),(.022,-.12)],black,24)
count=round((top-.12-bottom)/.042)
for k in range(count):
 z=top-.14-k*.042;pts=[]
 for j in range(20):
  a=2*math.pi*j/20;u=.012*math.cos(a);zz=.027*math.sin(a)
  pts.append((cx+(u if k%2==0 else 0),cy+(u if k%2 else 0),z+zz))
 o.boru('A04_F18_34_zincir_halka',pts,.0025,black,True)
lathe('F18_34_sarkit',(cx,cy,bottom),[(0,0),(.06,-.05),(.13,-.18),(.15,-.21),(.10,-.26),(0,-.28)],white,32)
o.kutu('A04_F29_sol_kiris',(-.56,2.25,12.03),(.22,2.60,.24),plaster,.005)
# Radyatör, foto40'ın solundaki aynı duvar yüzeyinde 30 cm kaydırılır.
for ob in o.C.objects:
 if ob.name.startswith('M6_Antre') and not ob.get('adim04_tasindi'):
  ob.location.y+=.30;ob['adim04_tasindi']=True
# Eski merdiven BUILDING katmanındadır (GLB materyal tablosuyla doğrulandı).
boxes=json.loads((o.W/'silme-kutulari.json').read_text(encoding='utf-8'))
boxes=[b for b in boxes if not b['ad'].startswith('A04_')]
for b in boxes:
 if b['ad']=='M2_INTERIOR_eski_beyaz_merdiven':b['katman']='mimari';b['not']='Adım04: Simple White Wall BUILDING malzemesidir; katman düzeltildi.'
# Armatürlerin eski kaba modellerini yalnız küçük yerel kutularda gizle.
for name,lo,hi in [('F18_tavan',[-.65,-1.0,8.60],[.15,-.3,9.0]),('F40_tavan',[.98,-1.10,5.45],[1.8,-.3,5.90])]:
 boxes.append({'ad':'A04_'+name,'katman':'mobilya','min':lo,'max':hi})
boxes.append({'ad':'A04_F29_dolap_haric','katman':'mimari','min':[-3.5,2.5,9.48],'max':[-1.95,4.6,10.65],'malzemeler':['WOODY-DARK.001'],'not':'Foto29 ray ölçümü: dolap WOODY-DARK.001 ile BUILDING içinde; mobilya olduğu için gizlendi.'})
# Kasa arkasındaki kaplama bini ve eşik üst kapağı: ışık çizgilerini kapatır.
wood=o.malzeme('M3_Koyu_ceviz_kapi',(.025,.022,.020),.52)
floorwood=o.malzeme('M2_Ceviz_basamak',(.07,.05,.03),.43)
tile=o.malzeme('M3_Krem_karo_esik',(.55,.49,.39),.48)
for rec in json.loads((o.W/'kapi-yerlesimleri.json').read_text(encoding='utf-8')):
 fr=rec['kasa'];lo=Vector(fr['min']);hi=Vector(fr['max']);c=(lo+hi)/2;size=hi-lo;z=lo.z
 angle=0 if size.x>size.y else math.pi/2
 if .5<size.x<.8 and .5<size.y<.8:angle=-math.pi/4
 width=max(size.x,size.y) if abs(angle)!=math.pi/4 else .955
 ux=Vector((math.cos(angle),math.sin(angle),0));uy=Vector((-ux.y,ux.x,0))
 def box(n,u,v,zz,w,d,h,mat):
  q=Vector((c.x,c.y,z+zz))+ux*u+uy*v;ob=o.kutu(f'A04_K{rec["no"]:02}_'+n,q,(w,d,h),mat,.002);ob.rotation_euler.z=angle
 for side in [-1,1]:box('kasa_ic_kaplama',side*(width/2-.06),0,1.01,.082,.24,2.025,wood)
 box('kasa_ust_kaplama',0,0,2.025,width+.02,.24,.065,wood)
 box('esik_kapagi',0,0,.005,width+.015,.66,.018,tile if z<3.2 else floorwood)
# Kartonpiyer uçları: bitişik profil ofset doğrularını kesiştirerek gönye birleşimi.
ends=[]
for ob in o.C.objects:
 if ob.name.startswith('M1_kartonpiyer') and not ob.get('adim04_gonye'):
  k=len(ob.data.vertices)//2
  if k<5:continue
  a=ob.data.vertices[0].co.copy();b=ob.data.vertices[k].co.copy();direction=(b-a).normalized()
  for start,base in [(0,a),(k,b)]:ends.append((ob,k,start,base,direction))
fixed=0
for i,(ob,k,start,base,t) in enumerate(ends):
 choices=[(float((base-b).length),other,kk,ss,b,tt) for other,kk,ss,b,tt in ends if other!=ob and abs(t.dot(tt))<.95 and (base-b).length<.08]
 if not choices:continue
 _,other,kk,ss,b,tt=min(choices,key=lambda v:v[0])
 if kk!=k:continue
 for j in range(k):
  p=ob.data.vertices[start+j].co; q=other.data.vertices[ss+j].co
  det=t.x*tt.y-t.y*tt.x
  if abs(det)<.1:continue
  s=((q.x-p.x)*tt.y-(q.y-p.y)*tt.x)/det
  if abs(s)<.3:p.x+=t.x*s;p.y+=t.y*s
 fixed+=1
for ob in {e[0] for e in ends}:
 bm=bmesh.new();bm.from_mesh(ob.data);bmesh.ops.recalc_face_normals(bm,faces=list(bm.faces));bm.to_mesh(ob.data);bm.free();ob['adim04_gonye']=True
(o.W/'silme-kutulari.json').write_text(json.dumps(boxes,ensure_ascii=False,indent=1),encoding='utf-8')
o.bitir('A04',{'fotolar':[18,34,40,42,29,47],'kartonpiyer_gonye_ucu':fixed,'zincir_halka':count,'not':'Yeni kusurlar bu modüle eklenmeyecek; kontrol sonrası Adım05 listesi.'})
