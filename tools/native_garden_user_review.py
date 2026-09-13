"""User photo corrections; execute only inside the open Blender UI namespace."""

def inspect_outbuilding_and_pool():
    rows=[]
    for o in SC.objects:
        if o.type!='MESH':continue
        lo,hi=bounds(o)
        if lo[0]>10 or hi[0]<4 or lo[1]>10 or hi[1]<5.5 or lo[2]>3 or hi[2]<-.4:continue
        rows.append({'name':o.name,'bounds':[lo,hi],'materials':[m.name if m else None for m in o.data.materials]})
    samples=[]
    basin=bpy.data.objects['R33 | Monolithic pool basin']
    for x in [-2.5,-.5,1.5]:
        for y in [14.5,15.45,16.4]:samples.append({'xy':[x,y],'basin':garden_surface(basin,x,y,1)})
    (REVIEW/'outbuilding-pool-inspection.json').write_text(json.dumps({'objects':rows,'pool':samples}),encoding='utf-8')
    print('OUTBUILDING AND POOL',len(rows))

def add_pool_dolphin():
    if SC.get('user_review_pool_dolphin'):return
    source=ROOT/'assets/review-textures/pool-dolphin-photo-v1.png'
    image=bpy.data.images.load(str(source),check_existing=True);image.pack()
    mat=finish_material('Pool | Photo-derived navy dolphin ceramic',(.01,.03,.11),.38)
    nt=mat.node_tree;bs=nt.nodes['Principled BSDF'];tex=nt.nodes.new('ShaderNodeTexImage');tex.image=image
    nt.links.new(tex.outputs['Color'],bs.inputs['Base Color'])
    # The generated RGB image includes a neutral checker preview. Key only the
    # navy ceramic, keeping both the surrounding field and body transparent.
    # Bake this shader alpha to the final texture during the final baking pass.
    channels=nt.nodes.new('ShaderNodeSeparateColor');nt.links.new(tex.outputs['Color'],channels.inputs['Color'])
    difference=nt.nodes.new('ShaderNodeMath');difference.operation='SUBTRACT'
    nt.links.new(channels.outputs['Blue'],difference.inputs[0]);nt.links.new(channels.outputs['Red'],difference.inputs[1])
    mask=nt.nodes.new('ShaderNodeMath');mask.operation='GREATER_THAN';mask.inputs[1].default_value=.025
    nt.links.new(difference.outputs[0],mask.inputs[0]);nt.links.new(mask.outputs[0],bs.inputs['Alpha'])
    mat.surface_render_method='DITHERED';mat.use_backface_culling=False
    basin=bpy.data.objects['R33 | Monolithic pool basin'];floor=garden_surface(basin,-.5,15.45,1)[2]
    x0,x1,y0,y1=-2.5,1.5,14.15,16.75
    o=garden_mesh('Pool | Photographed dolphin floor mosaic',[(x0,y0,floor+.003),(x1,y0,floor+.003),(x1,y1,floor+.003),(x0,y1,floor+.003)],[(0,1,2,3)],mat)
    for layer in o.data.uv_layers:
        for loop in o.data.loops:
            p=o.matrix_world@o.data.vertices[loop.vertex_index].co
            layer.data[loop.index].uv=((p.x-x0)/(x1-x0),(p.y-y0)/(y1-y0))
    o['walk_role']='decoration';o['source']='User SS14 aerial photograph';o['texture_bake_required']=True
    o['fidelity_note']='Photo-derived reconstruction; no exact orthographic original available'
    SC['user_review_pool_dolphin']=True;bpy.context.view_layer.update()
    (REVIEW/'pool-dolphin.json').write_text(json.dumps({'source':str(source),'bounds':bounds(o),'basin_floor':floor,'final_alpha_bake_required':True}),encoding='utf-8')
    print('POOL DOLPHIN ADDED',floor)

def refine_dolphin_mask():
    nt=bpy.data.materials['Pool | Photo-derived navy dolphin ceramic'].node_tree
    channels=next(n for n in nt.nodes if n.type=='SEPARATE_COLOR');channels.mode='HSV'
    mask=next(n for n in nt.nodes if n.type=='MATH' and n.operation=='GREATER_THAN')
    nt.links.new(channels.outputs[1],mask.inputs[0]);mask.inputs[1].default_value=.58

def replace_dolphin_head_texture():
    source=ROOT/'assets/review-textures/pool-dolphin-photo-v3.png'
    im=bpy.data.images.load(str(source),check_existing=True);im.pack()
    nt=bpy.data.materials['Pool | Photo-derived navy dolphin ceramic'].node_tree
    next(n for n in nt.nodes if n.type=='TEX_IMAGE').image=im
    refine_dolphin_mask()
    o=bpy.data.objects['Pool | Photographed dolphin floor mosaic']
    o['texture_revision']='v3: corrected head, removed false tail-like jaw projection'
    o['fidelity_note']='Reference reconstruction; exact photo identity not verified'
    print('DOLPHIN HEAD TEXTURE REPLACED v3')

def replace_low_hedges_with_thuja():
    if SC.get('user_review_high_thuja'):return
    import random
    rng=random.Random(91321);soil=bpy.data.objects['R32 | Continuous local soil volume']
    centres=[]
    for y in np.arange(-8.8,22.5,1.15):
        for x in [-8.55,9.85+max(0,y-5.39)*.75]:centres.append((float(x),float(y)))
    centres.extend((float(x),23.7)for x in np.arange(-7.9,10.1,1.3))
    centres.extend((float(x),-8.95)for x in np.arange(-7.8,-.1,1.05))
    mats=[finish_material('Garden | Thuja dark scale foliage',(.023,.052,.017),.93),finish_material('Garden | Thuja green scale foliage',(.043,.085,.026),.9),finish_material('Garden | Thuja growing tips',(.072,.12,.037),.9)]
    variants=[]
    # Shared editable meshes: lobed evergreen cores and fine flat scale sprays.
    # Instances preserve low draw/geometry cost when exported with instancing.
    for variant in range(3):
        vs=[];fs=[];mi=[];rings=18;sides=22
        phase=rng.random()*math.tau
        for j in range(rings):
            t=j/(rings-1);r=.69*(max(.02,math.sin(math.pi*(.12+.88*t)))**.58)
            for k in range(sides):
                a=k*math.tau/sides;rr=r*(1+.075*math.sin(5*a+phase)+rng.uniform(-.045,.045))
                vs.append((rr*math.cos(a),rr*math.sin(a),.1+t*3.35))
        for j in range(rings-1):
            for k in range(sides):
                a=j*sides+k;b=j*sides+(k+1)%sides;fs.append((a,b,b+sides,a+sides));mi.append(0)
        fs.extend([tuple(range(sides-1,-1,-1)),tuple((rings-1)*sides+k for k in range(sides))]);mi.extend([0,0])
        for i in range(650):
            t=rng.uniform(.015,.98);a=rng.random()*math.tau
            r=.69*(max(.02,math.sin(math.pi*(.12+.88*t)))**.58)
            p=Vector((r*math.cos(a),r*math.sin(a),.1+t*3.35));side=Vector((-math.sin(a),math.cos(a),0));up=Vector((.2*math.cos(a),.2*math.sin(a),1)).normalized()
            length=rng.uniform(.11,.23);width=length*.32
            # Seven pointed leaflets on a thin flattened spray, rather than
            # the former oversized individual broad leaves.
            for j in range(4):
                q=p+up*(j*length*.23);w=width*(1-j*.18)
                for sign in [-1,1]:
                    base=len(vs);vs.extend([q-up*.018,q+side*(sign*w)+up*.035,q+up*.066]);fs.append((base,base+1,base+2));mi.append(rng.choice([0,1,1,2]))
        o=garden_mesh('Garden | High thuja privacy screen variant '+str(variant),vs,fs,mats[0])
        for m in mats[1:]:o.data.materials.append(m)
        for p,slot in zip(o.data.polygons,mi):p.material_index=slot
        variants.append(o)
    rows=[]
    for i,(x,y) in enumerate(centres):
        ground=garden_surface(soil,x,y)
        if ground is None:ground=[x,y,-.1 if y>5.39 else 2.7996]
        src=variants[i%3]
        o=src if i<3 else bpy.data.objects.new('Garden | High thuja privacy screen',src.data)
        if i>=3:bpy.data.collections['garden'].objects.link(o)
        o.location=(x,y,ground[2]-.07);o.rotation_euler.z=rng.random()*math.tau
        o.scale=(rng.uniform(.96,1.08),rng.uniform(.96,1.08),rng.uniform(.95,1.12))
        o['source']='kat_1_bahce photos: tall dense evergreen privacy hedge';o['dimension_status']='height photo-fitted, not surveyed';o['walk_role']='solid'
        rows.append({'name':o.name,'base':list(o.location),'height':3.45*o.scale.z})
    for name in ['Hedge foliage on CAD grades','Hedge leaves on CAD grades']:
        o=bpy.data.objects.get(name)
        if o and o.name in SC.objects:archive_object(o)
    SC['user_review_high_thuja']=True;bpy.context.view_layer.update()
    (REVIEW/'high-thuja.json').write_text(json.dumps({'trees':rows,'shared_mesh_variants':3,'reference':'kat_1_bahce; SS14','height_status':'photo fitted'}),encoding='utf-8')
    print('HIGH THUJA SCREEN',len(rows),'TREES, 3 SHARED MESHES')
