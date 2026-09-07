"""Photo-directed Blender PBR palette. Procedural textures require baking for web parity."""
import bpy

def linear(hexcolor):
    rgb=[int(hexcolor[i:i+2],16)/255 for i in (0,2,4)]
    return tuple(c/12.92 if c<=.04045 else ((c+.055)/1.055)**2.4 for c in rgb)+(1.,)

def material(name,color,roughness=.55,metallic=0):
    m=bpy.data.materials.new(name);m.use_nodes=True
    color=linear(color)
    m.diffuse_color=color
    bs=m.node_tree.nodes.get('Principled BSDF');bs.inputs['Base Color'].default_value=color
    bs.inputs['Roughness'].default_value=roughness;bs.inputs['Metallic'].default_value=metallic
    m['reference_status']='photo_interpreted';m['web_texture_bake_required']=False
    return m

def noise_bump(m,scale=80,strength=.15,distance=.018):
    nt=m.node_tree; n=nt.nodes.new('ShaderNodeTexNoise');n.inputs['Scale'].default_value=scale
    bump=nt.nodes.new('ShaderNodeBump');bump.inputs['Strength'].default_value=strength;bump.inputs['Distance'].default_value=distance
    coords=nt.nodes.new('ShaderNodeTexCoord');nt.links.new(coords.outputs['Object'],n.inputs['Vector'])
    nt.links.new(n.outputs['Fac'],bump.inputs['Height']);nt.links.new(bump.outputs['Normal'],nt.nodes.get('Principled BSDF').inputs['Normal'])
    m['web_texture_bake_required']=True

def tiles(m,c1,c2,size=(.6,.6),mortar='887C6B',joint=.003,rotation=0):
    nt=m.node_tree;brick=nt.nodes.new('ShaderNodeTexBrick')
    brick.inputs['Color1'].default_value=linear(c1);brick.inputs['Color2'].default_value=linear(c2)
    brick.inputs['Mortar'].default_value=linear(mortar);brick.inputs['Scale'].default_value=1
    brick.inputs['Mortar Size'].default_value=joint;brick.inputs['Mortar Smooth'].default_value=.002
    brick.inputs['Brick Width'].default_value=size[0];brick.inputs['Row Height'].default_value=size[1]
    brick.offset=.5 if size[0]>3*size[1] else 0
    coord=nt.nodes.new('ShaderNodeTexCoord');mapping=nt.nodes.new('ShaderNodeMapping')
    mapping.inputs['Rotation'].default_value[2]=rotation
    nt.links.new(coord.outputs['Object'],mapping.inputs['Vector']);nt.links.new(mapping.outputs['Vector'],brick.inputs['Vector'])
    nt.links.new(brick.outputs['Color'],nt.nodes.get('Principled BSDF').inputs['Base Color'])
    bump=nt.nodes.new('ShaderNodeBump');bump.inputs['Strength'].default_value=.16;bump.inputs['Distance'].default_value=.005
    nt.links.new(brick.outputs['Fac'],bump.inputs['Height']);nt.links.new(bump.outputs['Normal'],nt.nodes.get('Principled BSDF').inputs['Normal'])
    m['web_texture_bake_required']=True

def palette():
    specs={
      'stucco':('848F9C',.8,0),'white_trim':('ECE8DA',.6,0),'interior':('ECE5D8',.82,0),
      'ceiling':('F2EEE6',.83,0),'wood_dark':('38221A',.35,0),'wood_honey':('85552C',.37,0),
      'wood_floor':('89512B',.34,0),'terra_floor':('AA8264',.65,0),'stone_tile':('B5B1A4',.75,0),
      'roof':('BE602E',.75,0),'neighbor_roof':('A55633',.84,0),'metal':('272B2D',.34,.75),
      'chrome':('AEB4B6',.22,.95),'brass':('9C7942',.3,.72),'glass':('CEDDDE',.08,0),
      'water':('64B6C6',.12,0),'pool_tile':('65ADB8',.48,0),'soil':('625A40',.98,0),
      'grass':('697650',.93,0),'foliage':('3D5930',.94,0),'foliage_light':('738250',.92,0),
      'hedge':('355137',.95,0),'asphalt':('505359',.95,0),'neighbor_wall':('D2CBC0',.87,0),
      'canopy':('657768',.73,0),'fabric':('C8B79B',.92,0),'blue_fabric':('7F8892',.89,0),
      'rug':('965348',.93,0),'linen':('E4DAC4',.92,0),'ceramic':('F4F0E4',.2,0),
      'black':('151719',.45,0),'red_tile':('B15149',.39,0),'bath_tile':('DAD4C7',.42,0),
      'sage_panel':('8B9177',.55,0),'flower':('B390B2',.9,0)}
    mats={k:material(k,*v) for k,v in specs.items()}
    for k in ('stucco','interior','ceiling'):noise_bump(mats[k],95,.14,.012)
    for k in ('fabric','linen','blue_fabric'):noise_bump(mats[k],210,.12,.003)
    for k in ('soil','grass','foliage','foliage_light','hedge'):noise_bump(mats[k],7,.3,.04)
    tiles(mats['wood_floor'],'763C23','945431',(1.2,.095),'281710',.00045)
    nt=mats['wood_floor'].node_tree;coord=next(n for n in nt.nodes if n.type=='TEX_COORD')
    stretch=nt.nodes.new('ShaderNodeVectorMath');stretch.operation='MULTIPLY';stretch.inputs[1].default_value=(.4,60,4)
    grain=nt.nodes.new('ShaderNodeTexNoise');grain.inputs['Scale'].default_value=1;grain.inputs['Detail'].default_value=3
    nt.links.new(coord.outputs['Object'],stretch.inputs[0]);nt.links.new(stretch.outputs[0],grain.inputs['Vector'])
    mix=nt.nodes.new('ShaderNodeMixRGB');mix.blend_type='MULTIPLY';mix.inputs[0].default_value=.22
    brick=next(n for n in nt.nodes if n.type=='TEX_BRICK');nt.links.new(brick.outputs['Color'],mix.inputs[1]);nt.links.new(grain.outputs['Fac'],mix.inputs[2]);nt.links.new(mix.outputs[0],nt.nodes.get('Principled BSDF').inputs['Base Color'])
    tiles(mats['terra_floor'],'B48B6A','9D765B',(.33,.33),'D5C6AA',.0025,.785398)
    tiles(mats['stone_tile'],'B5B2A7','C1BDB0',(.6,.6),'8D8A82',.002)
    tiles(mats['roof'],'B65C2B','C9743D',(.24,.36),'733A23',.004)
    for k in ('glass','water'):
        bs=mats[k].node_tree.nodes.get('Principled BSDF')
        bs.inputs['Transmission Weight'].default_value=1
        bs.inputs['IOR'].default_value=1.45 if k=='glass' else 1.333
    noise_bump(mats['water'],2,.12,.04)
    mats['glass'].use_nodes=True
    mats['glass'].surface_render_method='DITHERED'
    nt=mats['glass'].node_tree;path=nt.nodes.new('ShaderNodeLightPath');transparent=nt.nodes.new('ShaderNodeBsdfTransparent');mix=nt.nodes.new('ShaderNodeMixShader')
    nt.links.new(path.outputs['Is Shadow Ray'],mix.inputs[0]);nt.links.new(nt.nodes.get('Principled BSDF').outputs['BSDF'],mix.inputs[1]);nt.links.new(transparent.outputs['BSDF'],mix.inputs[2]);nt.links.new(mix.outputs[0],nt.nodes.get('Material Output').inputs['Surface'])
    return mats
