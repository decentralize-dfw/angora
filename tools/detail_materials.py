"""Photo-interpreted finish details. Pattern and reflectance are not measured values."""
import bpy
from blender_materials import material,linear,noise_bump

def add_detail_materials(m):
    specs={
        'leather_brown':('514033',.46,0),'chair_tapestry':('786D59',.84,0),
        'burgundy_velvet':('4D1823',.96,0),'curtain_sheer':('EEE9D9',.91,0),
        'pillow_grey':('72726B',.95,0),'bed_base':('7A7467',.91,0),
        'quilt_pink':('CDAFB2',.88,0),'lamp_shade':('A49A79',.90,0),
        'antique_wood':('61402A',.26,0),'inlay_wood':('93724D',.31,0),
        'cabinet_glass':('EFF2F1',.045,0),'china':('F3EBDA',.23,0),
        'leaf_yellow':('7C8B39',.81,0),'needle_dark':('2D4422',.87,0),
        'needle_light':('526D31',.84,0),'bark':('5D5545',.95,0),
        'gravel':('AAA591',.90,0),'bulb_warm':('FFF0C9',.24,0)}
    for key,spec in specs.items():m[key]=material(key,*spec)
    for key in ['leather_brown','chair_tapestry','burgundy_velvet','curtain_sheer','pillow_grey','bed_base','lamp_shade']:
        noise_bump(m[key],260 if key=='leather_brown' else 180,.17,.0015)
        bs=m[key].node_tree.nodes.get('Principled BSDF')
        if key!='leather_brown':bs.inputs['Sheen Weight'].default_value=.22
    for key in ['stucco','white_trim','wood_dark']:
        color={'stucco':'9BA3AC','white_trim':'F0EEE7','wood_dark':'30251F'}[key]
        m[key].diffuse_color=linear(color)
        m[key].node_tree.nodes.get('Principled BSDF').inputs['Base Color'].default_value=linear(color)
    bs=m['wood_floor'].node_tree.nodes.get('Principled BSDF')
    bs.inputs['Roughness'].default_value=.25;bs.inputs['Coat Weight'].default_value=.25
    bs.inputs['Coat Roughness'].default_value=.21
    # Mottled stone ceramic visible in the kitchens; preserve the existing tile
    # module/joints and add restrained color variation within each surface.
    nt=m['terra_floor'].node_tree;bs=nt.nodes.get('Principled BSDF')
    original=bs.inputs['Base Color'].links[0].from_socket
    coords=next(n for n in nt.nodes if n.type=='TEX_COORD')
    cloud=nt.nodes.new('ShaderNodeTexNoise');cloud.inputs['Scale'].default_value=13;cloud.inputs['Detail'].default_value=5;cloud.inputs['Roughness'].default_value=.72
    nt.links.new(coords.outputs['Object'],cloud.inputs['Vector'])
    ramp=nt.nodes.new('ShaderNodeValToRGB');ramp.color_ramp.elements[0].position=.20;ramp.color_ramp.elements[0].color=(.22,.17,.12,1)
    ramp.color_ramp.elements[1].position=.78;ramp.color_ramp.elements[1].color=(1,.97,.88,1)
    nt.links.new(cloud.outputs['Fac'],ramp.inputs[0])
    mult=nt.nodes.new('ShaderNodeMixRGB');mult.blend_type='MULTIPLY';mult.inputs[0].default_value=.54
    nt.links.new(original,mult.inputs[1]);nt.links.new(ramp.outputs['Color'],mult.inputs[2]);nt.links.new(mult.outputs[0],bs.inputs['Base Color'])
    bs.inputs['Roughness'].default_value=.40
    for key in ['wood_honey','wood_dark','antique_wood','inlay_wood']:
        nt=m[key].node_tree;bs=nt.nodes.get('Principled BSDF')
        base=bs.inputs['Base Color'].default_value[:]
        tex=nt.nodes.new('ShaderNodeTexCoord');mapping=nt.nodes.new('ShaderNodeVectorMath');mapping.operation='MULTIPLY'
        mapping.inputs[1].default_value=(5,42,2.5)
        noise=nt.nodes.new('ShaderNodeTexNoise');noise.inputs['Scale'].default_value=1;noise.inputs['Detail'].default_value=3
        ramp=nt.nodes.new('ShaderNodeValToRGB')
        ramp.color_ramp.elements[0].position=.12;ramp.color_ramp.elements[0].color=tuple(c*.59 for c in base[:3])+(1,)
        ramp.color_ramp.elements[1].position=.88;ramp.color_ramp.elements[1].color=tuple(min(1,c*1.4) for c in base[:3])+(1,)
        nt.links.new(tex.outputs['Object'],mapping.inputs[0]);nt.links.new(mapping.outputs[0],noise.inputs['Vector'])
        nt.links.new(noise.outputs['Fac'],ramp.inputs[0]);nt.links.new(ramp.outputs['Color'],bs.inputs['Base Color'])
        bs.inputs['Coat Weight'].default_value=.16;bs.inputs['Coat Roughness'].default_value=.23
        m[key]['web_texture_bake_required']=True
    # Warm quilt palette and woven relief interpreted from the master bed photo.
    nt=m['quilt_pink'].node_tree;bs=nt.nodes.get('Principled BSDF')
    uv=nt.nodes.new('ShaderNodeTexCoord');noise=nt.nodes.new('ShaderNodeTexNoise');noise.inputs['Scale'].default_value=24;noise.inputs['Detail'].default_value=5
    nt.links.new(uv.outputs['UV'],noise.inputs['Vector'])
    ramp=nt.nodes.new('ShaderNodeValToRGB');ramp.color_ramp.elements[0].position=.35;ramp.color_ramp.elements[0].color=linear('C59CA7')
    ramp.color_ramp.elements[1].position=.57;ramp.color_ramp.elements[1].color=linear('F2EADB')
    nt.links.new(noise.outputs['Fac'],ramp.inputs[0]);nt.links.new(ramp.outputs['Color'],bs.inputs['Base Color'])
    noise_bump(m['quilt_pink'],190,.30,.003)
    bs=m['cabinet_glass'].node_tree.nodes.get('Principled BSDF');bs.inputs['Transmission Weight'].default_value=1;bs.inputs['IOR'].default_value=1.45
    nt=m['curtain_sheer'].node_tree;bs=nt.nodes.get('Principled BSDF')
    transparent=nt.nodes.new('ShaderNodeBsdfTransparent');mix=nt.nodes.new('ShaderNodeMixShader');mix.inputs[0].default_value=.68
    nt.links.new(bs.outputs[0],mix.inputs[1]);nt.links.new(transparent.outputs[0],mix.inputs[2]);nt.links.new(mix.outputs[0],nt.nodes.get('Material Output').inputs['Surface'])
    m['curtain_sheer']['web_texture_bake_required']=True
    # Thin plant parts transmit light without relying on painted billboard silhouettes.
    for key in ['foliage','foliage_light','hedge','leaf_yellow','needle_dark','needle_light']:
        nt=m[key].node_tree;bs=nt.nodes.get('Principled BSDF');out=nt.nodes.get('Material Output')
        trans=nt.nodes.new('ShaderNodeBsdfTranslucent');trans.inputs['Color'].default_value=m[key].diffuse_color
        mix=nt.nodes.new('ShaderNodeMixShader');mix.inputs[0].default_value=.30
        nt.links.new(bs.outputs[0],mix.inputs[1]);nt.links.new(trans.outputs[0],mix.inputs[2]);nt.links.new(mix.outputs[0],out.inputs['Surface'])
        m[key]['web_texture_bake_required']=True
    bs=m['bulb_warm'].node_tree.nodes.get('Principled BSDF');bs.inputs['Emission Color'].default_value=linear('FFE3A5');bs.inputs['Emission Strength'].default_value=4
    noise_bump(m['gravel'],70,.6,.013);noise_bump(m['bark'],26,.45,.021)
    return m
