import bpy,json,csv,math,re,sys
from pathlib import Path
from mathutils import Vector,Euler
W=Path(r'C:\Users\yigit\angora-tur10');R=Path(r'C:\Users\yigit\Downloads\angora-main (2)\angora-main');A=W/'adim10';args=sys.argv[sys.argv.index('--')+1:];bpy.ops.wm.open_mainfile(filepath=args[0]);scene=bpy.context.scene;O=Path(args[1]);O.mkdir(exist_ok=True,parents=True);fotos=[int(x) for x in args[2].split(',')]
scene.render.engine='CYCLES';scene.cycles.samples=64;scene.cycles.use_denoising=True;scene.cycles.denoiser='OPENIMAGEDENOISE';scene.cycles.max_bounces=8;scene.cycles.diffuse_bounces=4
prefs=bpy.context.preferences.addons['cycles'].preferences;prefs.compute_device_type='OPTIX';prefs.get_devices()
for d in prefs.devices:d.use=d.type=='OPTIX'
scene.cycles.device='GPU';scene.view_settings.view_transform='AgX';scene.view_settings.look='None';cam=scene.camera;cd=cam.data
cams={int(r['id']):r for r in csv.DictReader(open(R/'docs/blender-ajan/foto-kameralari.csv',encoding='utf-8'))};fix=json.loads((W/'kamera-duzeltme.json').read_text(encoding='utf-8'));exposures={int(a):float(b) for a,b in re.findall(r'\[kontrol\] render (\d+) pozlama ([-\d.]+)',(W/'adim09-kontrol-son.log').read_text(encoding='utf-8'))}
for f in fotos:
 c=cams[f];fx=fix.get(str(f),{});cam.location=Vector(tuple(float(c['blender_'+a])+fx.get('d'+a,0) for a in 'xyz'));look=Vector((float(c['bakis_x']),float(c['bakis_y']),0)).normalized();yaw=math.atan2(look.y,look.x)+math.radians(fx.get('yaw',0));cam.rotation_euler=Euler((math.pi/2+math.radians(fx.get('pitch',0)),0,yaw-math.pi/2),'XYZ');cd.angle=math.radians(fx.get('hfov',80));im=bpy.data.images.load(str(R/c['dosya']));pw,ph=im.size;bpy.data.images.remove(im);scene.render.resolution_x=1200;scene.render.resolution_y=int(1200*ph/pw);scene.render.resolution_percentage=100;scene.view_settings.exposure=exposures[f];scene.render.filepath=str(O/f'render_{f:02d}.png');bpy.ops.render.render(write_still=True);print('[A10] render',f,flush=True)
