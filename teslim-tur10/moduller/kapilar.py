"""M3. Modelde ölçülen panel kapı kasaları; foto 17/47 altı panelli kanat.
Kapı başına kasa, çift yüz pervaz, kanat, altı göbek, üç menteşe, pirinç topuz.
"""
import sys,math,json
from pathlib import Path
sys.path.insert(0,str(Path(__file__).parent))
import ortak as o
from mathutils import Vector
o.basla('M3_')
wood=o.malzeme('M3_Koyu_ceviz_kapi',(.067,.028,.012),.36)
panel=o.malzeme('M3_Ceviz_gobek',(.080,.035,.016),.38)
brass=o.malzeme('M3_Pirinc_donanim',(.39,.25,.09),.25,.85)
threshold=o.malzeme('M3_Krem_karo_esik',(.55,.49,.39),.48)
steel=o.malzeme('M3_Saten_paslanmaz_kulp',(.43,.45,.46),.28,.8)
black=o.malzeme('M3_Garaj_siyah_kulp',(.018,.018,.018),.45,.3)
d=json.loads((o.W/'mimari-olcum.json').read_text(encoding='utf-8'))['parcalar']
frames=[p for p in d if p['mat']==['WOODY-DARK.001'] and p['nv'] in [44,55] and 2.09<p['max'][2]-p['min'][2]<2.12]
leaves=[p for p in d if p['mat']==['WOODY-DARK.001'] and p['nv']==280 and 1.95<p['max'][2]-p['min'][2]<2.02]
frames += [p for p in d if p['mat']==['WOODY-DARK.001'] and p['nv']==757 and p['min'][1]<-4 and 3<p['min'][2]<3.2]
leaves += [p for p in d if p['mat']==['WOODY-DARK.001'] and p['nv']==741 and p['min'][1]<-4 and 3<p['min'][2]<3.2]
boxes=json.loads((o.W/'silme-kutulari.json').read_text(encoding='utf-8'));boxes=[b for b in boxes if not b['ad'].startswith('M3_')]
records=[]
def localbox(name,c,ux,uy,u,v,z,su,sv,sz,mat,pah=.004):
 pos=c+ux*u+uy*v+Vector((0,0,z));ob=o.kutu(name,pos,(su,sv,sz),mat,pah);ob.rotation_euler.z=math.atan2(ux.y,ux.x);return ob
for i,fr in enumerate(frames):
 lo,hi=Vector(fr['min']),Vector(fr['max']);center=(lo+hi)/2;size=hi-lo;floor=lo.z
 lf=min(leaves,key=lambda q:abs(q['min'][2]-floor)*10+(Vector(q['min'])-lo).length)
 tag=f'M3_{i+1:02}';axis=0 if size.x>size.y else 1
 angle=0 if axis==0 else math.pi/2
 if .5<size.x<.8 and .5<size.y<.8:angle=-math.pi/4
 ux=Vector((math.cos(angle),math.sin(angle),0));uy=Vector((-ux.y,ux.x,0));c=Vector((center.x,center.y,floor))
 width=max(size.x,size.y) if abs(angle)!=math.pi/4 else .955
 for side in [-1,1]:
  localbox(tag+'_kasa',c,ux,uy,side*(width/2-.025),0,1.015,.05,.15,2.03,wood)
  for face in [-1,1]:localbox(tag+'_pervaz',c,ux,uy,side*(width/2-.035),face*.089,1.05,.07,.019,2.1,wood)
 localbox(tag+'_ust_kasa',c,ux,uy,0,0,2.045,width,.15,.06,wood)
 for face in [-1,1]:localbox(tag+'_ust_pervaz',c,ux,uy,0,face*.089,2.065,width,.019,.07,wood)
 localbox(tag+'_esik_doseme',c,ux,uy,0,0,-.022,width-.07,max(.60,min(size.x,size.y)+.1),.045,threshold if floor<3.2 else wood,.002)
 if i+1==10:
  # Foto 42 kapı arkası: ray ölçümünde x=3.2..3.8 döşeme z=2.7,
  # iki taraftaki normal döşeme z=3.0998. Bu çökük şeridi kapat.
  o.kutu(tag+'_doseme_boslugu',(3.5,center.y,3.0773),(1.05,width-.055,.045),threshold,.002)
 a,b=Vector(lf['min']),Vector(lf['max']);lc=(a+b)/2;ls=b-a;la=0 if ls.x>ls.y else math.pi/2
 if ls.x>.3 and ls.y>.3:la=math.pi/4
 # Foto 17: kanat sağ pervaza bağlı, oda içine açılıyor.
 flip107=abs(floor-6.3713)<.01 and abs(center.y+1.5723)<.05
 if flip107:lc.x=hi.x-.069
 lx=Vector((math.cos(la),math.sin(la),0))
 w=max(ls.x,ls.y) if la!=math.pi/4 else math.hypot(ls.x,ls.y);h=1.992
 # Kanat merkezi serbest taşınmaz: kasanın gerçek menteşe kenarı pivot olur.
 endpoints=[lc-lx*w/2,lc+lx*w/2];jambs=[c+ux*s*(width/2-.074) for s in [-1,1]]
 _,hinge,far=min(((Vector((e.x-j.x,e.y-j.y,0)).length,j,endpoints[1-k]) for k,e in enumerate(endpoints) for j in jambs),key=lambda q:q[0])
 direction=Vector((far.x-hinge.x,far.y-hinge.y,0)).normalized()
 if flip107:hinge=c+ux*(width/2-.074);direction=Vector((0,-1,0))
 # Kat holündeki sağ kapı: foto 18'de kanat tam 90 derece açık değil.
 if abs(floor-6.3713)<.01 and abs(center.x-1.8226)<.08:
  hinge=c+ux*(width/2-.074);direction=Vector((math.sin(math.radians(35)),-math.cos(math.radians(35)),0))
 if i+1 in [11,13]:
  # Foto 44 garaj deposu ve foto 40/41 dış giriş kanadı kapalı.
  direction=ux if (hinge-c).dot(ux)<0 else -ux
 if i+1==13:
  # Kapalı dış kapının kasadaki bini payı ışık yarığını örter.
  w=width-.10;h=2.012
  for side in [-1,1]:localbox(tag+'_kasa_bini',c,ux,uy,side*(width/2-.065),-.038,1.015,.075,.03,2.03,wood,.002)
  localbox(tag+'_ust_bini',c,ux,uy,0,-.038,2.018,width-.08,.03,.075,wood,.002)
 lx=direction;ly=Vector((-lx.y,lx.x,0));lc=hinge+lx*w/2;lc.z=floor+.008
 localbox(tag+'_kanat',lc,lx,ly,0,0,h/2,w,.037,h,wood,.005)
 # 2 x 3 paneller: kısa üst, uzun orta, orta boy alt.
 columns=[0] if i+1==1 else [-1,1]
 if i+1==11:columns=[]  # Foto 44: garaj deposu düz kanat, siyah kol.
 for face in [-1,1]:
  for col in columns:
   for low,high in [(.15,.61),(.79,1.49),(1.66,1.86)]:
    pc=col*w*.235;pw=w*(.75 if col==0 else .36);zh=(low+high)/2
    localbox(tag+'_gobek',lc,lx,ly,pc,face*.023,zh,pw,.014,high-low,panel,.009)
    for sign in [-1,1]:
     localbox(tag+'_dik_profil',lc,lx,ly,pc+sign*(pw/2+.012),face*.032,zh,.018,.015,high-low+.045,wood,.004)
     localbox(tag+'_yatay_profil',lc,lx,ly,pc,face*.032,zh+sign*((high-low)/2+.012),pw+.045,.015,.018,wood,.004)
  hc=lc+lx*(w/2-.085)+ly*(face*.045)+Vector((0,0,.96))
  if i+1 in [1,5,11,13]:
   hm=steel if i+1==1 else (brass if i+1==13 else black)
   o.boru(tag+'_kulp',[hc,hc+ly*(face*.045),hc+ly*(face*.045)-lx*.11],.010,hm)
   continue
  o.boru(tag+'_topuz_mili',[hc, hc+ly*(face*.035)],.010,brass)
  # Elips döndürülmüş basık küre: topuz; ölçü fotoğraftaki ~5 cm.
  import bpy
  bpy.ops.mesh.primitive_uv_sphere_add(segments=20,ring_count=10,radius=.026,location=hc+ly*(face*.040));ob=bpy.context.object
  for coll in list(ob.users_collection):coll.objects.unlink(ob)
  o.C.objects.link(ob);ob.name=tag+'_pirinc_topuz';ob.data.materials.append(brass);ob.select_set(False)
 for z in [.22,1.0,1.78]:
  hc=lc-lx*(w/2)+Vector((0,0,z));o.boru(tag+'_mentese',[hc-Vector((0,0,.034)),hc+Vector((0,0,.034))],.009,brass)
 for kind,q in [('kasa',fr),('kanat',lf)]:
  boxes.append({'ad':tag+'_'+kind,'katman':'mimari','min':[v-.006 for v in q['min']],'max':[v+.006 for v in q['max']],'malzemeler':['WOODY-DARK.001']})
 boxes.append({'ad':tag+'_eski_topuz_mentese','katman':'mobilya','min':[v-.14 for v in lf['min']],'max':[v+.14 for v in lf['max']],'malzemeler':['brass (4)']})
 records.append({'no':i+1,'kasa':fr,'kanat':lf,'genislik':w,'mentese':[round(v,4) for v in hinge],'acik_yon':[round(v,4) for v in direction]})
(o.W/'silme-kutulari.json').write_text(json.dumps(boxes,ensure_ascii=False,indent=1),encoding='utf-8')
(o.W/'kapi-yerlesimleri.json').write_text(json.dumps(records,ensure_ascii=False,indent=1),encoding='utf-8')
o.bitir('M3',{'toplam_kapi':len(frames),'panel_kapi':len(frames)-1,'duz_kapi':1,'panel_duzeni':'01: 1×3; 11: düz; diğerleri: 2×3','camli_kapi':'mevcut cam ve floral desen korundu'})
