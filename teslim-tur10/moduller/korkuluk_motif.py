"""Adım08: foto18/34 ortak motif, tek mesh prototipinden kopyalar."""
import math
from mathutils import Vector,Matrix
PROTO=None
PARAM={k:{'foto':[18,34],'tekrar_m':.28,'ana_yaricap_m':.05,'dikme_m':1.25} for k in ['bodrum','giris','birinci','cati']}
def prototype(o,iron):
 global PROTO
 if PROTO:return PROTO
 parts=[];w=.28
 def stroke(points,r=.006):parts.append(o.boru('A08_gecici_motif',[(x,0,z) for x,z in points],r,iron))
 for sign in [-1,1]:
  stroke([(w/2+sign*w*(.10+.31*math.sin(2*math.pi*j/40)),.13+.68*j/40) for j in range(41)])
  for h in [.30,.50,.69]:
   cx=w/2+sign*.043;rad=.045
   stroke([(cx+sign*rad*(1-j/32*.80)*math.cos(math.pi+j/32*math.pi*2),h+rad*(1-j/32*.80)*math.sin(math.pi+j/32*math.pi*2)) for j in range(33)],.005)
 for h in [.105,.835]:
  for x in [.07,.21]:stroke([(x+.038*(1-j/24*.8)*math.cos(j/24*math.pi*2),h+.038*(1-j/24*.8)*math.sin(j/24*math.pi*2)) for j in range(25)],.0045)
 vs=[];fs=[]
 import bpy
 for ob in parts:
  off=len(vs);vs.extend([tuple(ob.matrix_world@v.co) for v in ob.data.vertices]);fs.extend([tuple(off+i for i in f.vertices) for f in ob.data.polygons]);bpy.data.objects.remove(ob,do_unlink=True)
 ob=o.mesh('A08_motif_prototip',vs,fs,iron);PROTO=ob.data;PROTO.use_fake_user=True;bpy.data.objects.remove(ob,do_unlink=True);return PROTO
def yap(o,tag,p,length,variant,iron,hand,brass):
 import bpy
 mesh=prototype(o,iron)
 o.boru(tag+'_kupeste',[p(0,.96),p(length,.96)],.032,hand)
 for h in [.07,.88]:o.boru(tag+'_cerceve',[p(0,h),p(length,h)],.010,iron)
 posts=max(1,round(length/1.25))
 for i in range(posts+1):
  t=length*i/posts;o.boru(tag+'_dikme',[p(t,-.035),p(t,.96)],.014,iron);o.kutu(tag+'_ayak',p(t,.012),(.055,.055,.024),iron,.003)
 count=max(1,int(length/.28));w=min(.28,length);margin=(length-count*w)/2
 for k in range(count):
  t=margin+k*w;origin=Vector(p(t,0));ex=(Vector(p(t+w,0))-origin)/.28;ez=Vector(p(t,1))-origin;ey=Vector((-ex.y,ex.x,0)).normalized()
  ob=bpy.data.objects.new(tag+'_ortak_CS_motif',mesh);o.C.objects.link(ob);ob.matrix_world=Matrix(((ex.x,ey.x,ez.x,origin.x),(ex.y,ey.y,ez.y,origin.y),(ex.z,ey.z,ez.z,origin.z),(0,0,0,1)));ob['kaynak_foto']='18/34';ob['tek_tasarim']=True
