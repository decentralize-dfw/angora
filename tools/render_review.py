"""Render selected existing cameras without changing the saved model.

Example: blender scene.blend --python tools/render_review.py -- --samples 32
    --width 1200 01_front 06_master_bedroom
"""
import bpy,sys,argparse,json,time
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
p=argparse.ArgumentParser();p.add_argument('--samples',type=int,default=32);p.add_argument('--width',type=int,default=1200)
p.add_argument('cameras',nargs='+');args=p.parse_args(sys.argv[sys.argv.index('--')+1:])
scene=bpy.context.scene;scene.cycles.samples=args.samples
scene.render.image_settings.file_format='PNG';scene.render.resolution_percentage=100
folder=ROOT/'build/renders';folder.mkdir(parents=True,exist_ok=True)
for name in args.cameras:
    cam=bpy.data.objects.get(name)
    assert cam and cam.type=='CAMERA',name
    scene.camera=cam;scene.render.resolution_x=args.width
    scene.render.resolution_y=round(args.width*(600/1440 if cam.data.type=='PANO' else .75))
    scene.render.filepath=str(folder/(name+'.png'));started=time.time()
    bpy.ops.render.render(write_still=True)
    print('REVIEW_RENDER',json.dumps({'camera':name,'seconds':round(time.time()-started,2),'samples':args.samples}),flush=True)
