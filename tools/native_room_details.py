"""Native Blender-only corrections. Load after native_room_pass.py into same namespace."""

def archive_object(o):
    o.use_fake_user=True
    if o.data:o.data.use_fake_user=True
    for c in list(o.users_collection):c.objects.unlink(o)
    o.name='Archived before room repair | '+o.name

def solid_box(name, lo, hi, mat, level, bevel=0):
    vs=[(x,y,z) for z in (lo[2],hi[2]) for x,y in ((lo[0],lo[1]),(hi[0],lo[1]),(hi[0],hi[1]),(lo[0],hi[1]))]
    o=make_mesh(name,vs,[(0,3,2,1),(4,5,6,7),(0,1,5,4),(1,2,6,5),(2,3,7,6),(3,0,4,7)],mat,level)
    if bevel:
        mod=o.modifiers.new('Soft manufactured edges','BEVEL');mod.width=bevel;mod.segments=2
    return o

def rebuild_solid_doors():
    if SC.get('room_pass_solid_doors'):return
    # The source uses one repeatable six-panel design; preserve dimensions and finish.
    all_doors=list(DOORS)+[{'id':'f0-D13','level':0,'hinge':[1.118,-4.902],
        'latch':[1.118,-4.152],'frame_centre':[1.118,-4.527], 'sill_y':0,
        'clear_width':.8,'wall_depth':.1,'swing_deg':90,'open_normal':[1,0],
        'source_note':'B03 CAD west-wall 80 cm opening; joinery profile follows photographed house doors'}]
    records=[]
    for d in all_doors:
        d=dict(d);d['clear_width']=d.get('clear_width') or d.get('leaf_width') or d['frame_width']
        h,j,n,u,v=door_basis(d);lev=d['level'];did=d['id']
        if bpy.data.objects.get(did+' | Solid six-panel open leaf'):continue
        old=[o for o in SC.objects if o.get('door_id')==did and o.get('door_part')]
        mat=next((o.data.materials[0] for o in old if o.get('door_part')=='leaf'),bpy.data.materials.get('wood_dark'))
        brass=bpy.data.materials.get('R31 | R35 door brass') or bpy.data.materials.get('brass')
        # Effective closed clearance leaves 6 mm each side, plus 8 mm undercut.
        width=d['clear_width']-.012;bottom=.008;height=1.992
        cols=[(.115,(width-.09)/2),((width+.09)/2,width-.115)]
        rows=[(.195,.845),(.995,1.530),(1.635,1.89)]
        xs=sorted(set([0,width]+[p for a,b in cols for p in (a,a+.024,b-.024,b)]))
        zs=sorted(set([0,height]+[p for a,b in rows for p in (a,a+.024,b-.024,b)]))
        verts=[];faces=[];nx=len(xs);nz=len(zs)
        for side in (-1,1):
            for z in zs:
                for x in xs:
                    inset=0
                    for a,b in cols:
                        for c,e in rows:
                            if a<=x<=b and c<=z<=e:inset=.009*min(1,(x-a)/.024,(b-x)/.024,(z-c)/.024,(e-z)/.024)
                    p=h+n*x-j*(side*(.021-inset));p.z+=bottom+z;verts.append(tuple(p))
        count=nx*nz
        for side in (0,1):
            for iz in range(nz-1):
                for ix in range(nx-1):
                    a=side*count+iz*nx+ix;faces.append((a,a+1,a+1+nx,a+nx))
        boundary=list(range(nx))+[z*nx+nx-1 for z in range(1,nz)]+[(nz-1)*nx+x for x in range(nx-2,-1,-1)]+[z*nx for z in range(nz-2,0,-1)]
        for a,b in zip(boundary,boundary[1:]+boundary[:1]):faces.append((a,b,b+count,a+count))
        leaf=make_mesh(did+' | Solid six-panel open leaf',verts,faces,mat,lev)
        # Three continuous U extrusions; no triangulated slivers or T junctions.
        vv=[];ff=[];centre=Vector((d['frame_centre'][0],-d['frame_centre'][1],d['sill_y']))
        def u_frame(outer,inner,top,inner_top,dep0,dep1):
            poly=[(-outer,0),(-outer,top),(outer,top),(outer,0),(inner,0),(inner,inner_top),(-inner,inner_top),(-inner,0)]
            start=len(vv)
            for depth in (dep0,dep1):
                for x,z in poly:
                    p=centre+j*x+n*depth+Vector((0,0,z));vv.append(tuple(p))
            # Bottom-open U face divided into three non-overlapping quads.
            for off in (0,8):
                for ids in ((0,1,6,7),(1,2,5,6),(2,3,4,5)):ff.append(tuple(start+off+i for i in ids))
            for i in range(8):ff.append((start+i,start+(i+1)%8,start+8+(i+1)%8,start+8+i))
        half=d['clear_width']/2;dep=d['wall_depth']/2
        u_frame(half,half-.02,2.06,2.04,-dep,dep)
        u_frame(half+.075,half,2.10,2.025,-dep-.02,-dep)
        u_frame(half+.075,half,2.10,2.025,dep,dep+.02)
        frame=make_mesh(did+' | Solid walnut casing',vv,ff,mat,lev)
        # Retain fitted brass objects but align their measured long axis with the new leaf.
        hardware=next((o for o in old if o.get('door_part')=='hardware'),None)
        if hardware:
            oldleaf=next(o for o in old if o.get('door_part')=='leaf')
            points=[oldleaf.matrix_world@vtx.co for vtx in oldleaf.data.vertices]
            import numpy as np
            xy=np.array([[p.x,p.y] for p in points]);cov=np.cov(xy.T)
            eigen,vec=np.linalg.eigh(cov);axis=Vector((float(vec[0,-1]),float(vec[1,-1]),0))
            if axis.dot(sum(points,Vector())/len(points)-h)<0:axis=-axis
            rot=Matrix.Rotation(math.atan2(axis.cross(n).z,axis.dot(n)),4,'Z')
            hardware.matrix_world=Matrix.Translation(h+Vector((0,0,.008)))@rot@Matrix.Translation(-h)@hardware.matrix_world
            hardware['open_angle_deg']=90.0
        else:
            # Clone the complete eight-component brass assembly and map it to this hinge.
            source=next(o for o in SC.objects if o.get('door_id')=='f2-D09' and o.get('door_part')=='hardware')
            sd=next(q for q in DOORS if q['id']=='f2-D09');sh,sj,sn,_,_=door_basis(sd)
            hardware=source.copy();hardware.data=source.data.copy();hardware.name=did+' | Door brass hardware';bpy.data.collections[f'level-{lev}'].objects.link(hardware)
            angle=math.atan2(sn.cross(n).z,sn.dot(n));rot=Matrix.Rotation(angle,4,'Z')
            hardware.matrix_world=Matrix.Translation(h)@rot@Matrix.Translation(-sh)@source.matrix_world
        for obj,kind in [(leaf,'leaf'),(frame,'frame'),(hardware,'hardware')]:
            obj['door_id']=did;obj['door_part']=kind;obj['open_angle_deg']=90.0
            obj['source_note']=d.get('source_note','Native watertight repair of measured opening; retained six-panel design')
            obj['walk_role']='decoration' if kind=='hardware' else 'solid'
        for obj in old:
            if obj!=hardware:archive_object(obj)
        records.append({'id':did,'clear_width':d['clear_width'],'leaf_width':width,'angle':90,'bottom_gap':bottom})
    SC['room_pass_solid_doors']=True
    write_report('solid-doors.json',records)
    refine_door_normals();bpy.context.view_layer.update();bpy.ops.wm.save_mainfile()

def fit_mirror_and_room_cameras():
    o=bpy.data.objects['R33 | Mirror physical glass.001']
    if not o.get('room_pass_fit'):
        o.location.y-=.025;o['room_pass_fit']='Moved 25 mm toward room: originally buried behind Y=8.02709 wall'
    cam=next(o for o in SC.objects if o.type=='CAMERA' and o.get('room_id')=='f1-Z03')
    cam.location=(3.25,-1.4,4.6)
    if not any(o.type=='CAMERA' and o.get('room_id')=='f0-WC' for o in SC.objects):
        cam2=cam.copy();cam2.data=cam.data.copy();cam2.name='Review | Basement small photographed WC';cam2['room_id']='f0-WC';cam2.location=(-.05,1.55,1.5);bpy.data.collections['Review cameras'].objects.link(cam2)
    vehicle=[o for o in SC.objects if o.name.startswith('R35 | Garage vehicle')]
    write_report('removed-example-vehicle.json',[o.name for o in vehicle])
    for o in vehicle:archive_object(o)
    bpy.context.view_layer.update()
    write_report('mirror-fit.json',{'bounds':bounds(bpy.data.objects['R33 | Mirror physical glass.001']),'front_ray':ray_info((.35,7.5,10.9),(0,1,0),1)})

def cloth_material(name, color, quilt=False):
    m=bpy.data.materials.get(name)
    if m:return m
    m=bpy.data.materials.new(name);m.use_nodes=True
    nt=m.node_tree;bs=nt.nodes.get('Principled BSDF');bs.inputs['Base Color'].default_value=(*color,1)
    bs.inputs['Roughness'].default_value=.86;bs.inputs['Sheen Weight'].default_value=.25
    tex=nt.nodes.new('ShaderNodeTexCoord');noise=nt.nodes.new('ShaderNodeTexNoise');noise.inputs['Scale'].default_value=450
    nt.links.new(tex.outputs['Generated'],noise.inputs['Vector'])
    bump=nt.nodes.new('ShaderNodeBump');bump.inputs['Strength'].default_value=.22;bump.inputs['Distance'].default_value=.001
    nt.links.new(noise.outputs['Fac'],bump.inputs['Height']);nt.links.new(bump.outputs['Normal'],bs.inputs['Normal'])
    if quilt:
        vor=nt.nodes.new('ShaderNodeTexVoronoi');vor.feature='DISTANCE_TO_EDGE';vor.inputs['Scale'].default_value=14;vor.inputs['Randomness'].default_value=.35
        nt.links.new(tex.outputs['Generated'],vor.inputs['Vector'])
        ramp=nt.nodes.new('ShaderNodeValToRGB');ramp.color_ramp.elements[0].position=.01;ramp.color_ramp.elements[1].position=.045
        nt.links.new(vor.outputs['Distance'],ramp.inputs['Fac'])
        qb=nt.nodes.new('ShaderNodeBump');qb.inputs['Strength'].default_value=.45;qb.inputs['Distance'].default_value=.005
        nt.links.new(ramp.outputs['Color'],qb.inputs['Height']);nt.links.new(bump.outputs['Normal'],qb.inputs['Normal']);nt.links.new(qb.outputs['Normal'],bs.inputs['Normal'])
    m['reference']='Local bedroom photographs: fabric colour and stitched relief interpreted, not measured weave'
    m['web_export_note']='Bake procedural base/normal before glTF export'
    return m

def finish_textiles():
    for suffix,color in [('',(.27,.245,.22)),('.001',(.38,.34,.30)),('.002',(.24,.255,.29)),('.003',(.16,.20,.28))]:
        o=bpy.data.objects.get('R33 | Fitted draped bedcover'+suffix)
        if o:
            m=cloth_material('Room pass | Quilted bedspread '+(suffix or 'iron bed'),color,True)
            o.data.materials.clear();o.data.materials.append(m);o['reference']='kat_3_yatak_odalari_1.jpg; kat_4_2.jpg; kat_4_3.jpg'
    if not bpy.data.objects.get('C05 | Low woven lounge rug'):
        o=solid_box('C05 | Low woven lounge rug',(-4.8,1.15,9.472),(-2.9,2.75,9.478),cloth_material('Room pass | Lounge grey rug',(.17,.17,.16)),3,.002)
        o['reference']='kat_4_1.jpg lounge rug; dimensions interpreted from table';o['walk_role']='floor'
    if not bpy.data.objects.get('C03 | Woven bath runner'):
        m=cloth_material('Room pass | Burgundy bath runner',(.15,.021,.03))
        o=solid_box('C03 | Woven bath runner',(.42,6.48,9.474),(1.12,7.55,9.479),m,3,.001)
        o['reference']='kat_4_3.jpg red woven bath runner; placement photo interpreted';o['walk_role']='floor'

def add_b03_plan_fixtures():
    if SC.get('b03_plan_fixtures'):return
    rows=[]
    # CAD plan has a toilet against the east wall and a tray in the north-east corner.
    # No interior photo exists; reuse native house sanitary ware, explicitly marked as inferred type.
    sources=[o for o in bpy.data.collections['level-1'].objects if o.name.startswith('R33 | WC ')]
    for source in sources:
        o=source.copy();o.data=source.data.copy();o.name='B03 | CAD '+source.name[6:];bpy.data.collections['level-0'].objects.link(o)
        o.matrix_world=Matrix.Translation((-.985,5.2,-3.0996))@source.matrix_world
        o['reference']='B03 CAD toilet symbol east wall; ceramic style inferred from existing house WC'
        o['review_source_asset']='level-0.glb';o['walk_role']='solid';rows.append(o.name)
    source=bpy.data.objects['R33 | Quadrant molded shower tray']
    o=source.copy();o.data=source.data.copy();o.name='B03 | CAD shower tray';bpy.data.collections['level-0'].objects.link(o)
    pivot=Vector((1.445,5.8,9.4925));target=Vector((2.65,4.48,.012))
    o.matrix_world=Matrix.Translation(target)@Matrix.Diagonal((.88,.88,1,1))@Matrix.Translation(-pivot)@source.matrix_world
    o['reference']='B03 CAD north-east tray symbol; profile inferred from house shower';o['review_source_asset']='level-0.glb';o['walk_role']='solid';rows.append(o.name)
    SC['b03_plan_fixtures']=True;write_report('b03-plan-fixtures.json',rows)

def fitted_skirtings():
    if SC.get('room_pass_skirtings'):return
    rows=[]
    # Slice actual finished wall surfaces. A run is accepted only beside the wood floor.
    # Tile rooms, stairs, terraces and doorway voids therefore cannot acquire blocking strips.
    for level,base in [(2,6.371),(3,9.4705)]:
        groups={}
        walls=[o for o in bpy.data.collections[f'level-{level}'].objects if o.type=='MESH' and ('DUVAR KAPLAMA' in o.name or 'partition core' in o.name)]
        for obj in walls:
            for p in obj.data.polygons:
                ps=[obj.matrix_world@obj.data.vertices[i].co for i in p.vertices]
                if min(v.z for v in ps)>base+.06 or max(v.z for v in ps)<base+.06:continue
                cross=[]
                for a,b in zip(ps,ps[1:]+ps[:1]):
                    if (a.z-base-.06)*(b.z-base-.06)<0:cross.append(a+(b-a)*((base+.06-a.z)/(b.z-a.z)))
                if len(cross)!=2:continue
                a,b=cross
                if (a-b).length<.035:continue
                const=0 if abs(a.x-b.x)<.002 else 1 if abs(a.y-b.y)<.002 else None
                if const is None:continue
                other=1-const;c=(a[const]+b[const])/2
                lo,hi=sorted((a[other],b[other]));steps=max(1,math.ceil((hi-lo)/.04))
                for s in range(steps):
                    aa=lo+(hi-lo)*s/steps;bb=lo+(hi-lo)*(s+1)/steps
                    for side in (-1,1):
                        point=Vector((0,0,base));point[const]=c+side*.035;point[other]=(aa+bb)/2
                        floor=floor_finish_hit(level,point)
                        if not floor or 'wood_floor' not in floor[1].data.materials[floor[2]].name:continue
                        # Do not cover an existing wood trim or a nearby furniture front.
                        hit=ray_info(point+Vector((0,0,.065)),Vector(tuple(-side if i==const else 0 for i in range(3))),.055)
                        if not hit or hit['object']!=obj.name:continue
                        key=(const,round(c,3),side);groups.setdefault(key,[]).append((aa,bb))
        for (axis,c,side),intervals in groups.items():
            merged=[]
            for a,b in sorted(intervals):
                if merged and a<=merged[-1][1]+.003:merged[-1][1]=max(b,merged[-1][1])
                else:merged.append([a,b])
            for a,b in merged:
                if b-a<.07:continue
                lo=[0,0,base+.002];hi=[0,0,base+.087]
                lo[1-axis]=a+.001;hi[1-axis]=b-.001
                lo[axis]=min(c+side*.001,c+side*.013);hi[axis]=max(c+side*.001,c+side*.013)
                o=solid_box(f'F{level} | Fitted walnut skirting {len(rows)+1:03}',lo,hi,bpy.data.materials['wood_dark'],level,.001)
                o['reference']='Photographed dark skirting; fitted to native finished wall and wood floor';o['walk_role']='solid'
                rows.append({'object':o.name,'bounds':bounds(o)})
    SC['room_pass_skirtings']=True;write_report('fitted-skirtings.json',rows)

def room_object_audit():
    rows=[];mesh_rows=[]
    for o in SC.objects:
        if o.type!='MESH':continue
        if not any(c.name.startswith('level-') for c in o.users_collection):continue
        issues=[]
        if o.hide_render or o.hide_viewport or o.hide_get() or not o.visible_camera:issues.append('visibility flag')
        if not o.data.polygons:issues.append('empty mesh')
        for m in o.data.materials:
            if not m or not m.node_tree:continue
            for n in m.node_tree.nodes:
                if n.type=='BSDF_PRINCIPLED' and not n.inputs['Alpha'].is_linked and n.inputs['Alpha'].default_value<.01:issues.append('zero alpha '+m.name)
                if n.type=='TEX_IMAGE' and n.image and not n.image.has_data and not n.image.packed_file and not Path(bpy.path.abspath(n.image.filepath)).is_file():issues.append('missing image '+n.image.name)
        if issues:mesh_rows.append({'object':o.name,'issues':issues})
    for c in SC.objects:
        if c.type!='CAMERA' or not c.get('room_id'):continue
        hits=[]
        for height in (-1.25,-.6,0,.25):
            origin=c.location+Vector((0,0,height))
            for k in range(16):
                a=k*math.tau/16;hit=ray_info(origin,(math.cos(a),math.sin(a),0),.19)
                if hit:hits.append({'eye_offset':height,**hit})
        rows.append({'room':c['room_id'],'position':list(c.location),'body_radius_hits':hits,
            'floor':ray_info(c.location,(0,0,-1),2),'ceiling':ray_info(c.location,(0,0,1),4)})
    write_report('room-body-and-visibility.json',{'scope':'Native Blender room samples, not web navigation verification','rooms':rows,'mesh_issues':mesh_rows})
    bpy.ops.wm.save_mainfile()

def detail_wall_probes():
    rows=[]
    for x,z in [(-4.4,8.1),(-3.8,8.4),(-3.2,8.1),(-3.8,8.8),(-4.5,10.9),(-3.8,11.2),(-3.0,11.4)]:
        rows.append({'origin':[x,2.8,z],'hit':ray_info((x,2.8,z),(0,1,0),3)})
    for x,y in [(.6,7.4),(.6,6.5),(1.2,7.4)]:
        for direction in [(0,1,0),(1,0,0),(-1,0,0),(0,-1,0)]:
            rows.append({'origin':[x,y,10.65],'direction':direction,'hit':ray_info((x,y,10.65),direction,3)})
    write_report('detail-wall-probes.json',rows)

def consolidate_trims_and_fit_cameras():
    for rid,xyz in [('f1-Z03',(3.43,-1.27,4.6)),('f0-WC',(-.17,1.57,1.5))]:
        cam=next(o for o in SC.objects if o.type=='CAMERA' and o.get('room_id')==rid);cam.location=xyz
    for lev in (2,3):
        name=f'F{lev} | Fitted walnut skirtings combined'
        if bpy.data.objects.get(name):continue
        parts=[o for o in SC.objects if o.name.startswith(f'F{lev} | Fitted walnut skirting ')]
        vs=[];fs=[]
        for obj in parts:
            off=len(vs);vs.extend(tuple(obj.matrix_world@v.co) for v in obj.data.vertices)
            fs.extend(tuple(off+i for i in p.vertices) for p in obj.data.polygons)
        if not parts:continue
        o=make_mesh(name,vs,fs,parts[0].data.materials[0],lev)
        mod=o.modifiers.new('Skirting edge ease','BEVEL');mod.width=.001;mod.segments=1
        o['source_runs']=len(parts);o['walk_role']='solid';o['reference']='Native wall and wood-floor intersections; source bedroom photos'
        for obj in parts:archive_object(obj)
    bpy.context.view_layer.update();bpy.ops.wm.save_mainfile()

def hall_photo_gallery():
    if bpy.data.objects.get('F2 | Photographed family gallery'):return
    path=ROOT/'kat_3_hol/WhatsApp Image 2026-08-26 at 11.52.07 (10).jpeg'
    img=bpy.data.images.load(str(path),check_existing=True);img.pack()
    m=bpy.data.materials.new('Room pass | Original hall picture atlas');m.use_nodes=True
    nt=m.node_tree;tex=nt.nodes.new('ShaderNodeTexImage');tex.image=img
    nt.links.new(tex.outputs['Color'],nt.nodes.get('Principled BSDF').inputs['Base Color']);nt.nodes.get('Principled BSDF').inputs['Roughness'].default_value=.6
    # Source photograph outer frame corners, TL TR BR BL; no invented picture contents.
    frames=[(-4.50,8.05,.32,.28,[(924,146),(996,149),(996,207),(926,204)]),
        (-4.07,8.26,.31,.32,[(1015,105),(1086,108),(1084,172),(1014,167)]),
        (-4.02,7.80,.32,.26,[(1027,191),(1099,192),(1097,252),(1028,248)]),
        (-3.57,8.15,.32,.29,[(1123,132),(1193,135),(1192,199),(1120,194)]),
        (-3.50,7.69,.31,.26,[(1138,213),(1204,216),(1203,270),(1137,271)]),
        (-3.10,8.27,.32,.29,[(1227,121),(1291,126),(1290,182),(1227,180)]),
        (-3.03,7.83,.23,.31,[(1248,195),(1294,191),(1294,251),(1247,258)])]
    vs=[];fs=[];uvs=[]
    for x,z,w,h,corners in frames:
        offset=len(vs)
        vs.extend([(x-w/2,3.824,z+h/2),(x+w/2,3.824,z+h/2),(x+w/2,3.824,z-h/2),(x-w/2,3.824,z-h/2)])
        fs.append(tuple(offset+i for i in range(4)));uvs.extend([(px/1600,1-py/501)for px,py in corners])
    obj=make_mesh('F2 | Photographed family gallery',vs,fs,m,2)
    for p in obj.data.polygons:
        for li in p.loop_indices:obj.data.uv_layers.active.data[li].uv=uvs[obj.data.loops[li].vertex_index]
    mod=obj.modifiers.new('Frame backing depth','SOLIDIFY');mod.thickness=.022
    obj['reference']=str(path);obj['fit_note']='Image content sampled from source frames; gallery spacing interpreted from photograph';obj['walk_role']='decoration'

def attic_bath_tile_finish():
    if SC.get('room_pass_attic_tiles'):return
    mat=bpy.data.materials.new('Room pass | C03 cream tile and mosaic');mat.use_nodes=True
    nt=mat.node_tree;bs=nt.nodes.get('Principled BSDF');bs.inputs['Roughness'].default_value=.38
    geo=nt.nodes.new('ShaderNodeNewGeometry');sep=nt.nodes.new('ShaderNodeSeparateXYZ');nt.links.new(geo.outputs['Position'],sep.inputs[0])
    horizontal=nt.nodes.new('ShaderNodeMath');horizontal.operation='ADD';nt.links.new(sep.outputs['X'],horizontal.inputs[0]);nt.links.new(sep.outputs['Y'],horizontal.inputs[1])
    vec=nt.nodes.new('ShaderNodeCombineXYZ');nt.links.new(horizontal.outputs[0],vec.inputs['X']);nt.links.new(sep.outputs['Z'],vec.inputs['Y'])
    def brick(label,c1,c2,width,height):
        node=nt.nodes.new('ShaderNodeTexBrick');node.label=label;node.inputs['Color1'].default_value=(*c1,1);node.inputs['Color2'].default_value=(*c2,1)
        node.inputs['Mortar'].default_value=(.55,.53,.47,1);node.inputs['Scale'].default_value=1;node.inputs['Mortar Size'].default_value=.001
        node.inputs['Brick Width'].default_value=width;node.inputs['Row Height'].default_value=height;node.offset=0
        nt.links.new(vec.outputs[0],node.inputs['Vector']);return node
    lower=brick('Cream lower ceramic',(.64,.57,.42),(.61,.54,.40),.25,.30)
    upper=brick('Ivory small grid',(.77,.75,.69),(.75,.73,.67),.024,.024)
    band=brick('Brown mosaic frieze',(.23,.18,.12),(.48,.40,.28),.022,.022)
    def less(limit):
        n=nt.nodes.new('ShaderNodeMath');n.operation='LESS_THAN';nt.links.new(sep.outputs['Z'],n.inputs[0]);n.inputs[1].default_value=limit;return n
    a=nt.nodes.new('ShaderNodeMixRGB');nt.links.new(less(10.63).outputs[0],a.inputs[0]);nt.links.new(upper.outputs['Color'],a.inputs[1]);nt.links.new(band.outputs['Color'],a.inputs[2])
    b=nt.nodes.new('ShaderNodeMixRGB');nt.links.new(less(10.57).outputs[0],b.inputs[0]);nt.links.new(a.outputs[0],b.inputs[1]);nt.links.new(lower.outputs['Color'],b.inputs[2]);nt.links.new(b.outputs[0],bs.inputs['Base Color'])
    mat['reference']='kat_4_3.jpg cream lower tiles, brown narrow mosaic band, ivory small grid above';mat['web_export_note']='Bake mapped colour before glTF export'
    report=[]
    for o in bpy.data.collections['level-3'].objects:
        if o.type!='MESH' or not ('partition core' in o.name or 'DUVAR KAPLAMA' in o.name):continue
        slot=len(o.data.materials);o.data.materials.append(mat);n=0
        for p in o.data.polygons:
            ps=[o.matrix_world@o.data.vertices[i].co for i in p.vertices];c=sum(ps,Vector())/len(ps)
            if not (-.09<c.x<1.88 and 5.15<c.y<8.04 and 9.47<c.z<12.2):continue
            wall=(all(abs(v.x+.08215)<.008 for v in ps)or all(abs(v.x-1.86773)<.008 for v in ps)or all(abs(v.y-8.02709)<.008 for v in ps))
            if wall:p.material_index=slot;n+=1
        report.append({'object':o.name,'faces':n})
    SC['room_pass_attic_tiles']=True;write_report('attic-tile-faces.json',report)

def fit_hall_ceiling_beams():
    if any(o.name.startswith('F2 | Hall timber ceiling beam ') for o in SC.objects):return
    rows=[]
    for k in range(9):
        y=.30+k*.38
        hit=ray_info((-3.8,y,8.6),(0,0,1),.7)
        if not hit or 'TAVAN' not in hit['object']:continue
        z=hit['point'][2]
        a=ray_info((-3.8,y,z-.075),(-1,0,0),4)
        b=ray_info((-3.8,y,z-.075),(1,0,0),4)
        if not a or not b or 'DUVAR' not in a['object'] or 'DUVAR' not in b['object']:continue
        o=solid_box(f'F2 | Hall timber ceiling beam {k+1}',(a['point'][0]+.006,y-.04,z-.10),(b['point'][0]-.006,y+.04,z-.005),bpy.data.materials.get('wood_honey')or bpy.data.materials['wood_dark'],2,.003)
        o['reference']='kat_3_hol_1.jpg parallel timber ceiling beams; fitted to native ceiling and side walls';o['walk_role']='solid';rows.append(o.name)
    SC['room_pass_hall_beams']=True;write_report('hall-ceiling-beams.json',rows)

def add_hall_radiator():
    if bpy.data.objects.get('F2 | Hall photographed radiator'):return
    # Measured wall ray at the photographed window; refuse if the window-side wall differs.
    wall=ray_info((-4.5,1.8,6.70),(-1,0,0),3)
    if not wall or 'DUVAR' not in wall['object']:return
    x=wall['point'][0]+.05;white=bpy.data.materials.get('white_trim.002')or bpy.data.materials['white_trim']
    parts=[]
    for k in range(23):
        y=.78+k*.064
        parts.append(solid_box('Temporary hall radiator fin',(x,y,6.49),(x+.07,y+.045,7.08),white,2))
    for z in (6.52,7.04):parts.append(solid_box('Temporary hall radiator manifold',(x+.016,.755,z),(x+.051,2.265,z+.028),white,2))
    vs=[];fs=[]
    for p in parts:
        start=len(vs);vs.extend(tuple(p.matrix_world@v.co) for v in p.data.vertices);fs.extend(tuple(start+i for i in f.vertices)for f in p.data.polygons)
    o=make_mesh('F2 | Hall photographed radiator',vs,fs,white,2)
    o['reference']='kat_3_hol_1.jpg radiator below west window; fitted native wall';o['walk_role']='solid'
    mod=o.modifiers.new('Radiator rounded edges','BEVEL');mod.width=.007;mod.segments=2
    for p in parts:bpy.data.objects.remove(p,do_unlink=True)

def complete_geometry_review():
    extra={'id':'f0-D13','level':0,'hinge':[1.118,-4.902],'latch':[1.118,-4.152],
           'frame_centre':[1.118,-4.527],'sill_y':0,'clear_width':.8,'wall_depth':.1,'swing_deg':90,'open_normal':[1,0]}
    if not any(d['id']=='f0-D13' for d in DOORS):DOORS.append(extra)
    passage_audit('final-13-doors');refine_door_normals();room_object_audit()
    angles=[]
    import numpy as np
    for d in DOORS:
        o=next(o for o in SC.objects if o.get('door_id')==d['id'] and o.get('door_part')=='leaf')
        ps=[o.matrix_world@v.co for v in o.data.vertices];xy=np.array([[p.x,p.y]for p in ps]);_,vec=np.linalg.eigh(np.cov(xy.T))
        direction=Vector((float(vec[0,-1]),float(vec[1,-1]),0));h,j,n,_,_=door_basis(d)
        angle=math.degrees(math.acos(min(1,abs(direction.dot(j)))))
        angles.append({'id':d['id'],'measured_open_angle':angle,'bounds':bounds(o),'polygons':len(o.data.polygons)})
    write_report('final-door-angles.json',angles)
    garage=[]
    for x in [4.4,4.9,5.4,5.9,6.4,6.9]:
        for z in [3.25,4.1,4.8,5.15]:
            hit=ray_info((x,-1.65,z),(0,1,0),.50)
            if hit:garage.append({'origin':[x,-1.65,z],**hit})
    write_report('garage-opening-rays.json',{'samples':24,'jamb_inside_x':[4.14993,7.2],'hits':garage})
    textblock=bpy.data.texts.get('Angora room pass sources and limits')or bpy.data.texts.new('Angora room pass sources and limits')
    textblock.clear();textblock.write((ROOT/'build/qa/rooms-native/ROOM-PASS-TR.md').read_text(encoding='utf-8'))
    for name in ('native_room_pass.py','native_room_details.py'):
        t=bpy.data.texts.get(name)or bpy.data.texts.new(name);t.clear();t.write((ROOT/'tools'/name).read_text(encoding='utf-8'))
    bpy.ops.file.pack_all();bpy.ops.wm.save_mainfile()

def complete_hall_beam_spacing():
    source=bpy.data.objects.get('F2 | Hall timber ceiling beam 4')
    if not source:return
    lo,hi=bounds(source);middle=(lo[1]+hi[1])/2
    for k in range(9):
        name=f'F2 | Hall timber ceiling beam {k+1}'
        if bpy.data.objects.get(name):continue
        y=.30+k*.38;hit=ray_info((-3.8,y,8.6),(0,0,1),.7)
        if not hit or 'TAVAN' not in hit['object']:continue
        o=source.copy();o.data=source.data.copy();o.name=name;bpy.data.collections['level-2'].objects.link(o)
        o.location.y+=y-middle;o.location.z+=hit['point'][2]-.005-hi[2]
    write_report('hall-ceiling-beams.json',[{'object':o.name,'bounds':bounds(o)}for o in SC.objects if o.name.startswith('F2 | Hall timber ceiling beam ')])

def set_editable_hinges():
    rows=[]
    for d in DOORS:
        hinge=door_basis(d)[0]
        for o in SC.objects:
            if o.get('door_id')!=d['id'] or o.get('door_part') not in ('leaf','hardware'):continue
            before=[o.matrix_world@v.co for v in o.data.vertices]
            o.data.transform(Matrix.Translation(-hinge)@o.matrix_world);o.matrix_world=Matrix.Translation(hinge)
            o['pivot_note']='Native origin on the actual hinge axis; rotate Z to adjust swing'
            bpy.context.view_layer.update()
            assert max((before[i]-o.matrix_world@v.co).length for i,v in enumerate(o.data.vertices))<.0001
            rows.append({'object':o.name,'hinge':list(hinge)})
    write_report('editable-hinge-pivots.json',rows)
    bpy.ops.wm.save_mainfile()
