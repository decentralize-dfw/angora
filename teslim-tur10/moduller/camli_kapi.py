"""M3G — foto 40 giriş geçişinin gül desenli camlı kapısı ve ceviz kasası."""
import sys,math
from pathlib import Path
sys.path.insert(0,str(Path(__file__).parent))
import ortak as o
from mathutils import Vector
o.basla('M3G_')
wood=o.malzeme('M3_Koyu_ceviz_kapi',(.035,.023,.015),.45)
brass=o.malzeme('M3G_Pirinc',(.42,.29,.10),.28,.8)
glass=o.malzeme('M3G_Foto40_gul_desenli_cam',(.6,.55,.45),.22)
import bpy
nt=glass.node_tree;bs=nt.nodes.get('Principled BSDF');tex=nt.nodes.get('Foto40') or nt.nodes.new('ShaderNodeTexImage');tex.name='Foto40';tex.image=bpy.data.images.load(str(o.W/'doku-inceleme/cam40.png'),check_existing=True)
nt.links.new(tex.outputs['Color'],bs.inputs['Base Color']);nt.links.new(tex.outputs['Alpha'],bs.inputs['Alpha']);glass.surface_render_method='DITHERED'
floor=3.0996;left=1.25;right=2.57;y=-1.775
for x in [left,right]:
 o.kutu('M3G_Kasa',(x,y,floor+1.05),(.085,.16,2.1),wood,.004)
 for face in [-1,1]:o.kutu('M3G_Pervaz',(x,y+face*.095,floor+1.07),(.08,.025,2.14),wood,.004)
o.kutu('M3G_Ust_kasa',((left+right)/2,y,floor+2.07),(right-left+.085,.16,.085),wood,.004)
for face in [-1,1]:o.kutu('M3G_Ust_pervaz',((left+right)/2,y+face*.095,floor+2.1),(right-left+.10,.025,.075),wood,.004)
u=Vector((-math.cos(math.radians(65)),-math.sin(math.radians(65)),0));v=Vector((-u.y,u.x,0));hinge=Vector((right-.045,y,floor+.012));w=right-left-.09;h=2.025
def box(name,uu,vv,zz,sw,sd,sh):
 ob=o.kutu('M3G_'+name,hinge+u*uu+v*vv+Vector((0,0,zz)),(sw,sd,sh),wood,.004);ob.rotation_euler.z=math.atan2(u.y,u.x);return ob
for uu in [.048,w-.048]:box('Kanat_dikme',uu,0,h/2,.096,.041,h)
box('Kanat_alt',w/2,0,.09,w,.041,.18);box('Kanat_ust',w/2,0,h-.065,w,.041,.13)
lo=.18;hi=h-.13
vs=[hinge+u*uu+Vector((0,0,z)) for uu,z in [(.095,lo),(w-.095,lo),(w-.095,hi),(.095,hi)]]
ob=o.mesh('M3G_Floral_cam',vs,[(0,1,2,3)],glass);uv=ob.data.uv_layers.new(name='UVMap')
for loop,co in zip(ob.data.polygons[0].loop_indices,[(0,0),(1,0),(1,1),(0,1)]):uv.data[loop].uv=co
for z in [lo+(hi-lo)*k/5 for k in range(1,5)]:box('Cam_ara_cita',w/2,0,z,w-.17,.045,.025)
for face in [-1,1]:
 q=hinge+u*(w-.055)+v*(face*.032)+Vector((0,0,.99))
 o.boru('M3G_Kol',[q,q+v*(face*.035),q+v*(face*.035)-u*.095],.009,brass)
for z in [.22,1.,1.80]:
 q=hinge+Vector((0,0,z));o.boru('M3G_Mentese',[q-Vector((0,0,.035)),q+Vector((0,0,.035))],.010,brass)
o.bitir('M3G',{'foto':40,'yer':'Antre giriş geçişi','kasa_olcusu_m':[right-left,2.1],'kanat_acisi':65,'emin_degil':'Açıklık model kesitinden; cam motifi gerçek foto 40 perspektif dönüşümü.'})
