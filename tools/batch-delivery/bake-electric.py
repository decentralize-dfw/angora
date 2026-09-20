"""Bake full diffuse fixture light on the existing delivery UVs.
Never saves or modifies the source blend. The viewer does not add direct fixture light again on these receivers.
"""
import bpy, json, math, time
import numpy as np
from pathlib import Path
from mathutils import Vector
ROOT=Path(__file__).resolve().parents[2]
OUT=ROOT/'build/web/batched/lighting'
scene=bpy.context.scene
scene.render.engine='CYCLES';scene.cycles.samples=128
scene.cycles.max_bounces=8;scene.cycles.diffuse_bounces=6
prefs=bpy.context.preferences.addons['cycles'].preferences
prefs.compute_device_type='OPTIX';prefs.get_devices()
for device in prefs.devices:device.use=device.type=='OPTIX'
scene.cycles.device='GPU'
scene.world.use_nodes=True
for node in scene.world.node_tree.nodes:
 if node.type=='BACKGROUND':node.inputs['Strength'].default_value=0
for obj in scene.objects:
 if obj.type=='LIGHT':obj.hide_render=True
for material in bpy.data.materials:
 if not material.use_nodes:continue
 for node in material.node_tree.nodes:
  socket=node.inputs.get('Emission Strength') if node.type=='BSDF_PRINCIPLED' else node.inputs.get('Strength') if node.type=='EMISSION' else None
  if socket:
   for link in list(socket.links):material.node_tree.links.remove(link)
   socket.default_value=0
fixtures=json.loads((ROOT/'build/web/native-current/room-lighting.json').read_text())
for item in fixtures:
 light=bpy.data.lights.new('Bake fixture '+item['id'],'AREA')
 light.energy=item['native_area_power_w'];light.color=item['color'];light.shape='DISK';light.size=1.1
 obj=bpy.data.objects.new(light.name,light);scene.collection.objects.link(obj)
 x,y,z=item['position'];obj.location=(x,-z,y-.025)
scene.render.bake.margin=12;scene.render.bake.use_selected_to_active=False
scene.render.bake.use_pass_direct=True;scene.render.bake.use_pass_indirect=True;scene.render.bake.use_pass_color=False
report={'method':'Cycles fixture diffuse direct and indirect, including occlusion; no daylight or albedo','samples':128,'bounces':6,'fixtures':len(fixtures),'maps':[]}
for name,stem in [('interior.001','electric-walls'),('ceiling [imported]','electric-ceiling'),('wood_floor.001','electric-floor')]:
 obj=bpy.data.objects[name];assert obj.data.uv_layers.get('AO_UV')
 size=1024;image=bpy.data.images.new(stem,width=size,height=size,alpha=False,float_buffer=True);image.colorspace_settings.name='Non-Color'
 targets=[]
 for material in obj.data.materials:
  nt=material.node_tree;node=nt.nodes.new('ShaderNodeTexImage');node.image=image;nt.nodes.active=node;targets.append((nt,node))
 bpy.ops.object.select_all(action='DESELECT');obj.hide_set(False);obj.select_set(True);bpy.context.view_layer.objects.active=obj
 started=time.time();print('ELECTRIC_START',name,flush=True)
 bpy.ops.object.bake(type='DIFFUSE',uv_layer='AO_UV')
 pixels=np.empty(size*size*4,np.float32);image.pixels.foreach_get(pixels);pixels=pixels.reshape(size,size,4)
 rgb=np.maximum(np.nan_to_num(pixels[:,:,:3],nan=0,posinf=0,neginf=0),0);scale=max(1.,float(rgb.max()))
 rgb=rgb/scale;pixels[:,:,:3]=np.where(rgb<=.0031308,rgb*12.92,1.055*rgb**(1/2.4)-.055);pixels[:,:,3]=1
 png=bpy.data.images.new(stem+' encoded',width=size,height=size,alpha=False);png.colorspace_settings.name='Non-Color';png.pixels.foreach_set(pixels.ravel())
 png.filepath_raw=str(OUT/(stem+'.png'));png.file_format='PNG';png.save()
 report['maps'].append({'stem':stem,'materials':[m.name for m in obj.data.materials],'intensity':scale*math.pi,'seconds':round(time.time()-started,2)})
 for nt,node in targets:nt.nodes.remove(node)
 (OUT/'electric-bake.json').write_text(json.dumps(report,indent=2))
 print('ELECTRIC_DONE',name,report['maps'][-1],flush=True)
