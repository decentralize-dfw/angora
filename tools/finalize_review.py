"""Set source-photo camera framing and render the current review checkpoint."""
import bpy,sys,json
from pathlib import Path
from mathutils import Vector
ROOT=Path(__file__).resolve().parents[1]
scene=bpy.context.scene
c=bpy.data.objects['01_front'];c.location=(23,-33,17);c.data.lens=48
c.rotation_euler=(Vector((.5,-1,5.5))-c.location).to_track_quat('-Z','Y').to_euler()
scene.render.resolution_x=1200;scene.render.resolution_y=900;scene.cycles.samples=32
scene.camera=bpy.data.objects['02_pool']
scene['completion_status']='work_in_progress';scene['publication_ready']=False
scene['review_notes']='Native CAD recovery; further source-to-photo alignment, surfaces, materials, site and room measurements require review.'
bpy.ops.wm.save_as_mainfile(filepath=str(ROOT/'build/blender/angora21-working.blend'),compress=True)
for name in ['01_front','02_pool','05_main_lounge','06_master_bedroom']:
    scene.camera=bpy.data.objects[name];scene.render.filepath=str(ROOT/'build/renders'/f'{name}.png')
    bpy.ops.render.render(write_still=True);print('RENDERED_FINAL_REVIEW',name,flush=True)
