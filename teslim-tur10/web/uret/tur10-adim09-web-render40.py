import bpy,json,csv,math,re,numpy as np
from pathlib import Path
from mathutils import Vector,Euler
W=Path(r'C:\Users\yigit\angora-tur10');R=Path(r'C:\Users\yigit\Downloads\angora-main (2)\angora-main');D=Path(r'C:\Users\yigit\angora-git\teslim-tur10\web');C=W/'adim09/web-calisma';O=C/'reload';O.mkdir(exist_ok=True)
def bounds(ob):
 a=np.empty(len(ob.data.vertices)*3,np.float32);ob.data.vertices.foreach_get('co',a);a=a.reshape(-1,3);m=np.array(ob.matrix_world);a=a@m[:3,:3].T+m[:3,3];return np.array([a.min(0),a.max(0)])
bpy.ops.wm.open_mainfile(filepath=str(C/'web-hazir.blend'))
expected={}
for ob in bpy.context.scene.objects:
 if ob.type!='MESH' or not len(ob.data.vertices):continue
 key=ob.get('kaynak_grup','EKLER')+'|'+ob.get('kaynak_nesne',ob.name);bb=bounds(ob)
 if key in expected:bb=np.array([np.minimum(bb[0],expected[key][0]),np.maximum(bb[1],expected[key][1])])
 expected[key]=bb
bpy.ops.wm.read_factory_settings(use_empty=True);scene=bpy.context.scene
for f in ['BUILDING-opt-v6-alt.glb','BUILDING-opt-v6-ust.glb','INTERIOR-opt-v3.glb']:bpy.ops.import_scene.gltf(filepath=str(D/f))
actual={}
for ob in scene.objects:
 if ob.type!='MESH' or not len(ob.data.vertices):continue
 key=ob.get('kaynak_grup','EKLER')+'|'+ob.get('kaynak_nesne',ob.name);bb=bounds(ob)
 if key in actual:bb=np.array([np.minimum(bb[0],actual[key][0]),np.maximum(bb[1],actual[key][1])])
 actual[key]=bb
check=[]
for key,bb in expected.items():
 delta=float(np.max(np.abs(bb-actual[key]))) if key in actual else None;check.append(dict(nesne=key,fark_m=delta,gecerli=delta is not None and delta<=.001))
report=json.loads((D/'web-kontrol.json').read_text(encoding='utf-8'));report['geri_yukleme_sinir_kontrol']=check;report['geri_yukleme_gecerli']=all(x['gecerli'] for x in check)
(D/'web-kontrol.json').write_text(json.dumps(report,ensure_ascii=False,indent=1),encoding='utf-8');print('[web] BOUNDS',len(check),'pass',report['geri_yukleme_gecerli'],'max',max(x['fark_m'] or 0 for x in check),flush=True)
with bpy.data.libraries.load(str(W/'adim09/kontrol-sahne.blend'),link=False) as (src,dst):
 dst.worlds=['Gok'];dst.objects=[n for n in src.objects if n in [x['ad'] for x in json.loads((D/'isiklar-v2.json').read_text(encoding='utf-8'))['isiklar']]]
scene.world=dst.worlds[0]
for ob in dst.objects:
 if ob and ob.type=='LIGHT':scene.collection.objects.link(ob)
scene.render.engine='CYCLES';scene.cycles.samples=64;scene.cycles.use_denoising=True;scene.cycles.denoiser='OPENIMAGEDENOISE';scene.cycles.max_bounces=8;scene.cycles.diffuse_bounces=4
prefs=bpy.context.preferences.addons['cycles'].preferences;prefs.compute_device_type='OPTIX';prefs.get_devices()
for dev in prefs.devices:dev.use=dev.type=='OPTIX'
scene.cycles.device='GPU';scene.view_settings.view_transform='AgX';scene.view_settings.look='None'
cd=bpy.data.cameras.new('WebKontrol');cam=bpy.data.objects.new('WebKontrol',cd);scene.collection.objects.link(cam);scene.camera=cam;cd.sensor_fit='HORIZONTAL';cd.clip_start=.05
cams={int(r['id']):r for r in csv.DictReader(open(R/'docs/blender-ajan/foto-kameralari.csv',encoding='utf-8'))};fix=json.loads((W/'kamera-duzeltme.json').read_text(encoding='utf-8'))
exposures={int(a):float(b) for a,b in re.findall(r'\[kontrol\] render (\d+) pozlama ([-\d.]+)',(W/'adim09-kontrol-son.log').read_text(encoding='utf-8'))}
for f in [40]:
 c=cams[f];fx=fix.get(str(f),{});cam.location=Vector(tuple(float(c['blender_'+a])+fx.get('d'+a,0) for a in 'xyz'));look=Vector((float(c['bakis_x']),float(c['bakis_y']),0)).normalized();yaw=math.atan2(look.y,look.x)+math.radians(fx.get('yaw',0));pitch=math.radians(fx.get('pitch',0));cam.rotation_euler=Euler((math.pi/2+pitch,0,yaw-math.pi/2),'XYZ');cd.angle=math.radians(fx.get('hfov',80))
 im=bpy.data.images.load(str(R/c['dosya']));pw,ph=im.size;bpy.data.images.remove(im);scene.render.resolution_x=1200;scene.render.resolution_y=int(1200*ph/pw);scene.render.resolution_percentage=100;scene.view_settings.exposure=exposures[f];scene.render.filepath=str(O/f'render_{f:02d}.png');bpy.ops.render.render(write_still=True);print('[web] render',f,'exposure',exposures[f],flush=True)
print('[web] TAMAM 5',flush=True)

