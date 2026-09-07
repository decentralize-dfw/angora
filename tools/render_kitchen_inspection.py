"""Inspection cameras only; does not save or modify the native scene."""
import bpy,sys,time,json,hashlib
from pathlib import Path
from mathutils import Vector
ROOT=Path(__file__).resolve().parents[1]
angle=sys.argv[sys.argv.index('--')+1];scene=bpy.context.scene
settings={'sink':((-3.03,-1.97,4.69),(-5.20,-1.80,4.40),22),
          'vitrine':((-2.18,-2.45,4.66),(.85,-2.66,4.48),24)}
eye,target,lens=settings[angle];data=bpy.data.cameras.new('Kitchen inspection');obj=bpy.data.objects.new('Kitchen inspection',data);scene.collection.objects.link(obj)
obj.location=eye;obj.rotation_euler=(Vector(target)-obj.location).to_track_quat('-Z','Y').to_euler();data.lens=lens;scene.camera=obj
scene.cycles.samples=20;scene.cycles.use_denoising=True;scene.render.resolution_x=1000;scene.render.resolution_y=800;scene.render.resolution_percentage=100
scene.render.image_settings.file_format='PNG';scene.render.filepath=str(ROOT/'build/renders'/('kitchen-'+angle+'-review.png'))
started=time.time();bpy.ops.render.render(write_still=True)
p=ROOT/'build/renders'/('kitchen-'+angle+'-review.json');p.write_text(json.dumps({'image':scene.render.filepath,'source_file':bpy.data.filepath,
 'source_sha256':hashlib.sha256(Path(bpy.data.filepath).read_bytes()).hexdigest(),'camera_position':eye,'camera_target':target,'lens_mm':lens,
 'samples':20,'seconds':round(time.time()-started,2),'inspection_only':True,'photo_matching_complete':False},indent=2))
