"""Static room reflection captures, using the authored scene and verified walk stations."""
import bpy,json,math
from pathlib import Path
ROOT=Path(__file__).resolve().parents[2];OUT=ROOT/'build/web/batched/lighting'
scene=bpy.context.scene;scene.render.engine='CYCLES';scene.cycles.samples=64
scene.cycles.use_denoising=True;scene.cycles.max_bounces=8;scene.cycles.diffuse_bounces=4
prefs=bpy.context.preferences.addons['cycles'].preferences;prefs.compute_device_type='OPTIX';prefs.get_devices()
for d in prefs.devices:d.use=d.type=='OPTIX'
scene.cycles.device='GPU'
camera=bpy.data.cameras.new('Reflection capture');camera.type='PANO';camera.panorama_type='EQUIRECTANGULAR'
obj=bpy.data.objects.new('Reflection capture',camera);scene.collection.objects.link(obj);scene.camera=obj
obj.rotation_euler=(math.pi/2,0,-math.pi/2)
scene.render.resolution_percentage=100;scene.render.image_settings.file_format='HDR'
scene.view_settings.view_transform='Standard';scene.view_settings.look='None';scene.view_settings.exposure=0;scene.view_settings.gamma=1
stations=json.loads((ROOT/'build/web/native-current/native-navigation.json').read_text())['stations']
report=[]
for floor in range(4):
 candidates=[s for s in stations if s['floor_index']==floor]
 station=next((s for s in candidates if s['name'] in ['Salon','Oturma alanı']),candidates[0])
 x,y,z=station['position'];obj.location=(x,-z,y)
 for profile,width in [('desktop',512),('mobile',256)]:
  scene.render.resolution_x=width;scene.render.resolution_y=width//2
  file=f'room-probe-{floor}-{profile}.hdr';scene.render.filepath=str(OUT/file)
  print('PROBE_START',floor,profile,flush=True);bpy.ops.render.render(write_still=True)
  report.append({'floor':floor,'profile':profile,'file':file,'position':station['position'],'room':station['name'],'width':width})
  (OUT/'room-probes.json').write_text(json.dumps(report,indent=2))
print('PROBES_COMPLETE',flush=True)
