"""Bake the authored materials to real glTF-compatible PBR texture sets.

Physical repeat sizes are recorded. Metalness is constant for homogeneous
materials; adding random metalness to plaster/wood/fabric would be incorrect.
"""
import bpy,sys,json,math,re,hashlib
import numpy as np
from pathlib import Path
from mathutils import Vector
sys.path.insert(0,str(Path(__file__).resolve().parent))
from repair_pbr_color_encoding import linear_to_srgb
ROOT=Path(__file__).resolve().parents[1];OUT=ROOT/'assets/pbr';OUT.mkdir(parents=True,exist_ok=True)

def bake_all():
    original_scene=bpy.context.scene
    mats=sorted({slot.material for o in original_scene.objects if o.type in ['MESH','CURVE']
                 for slot in o.material_slots if slot.material and slot.material.use_nodes},key=lambda m:m.name)
    # A separate scene keeps each material bake independent of the full villa.
    bake_scene=bpy.data.scenes.new('TEMP PBR bake');bpy.context.window.scene=bake_scene
    bake_scene.render.engine='CYCLES';bake_scene.cycles.samples=1
    bake_scene.render.bake.margin=8;bake_scene.render.bake.use_clear=True
    bake_scene.view_settings.view_transform='Standard'
    data=bpy.data.meshes.new('TEMP bake plane');data.from_pydata([(0,0,0),(1,0,0),(1,1,0),(0,1,0)],[],[(0,1,2,3)])
    uv=data.uv_layers.new(name='UVMap')
    for loop in data.loops:uv.data[loop.index].uv=data.vertices[loop.vertex_index].co[:2]
    plane=bpy.data.objects.new('TEMP bake plane',data);bake_scene.collection.objects.link(plane)
    bpy.context.view_layer.objects.active=plane;plane.select_set(True)
    records=[];new_images=[]
    def constant_image(name,values,noncolor=True):
        im=bpy.data.images.new(name,4,4,alpha=True,float_buffer=False)
        im.colorspace_settings.name='Non-Color' if noncolor else 'sRGB'
        rgba=list(values)+[1]*(4-len(values))
        # Byte image buffers store encoded values. Convert authored linear RGB
        # before saving a constant sRGB texture; data maps stay linear.
        if not noncolor:rgba[:3]=[linear_to_srgb(v) for v in rgba[:3]]
        im.pixels=rgba*16;return im
    def save(im,filename):
        im.filepath_raw=str(OUT/filename);im.file_format='PNG';im.save();im.filepath='//../../assets/pbr/'+filename
        im.pack();new_images.append(im);return 'assets/pbr/'+filename
    for number,mat in enumerate(mats):
        nt=mat.node_tree;bs=next((n for n in nt.nodes if n.type=='BSDF_PRINCIPLED'),None)
        if bs is None:continue
        slug=re.sub('[^a-z0-9]+','-',mat.name.lower()).strip('-')+'-'+hashlib.sha1(mat.name.encode()).hexdigest()[:6]
        size=(1.,1.)
        if mat.name=='wood_floor':size=(3.6,3.8)
        elif mat.name in ['stone_tile','bath_tile','terra_floor']:size=(2.4,2.4)
        elif 'limestone' in mat.name.lower():size=(2.72,2.76)
        elif 'tile' in mat.name.lower():size=(1.44,1.44)
        resolution=512
        for v in data.vertices:v.co.x=(1 if v.index in [1,2] else 0)*size[0];v.co.y=(1 if v.index in [2,3] else 0)*size[1]
        data.update();plane.data.materials.clear();plane.data.materials.append(mat)
        output=next(n for n in nt.nodes if n.type=='OUTPUT_MATERIAL')
        original_links=[(l.from_socket,l.to_socket) for l in nt.links if l.to_node==output]
        maps={};images={}
        # Preserve directly projected reference photos, including their existing UVs.
        direct_color=bs.inputs['Base Color'].links[0].from_node if bs.inputs['Base Color'].is_linked else None
        photo=direct_color is not None and direct_color.type=='TEX_IMAGE'
        for channel,socket in [('basecolor','Base Color'),('roughness','Roughness'),('metallic','Metallic'),('normal','Normal')]:
            inp=bs.inputs[socket]
            if channel=='basecolor' and photo:
                im=direct_color.image.copy();maps[channel]=save(im,slug+'-'+channel+'.png');images[channel]=im;continue
            linked=inp.is_linked
            if not linked:
                val=inp.default_value
                if channel=='normal':color=(.5,.5,1.,1.)
                elif channel=='basecolor':color=tuple(val)
                else:color=(float(val),float(val),float(val),1)
                im=constant_image(slug+'-'+channel,color,channel!='basecolor')
            else:
                im=bpy.data.images.new(slug+'-'+channel,resolution,resolution,alpha=True,float_buffer=False)
                im.colorspace_settings.name='Non-Color' if channel!='basecolor' else 'sRGB'
                target=nt.nodes.new('ShaderNodeTexImage');target.image=im
                for n in nt.nodes:n.select=False
                target.select=True;nt.nodes.active=target
                if channel=='normal':
                    for l in list(nt.links):
                        if l.to_node==output:nt.links.remove(l)
                    nt.links.new(bs.outputs['BSDF'],output.inputs['Surface'])
                    bpy.ops.object.bake(type='NORMAL',normal_space='TANGENT',use_selected_to_active=False)
                else:
                    emit=nt.nodes.new('ShaderNodeEmission');nt.links.new(inp.links[0].from_socket,emit.inputs['Color'])
                    nt.links.new(emit.outputs[0],output.inputs['Surface']);bpy.ops.object.bake(type='EMIT',use_selected_to_active=False)
                    nt.nodes.remove(emit)
                nt.nodes.remove(target)
                for l in list(nt.links):
                    if l.to_node==output:nt.links.remove(l)
                for a,b in original_links:nt.links.new(a,b)
            maps[channel]=save(im,slug+'-'+channel+'.png');images[channel]=im
        # Pack glTF occlusion/roughness/metalness. AO is neutral until a separate
        # geometric light bake exists; it is not fabricated from albedo.
        width=max(images['roughness'].size[0],images['metallic'].size[0]);height=width
        def channel_pixels(im):
            a=np.array(im.pixels[:],dtype=np.float32).reshape(im.size[1],im.size[0],4)
            if im.size[0]!=width:return np.full((height,width),a[0,0,0],dtype=np.float32)
            return a[:,:,0]
        pixels=np.ones((height,width,4),np.float32);pixels[:,:,1]=channel_pixels(images['roughness']);pixels[:,:,2]=channel_pixels(images['metallic'])
        orm=bpy.data.images.new(slug+'-orm',width,height,alpha=True);orm.colorspace_settings.name='Non-Color';orm.pixels.foreach_set(pixels.ravel())
        maps['orm']=save(orm,slug+'-orm.png')
        # Keep the material's transmission, coat, sheen and IOR values. Replace
        # only the texture inputs with the maps used by the web export.
        for socket in ['Base Color','Roughness','Metallic','Normal']:
            for l in list(bs.inputs[socket].links):nt.links.remove(l)
        color=nt.nodes.new('ShaderNodeTexImage');color.image=images['basecolor'];color.label='PBR base color';nt.links.new(color.outputs['Color'],bs.inputs['Base Color'])
        packed=nt.nodes.new('ShaderNodeTexImage');packed.image=orm;packed.label='PBR ORM'
        separate=nt.nodes.new('ShaderNodeSeparateColor');nt.links.new(packed.outputs['Color'],separate.inputs['Color'])
        nt.links.new(separate.outputs['Green'],bs.inputs['Roughness']);nt.links.new(separate.outputs['Blue'],bs.inputs['Metallic'])
        normal_tex=nt.nodes.new('ShaderNodeTexImage');normal_tex.image=images['normal']
        normal=nt.nodes.new('ShaderNodeNormalMap');nt.links.new(normal_tex.outputs['Color'],normal.inputs['Color']);nt.links.new(normal.outputs['Normal'],bs.inputs['Normal'])
        mat['pbr_maps_json']=json.dumps(maps);mat['pbr_repeat_m']=size;mat['pbr_photo_uv']=photo;mat['web_texture_bake_required']=False
        records.append(dict(material=mat.name,repeat_m=size,photo_uv_preserved=photo,maps=maps,
                            source_status=mat.get('reference_status','photo_interpreted_not_calibrated')))
        print('PBR_BAKED',number+1,len(mats),mat.name,flush=True)
    bpy.context.window.scene=original_scene;bpy.data.scenes.remove(bake_scene)
    bpy.data.objects.remove(plane,do_unlink=True)
    # Assign physically scaled planar UVs per surface, retaining source-photo UVs.
    seen=set();uv_count=0
    for o in original_scene.objects:
        if o.type!='MESH' or o.get('preserve_authored_uv') or o.data.as_pointer() in seen:continue
        seen.add(o.data.as_pointer());mesh=o.data
        if any(mat and mat.get('pbr_photo_uv') for mat in mesh.materials):continue
        layer=mesh.uv_layers.active or mesh.uv_layers.new(name='UVMap')
        for poly in mesh.polygons:
            mat=mesh.materials[poly.material_index] if len(mesh.materials)>poly.material_index else None
            repeat=mat.get('pbr_repeat_m',(1,1)) if mat else (1,1)
            axis=max(range(3),key=lambda i:abs(poly.normal[i]));axes=[i for i in range(3) if i!=axis]
            for li in poly.loop_indices:
                p=mesh.vertices[mesh.loops[li].vertex_index].co
                layer.data[li].uv=(p[axes[0]]/repeat[0],p[axes[1]]/repeat[1])
        uv_count+=1
    manifest={'stage':'photo_interpreted_PBR_bake_not_measured_scan','materials':records,'mesh_uv_sets':uv_count,
              'normal_convention':'OpenGL +Y','orm_channels':{'R':'neutral ambient occlusion','G':'roughness','B':'metallic'},
              'photometric_calibration':False,'all_materials_mapped':len(records)==len(mats)}
    (OUT/'manifest.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2))
    original_scene['pbr_stage']='image maps baked and assigned';bpy.data.orphans_purge(do_local_ids=True,do_linked_ids=False,do_recursive=True)
    bpy.ops.wm.save_as_mainfile(filepath=str(ROOT/'build/blender/angora21-working.blend'),compress=True)
    print('PBR_COMPLETE',len(records),uv_count,flush=True)
if __name__=='__main__':bake_all()
