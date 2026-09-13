"""Photo-backed furniture corrections, executed inside the open native Blender file.

Load after native_room_pass.py and native_room_details.py into the same namespace.
Dimensions are fitted interpretations of the photos, not surveyed product dimensions.
"""

ATTIC_PHOTO = 'kat_4/WhatsApp Image 2026-08-26 at 11.53.10 (2).jpeg'

def photo_note(o, note):
    o['reference']=ATTIC_PHOTO
    o['fit_note']=note+'; photo proportions fitted to existing room, not surveyed'
    o['room_detail_pass']='attic-furniture'
    o['walk_role']='solid'
    return o

def tufted_pad(name, x0, x1, v0, v1, seat, mat):
    # Two gridded skins with shared side edges: a closed, editable cushion.
    nx,nv=(64,24) if not seat else (32,32)
    vertices=[];faces=[];button_uv=[]
    for row in range(2 if not seat else 3):
        for col in range(7 if not seat else 3):
            button_uv.append(((col+1)/(8 if not seat else 4),(row+1)/(3 if not seat else 4)))
    for side in range(2):
        for j in range(nv+1):
            v=j/nv
            for i in range(nx+1):
                u=i/nx;x=x0+(x1-x0)*u;t=v0+(v1-v0)*v
                puff=.032*(max(0,math.sin(math.pi*u)*math.sin(math.pi*v))**.35)
                dent=sum(.027*math.exp(-(((u-a)*(x1-x0))**2+((v-b)*(v1-v0))**2)/.00065) for a,b in button_uv)
                if seat:p=(x,t,9.895+puff-dent if side==0 else 9.805)
                else:p=(x,3.19+.11*v-puff+dent if side==0 else 3.34+.11*v,t)
                vertices.append(p)
    stride=nx+1;n=(nx+1)*(nv+1)
    for side in range(2):
        for j in range(nv):
            for i in range(nx):
                a=side*n+j*stride+i;faces.append((a,a+1,a+stride+1,a+stride))
    boundary=list(range(nx+1))+[j*stride+nx for j in range(1,nv+1)]+[nv*stride+i for i in range(nx-1,-1,-1)]+[j*stride for j in range(nv-1,0,-1)]
    for a,b in zip(boundary,boundary[1:]+boundary[:1]):faces.append((a,b,b+n,a+n))
    o=photo_note(make_mesh(name,vertices,faces,mat,3),'Two seat cushions and a single tufted back, as photographed')
    for p in o.data.polygons:p.use_smooth=True
    return o

def tapered_foot(name,x,y,z,height,top,bottom,mat):
    vs=[(x+dx*s,y+dy*s,z+dz)for s,dz in ((bottom/2,0),(top/2,height))for dx,dy in ((-1,-1),(1,-1),(1,1),(-1,1))]
    return photo_note(make_mesh(name,vs,[(0,3,2,1),(4,5,6,7),(0,1,5,4),(1,2,6,5),(2,3,7,6),(3,0,4,7)],mat,3),'Tapered timber foot')

def correct_lounge_furniture():
    if SC.get('attic_photo_furniture'):return
    blue=bpy.data.materials['R31 | R33 attic muted blue upholstery'].copy();blue.name='Room pass | Photographed slate blue sofa'
    bs=blue.node_tree.nodes.get('Principled BSDF')
    for link in list(bs.inputs['Base Color'].links):blue.node_tree.links.remove(link)
    bs.inputs['Base Color'].default_value=(.055,.067,.095,1);bs.inputs['Roughness'].default_value=.85
    noise=blue.node_tree.nodes.new('ShaderNodeTexNoise');noise.inputs['Scale'].default_value=380
    bump=blue.node_tree.nodes.new('ShaderNodeBump');bump.inputs['Strength'].default_value=.12;bump.inputs['Distance'].default_value=.0006
    blue.node_tree.links.new(noise.outputs['Fac'],bump.inputs['Height']);blue.node_tree.links.new(bump.outputs[0],bs.inputs['Normal'])
    for o in list(SC.objects):
        if o.name.startswith('R33 | Blue sofa seat cushion') or o.name.startswith('R33 | Blue sofa back cushion'):archive_object(o)
        elif o.name.startswith('R33 | Blue sofa'):
            o.data.materials.clear();o.data.materials.append(blue);photo_note(o,'Retained fitted sofa carcass and arms')
    tufted_pad('C05 | Single button tufted sofa back',-4.672,-3.028,9.925,10.36,False,blue)
    tufted_pad('C05 | Tufted seat left',-4.672,-3.860,2.642,3.225,True,blue)
    tufted_pad('C05 | Tufted seat right',-3.840,-3.028,2.642,3.225,True,blue)
    wood=bpy.data.materials['wood_honey.003']
    for o in list(SC.objects):
        if o.name=='Coffee table top.002' or o.name in [f'Coffee table leg.{i:03}' for i in range(8,12)]:archive_object(o)
    photo_note(solid_box('C05 | Square timber coffee table',(-4.325,1.355,9.8055),(-3.375,2.305,9.9055),wood,3,.004),'Square thick timber table replaces narrow oval-like top')
    for x in (-4.245,-3.455):
        for y in (1.435,2.225):tapered_foot('C05 | Square table tapered foot',x,y,9.478,.328,.065,.038,wood)
    walnut=bpy.data.materials['wood_dark.003']
    # Open carcass around inset double doors; no coincident full box behind doors.
    for label,lo,hi in [
      ('left side',(-2.77,3.075,9.49),(-2.748,3.445,10.34)),
      ('right side',(-2.172,3.075,9.49),(-2.15,3.445,10.34)),
      ('top',(-2.78,3.065,10.32),(-2.14,3.455,10.35)),
      ('base',(-2.748,3.09,9.555),(-2.172,3.43,9.578)),
      ('back',(-2.748,3.425,9.555),(-2.172,3.445,10.32)),
      ('left door',(-2.738,3.068,9.59),(-2.464,3.09,10.31)),
      ('right door',(-2.456,3.068,9.59),(-2.182,3.09,10.31))]:
        photo_note(solid_box('C05 | Sofa side cabinet '+label,lo,hi,walnut,3,.002),'Narrow double-door brown cabinet to right of sofa')
    metal=bpy.data.materials.get('chrome')or bpy.data.materials['white_trim.003']
    for x in (-2.497,-2.423):photo_note(solid_box('C05 | Cabinet vertical handle',(x-.008,3.047,10.10),(x+.008,3.065,10.22),metal,3,.007),'Paired light curved-effect pulls')
    SC['attic_photo_furniture']=True;bpy.context.view_layer.update()
    write_report('attic-furniture-corrections.json',[{'name':o.name,'bounds':bounds(o),'faces':len(o.data.polygons),'reference':o.get('reference')} for o in SC.objects if o.type=='MESH' and o.get('room_detail_pass')=='attic-furniture'])
    bpy.ops.wm.save_mainfile()

def photographed_attic_curtain():
    if bpy.data.objects.get('C05 | Photographed damask curtain'):return
    img=bpy.data.images.load(str(ROOT/ATTIC_PHOTO),check_existing=True);img.pack()
    mat=bpy.data.materials.new('Room pass | Original damask curtain photograph');mat.use_nodes=True
    nt=mat.node_tree;bs=nt.nodes.get('Principled BSDF');tex=nt.nodes.new('ShaderNodeTexImage');tex.image=img
    nt.links.new(tex.outputs['Color'],bs.inputs['Base Color']);bs.inputs['Roughness'].default_value=.95
    mat['reference']=ATTIC_PHOTO;mat['fit_note']='UV uses unobstructed patterned cloth patch of original photo; baked photo lighting remains'
    vs=[];fs=[];uv=[];nx,nz=64,12
    # Source pixels within the visible fabric, excluding chair and desk occlusions.
    a,b,c,d=(108,440),(366,453),(377,682),(117,696)
    for j in range(nz+1):
        t=j/nz
        for i in range(nx+1):
            u=i/nx;y=1.28+u*1.47
            vs.append((-6.005+.032*math.cos(u*math.pi*18),y,9.69+t*1.59))
            bottom=(d[0]*(1-u)+c[0]*u,d[1]*(1-u)+c[1]*u);top=(a[0]*(1-u)+b[0]*u,a[1]*(1-u)+b[1]*u)
            uv.append(((bottom[0]*(1-t)+top[0]*t)/1200,1-(bottom[1]*(1-t)+top[1]*t)/1600))
    for j in range(nz):
        for i in range(nx):
            k=j*(nx+1)+i;fs.append((k,k+1,k+nx+2,k+nx+1))
    o=photo_note(make_mesh('C05 | Photographed damask curtain',vs,fs,mat,3),'Pleated curtain fitted inside west window bay')
    for p in o.data.polygons:
        p.use_smooth=True
        for li in p.loop_indices:o.data.uv_layers.active.data[li].uv=uv[o.data.loops[li].vertex_index]
    mod=o.modifiers.new('Cloth thickness','SOLIDIFY');mod.thickness=.002
    rod=solid_box('C05 | Curtain timber rod',(-6.025,1.15,11.30),(-5.999,2.86,11.326),bpy.data.materials['wood_dark.003'],3,.012)
    photo_note(rod,'Timber curtain rod above photographed damask fabric')
    bpy.context.view_layer.update();bpy.ops.file.pack_all();bpy.ops.wm.save_mainfile()

def attic_furniture_qa():
    rows=[]
    for o in SC.objects:
        if o.type!='MESH' or o.get('room_detail_pass')!='attic-furniture':continue
        ev=o.evaluated_get(bpy.context.evaluated_depsgraph_get());me=ev.to_mesh();bm=bmesh.new();bm.from_mesh(me)
        rows.append({'name':o.name,'faces':len(bm.faces),'open_edges':sum(not e.is_manifold for e in bm.edges),'zero_area':sum(f.calc_area()<1e-10 for f in bm.faces)})
        bm.free();ev.to_mesh_clear()
    write_report('attic-furniture-mesh-qa.json',rows)
    room_object_audit()
    print('ATTIC FURNITURE QA',len(rows),'parts',sum(r['open_edges'] for r in rows),'open edges')

def fit_curtain_and_weld_sofa():
    o=bpy.data.objects['C05 | Photographed damask curtain']
    if not o.get('wall_fit_corrected'):
        o.location.x+=.085;o['wall_fit_corrected']=True
        bpy.data.objects['C05 | Curtain timber rod'].location.x+=.085
    rows=[]
    for o in SC.objects:
        if not o.name.startswith('R33 | Blue sofa'):continue
        bm=bmesh.new();bm.from_mesh(o.data);before=sum(not e.is_manifold for e in bm.edges)
        bmesh.ops.remove_doubles(bm,verts=list(bm.verts),dist=.000035)
        bmesh.ops.recalc_face_normals(bm,faces=list(bm.faces))
        after=sum(not e.is_manifold for e in bm.edges)
        rows.append({'name':o.name,'before_open_edges':before,'after_open_edges':after})
        bm.to_mesh(o.data);bm.free();o.data.update()
    write_report('sofa-source-seams.json',rows)
    bpy.context.view_layer.update()

def finish_hall_window():
    if SC.get('hall_window_fitted'):return
    glass=next(o for o in SC.objects if o.name=='F2 | PENCERE_KAPI$CAM')
    points=[glass.matrix_world@v.co for v in glass.data.vertices]
    points=[p for p in points if p.x<-6 and .5<p.y<3.3 and 6.5<p.z<8.9]
    assert points,'West hall glass required'
    lo=[min(p[i] for p in points) for i in range(3)];hi=[max(p[i] for p in points) for i in range(3)]
    assert .7<hi[1]-lo[1]<2.5
    rad=bpy.data.objects['F2 | Hall photographed radiator'];oldlo,oldhi=bounds(rad)
    # Fit metal below the measured bottom of the glass, with a small sill gap.
    targetlo=Vector((oldlo[0],lo[1],6.455));targethi=Vector((oldhi[0],hi[1],lo[2]-.045))
    assert targethi.z>targetlo.z+.2
    inv=rad.matrix_world.inverted()
    for v in rad.data.vertices:
        p=rad.matrix_world@v.co
        p=Vector((targetlo[i]+(p[i]-oldlo[i])/(oldhi[i]-oldlo[i])*(targethi[i]-targetlo[i]) for i in range(3)))
        v.co=inv@p
    rad.data.update();rad['fit_note']='Height and width fitted below actual west-window glass; no overlap'
    cloth=bpy.data.materials.new('Room pass | Hall taupe curtain');cloth.use_nodes=True
    bs=cloth.node_tree.nodes.get('Principled BSDF');bs.inputs['Base Color'].default_value=(.10,.075,.052,1);bs.inputs['Roughness'].default_value=.9
    ivory=bpy.data.materials.new('Room pass | Hall ivory roman blind');ivory.use_nodes=True
    ivory.node_tree.nodes['Principled BSDF'].inputs['Base Color'].default_value=(.69,.65,.54,1)
    ivory.node_tree.nodes['Principled BSDF'].inputs['Roughness'].default_value=.9
    top=hi[2]+.14;bottom=6.43
    for side in (0,1):
        vs=[];fs=[];nx,nz=32,24
        for j in range(nz+1):
            t=j/nz;width=.18+.09*t+.05*math.exp(-((t-.05)/.12)**2)
            edge=lo[1]-.12 if side==0 else hi[1]+.12
            for i in range(nx+1):
                u=i/nx;y=edge+width*u*(1 if side==0 else -1)
                vs.append((-5.89+.025*math.sin(u*math.pi*12),y,bottom+t*(top-bottom)))
        for j in range(nz):
            for i in range(nx):
                a=j*(nx+1)+i;fs.append((a,a+1,a+nx+2,a+nx+1))
        o=make_mesh(f'F2 | Hall tied curtain {side+1}',vs,fs,cloth,2)
        o['reference']='kat_3_hol/WhatsApp Image 2026-08-26 at 11.52.07 (10).jpeg'
        o['fit_note']='Taupe side drapes, fitted to measured window; cloth pattern simplified'
        mod=o.modifiers.new('Cloth thickness','SOLIDIFY');mod.thickness=.002
        for p in o.data.polygons:p.use_smooth=True
    for k in range(6):
        z=top-.08-k*.07
        o=solid_box(f'F2 | Roman blind folded panel {k+1}',(-5.925,lo[1]-.03,z-.075),(-5.903,hi[1]+.03,z),ivory,2,.008)
        o['reference']='kat_3_hol_1.jpg ivory folded blind'
    rod=solid_box('F2 | Hall curtain rod',(-5.91,lo[1]-.17,top+.015),(-5.89,hi[1]+.17,top+.035),bpy.data.materials['wood_dark'],2,.009)
    SC['hall_window_fitted']=True;bpy.context.view_layer.update()
    write_report('hall-window-fit.json',{'measured_glass_bounds':[lo,hi],'radiator_bounds':bounds(rad),'curtain_top':top})
    bpy.ops.wm.save_mainfile()

def add_photo_lounge_chairs():
    if SC.get('photo_lounge_chairs'):return
    blue=bpy.data.materials.new('Room pass | Lounge blue sling chair');blue.use_nodes=True
    blue.node_tree.nodes['Principled BSDF'].inputs['Base Color'].default_value=(.025,.12,.19,1)
    blue.node_tree.nodes['Principled BSDF'].inputs['Roughness'].default_value=.9
    brown=bpy.data.materials.new('Room pass | Lounge brown recliner');brown.use_nodes=True
    brown.node_tree.nodes['Principled BSDF'].inputs['Base Color'].default_value=(.075,.033,.027,1)
    brown.node_tree.nodes['Principled BSDF'].inputs['Roughness'].default_value=.88
    wood=bpy.data.materials['wood_honey.003']
    def part(name,lo,hi,mat,bevel=.015):return photo_note(solid_box('C05 | '+name,lo,hi,mat,3,bevel),'Photo-visible lounge seating, approximate product profile')
    # Blue timber chair faces the room (+X), leaving the west window unobstructed above it.
    part('Blue chair seat',(-5.71,.90,9.81),(-5.10,1.45,9.91),blue,.04)
    part('Blue chair back',(-5.79,.90,9.88),(-5.66,1.45,10.42),blue,.035)
    part('Blue chair head cushion',(-5.71,.92,10.32),(-5.59,1.43,10.48),blue,.035)
    for y in (.86,1.48):
        part('Blue chair timber skid',(-5.79,y-.023,9.485),(-5.10,y+.023,9.53),wood,.014)
        part('Blue chair front upright',(-5.15,y-.023,9.52),(-5.105,y+.023,10.005),wood,.014)
        part('Blue chair back upright',(-5.755,y-.023,9.52),(-5.71,y+.023,10.005),wood,.014)
        part('Blue chair timber arm',(-5.765,y-.033,9.99),(-5.095,y+.033,10.035),wood,.014)
    # Brown high-backed easy chair beside the blue sofa.
    part('Brown recliner base',(-5.78,2.62,9.50),(-5.09,3.32,9.78),brown,.065)
    part('Brown recliner seat',(-5.64,2.73,9.78),(-5.04,3.21,9.94),brown,.055)
    part('Brown recliner back',(-5.84,2.73,9.83),(-5.60,3.21,10.42),brown,.075)
    part('Brown recliner head cushion',(-5.78,2.72,10.24),(-5.51,3.22,10.49),brown,.07)
    for y in (2.60,3.23):part('Brown recliner arm',(-5.66,y,9.76),(-5.035,y+.115,10.085),brown,.05)
    SC['photo_lounge_chairs']=True;bpy.context.view_layer.update();bpy.ops.wm.save_mainfile()

def finish_lounge_buttons_and_desk():
    if SC.get('lounge_desk_and_buttons'):return
    archived=[]
    for o in list(SC.objects):
        if o.name.startswith('R33 | Subtle upholstery tuft'):
            archived.append(o.name);archive_object(o)
    # Replace the old floating buttons on three cushions with buttons seated in the new back.
    back=bpy.data.objects['C05 | Single button tufted sofa back'];mat=back.data.materials[0]
    bm=bmesh.new()
    for row in range(2):
        for col in range(7):
            u=(col+1)/8;v=(row+1)/3
            x=-4.672+1.644*u;z=9.925+.435*v
            puff=.032*(math.sin(math.pi*u)*math.sin(math.pi*v))**.35
            y=3.19+.11*v-puff+.027-.002
            result=bmesh.ops.create_icosphere(bm,subdivisions=2,radius=.006)
            for vert in result['verts']:vert.co=Vector((vert.co.x+x,vert.co.y*.4+y,vert.co.z+z))
    me=bpy.data.meshes.new('C05 inset fabric buttons');bm.to_mesh(me);bm.free()
    buttons=bpy.data.objects.new('C05 | Fourteen inset sofa buttons',me);bpy.data.collections['level-3'].objects.link(buttons);me.materials.append(mat)
    photo_note(buttons,'Buttons seated in the fourteen new tuft depressions')
    for p in me.polygons:p.use_smooth=True
    wood=bpy.data.materials['wood_dark.003'];trim=bpy.data.materials['wood_honey.003'];white=bpy.data.materials['white_trim.003']
    def box(label,lo,hi,material,bevel=.004):return photo_note(solid_box('C05 | '+label,lo,hi,material,3,bevel),'Writing desk and ivory chair visible below west window; fitted proportions')
    box('Window writing desk top',(-5.88,1.57,10.185),(-5.40,2.54,10.22),wood)
    for y in (1.59,2.31):
        box('Desk drawer pedestal',(-5.855,y,9.52),(-5.43,y+.21,10.185),wood)
        for k in range(3):
            z=9.56+k*.195
            box('Desk framed drawer',(-5.43,y+.012,z),(-5.407,y+.198,z+.18),trim,.003)
            box('Desk drawer brass pull',(-5.397,y+.075,z+.075),(-5.38,y+.135,z+.09),bpy.data.materials.get('brass')or white,.006)
    box('Desk middle drawer',(-5.83,1.82,10.075),(-5.409,2.30,10.18),wood)
    box('Ivory desk chair seat',(-5.29,1.85,9.885),(-4.93,2.27,9.94),white,.02)
    box('Ivory desk chair back',(-4.972,1.85,9.94),(-4.925,2.27,10.34),white,.018)
    for x in (-5.26,-4.97):
        for y in (1.88,2.24):box('Desk chair tapered leg',(x-.017,y-.017,9.48),(x+.017,y+.017,9.895),trim,.004)
    for o in SC.objects:
        if o.name.startswith('F2 | Hall tied curtain '):o.location.x+=.065
    SC['lounge_desk_and_buttons']=True
    write_report('sofa-floating-buttons-removed.json',archived)
    bpy.context.view_layer.update();bpy.ops.wm.save_mainfile()

def lounge_rug_and_hall_sconce():
    if SC.get('lounge_rug_hall_sconce'):return
    rug=bpy.data.objects['C05 | Low woven lounge rug']
    mat=bpy.data.materials.new('Room pass | Grey patchwork woven rug');mat.use_nodes=True
    nt=mat.node_tree;bs=nt.nodes['Principled BSDF'];bs.inputs['Roughness'].default_value=.98
    coord=nt.nodes.new('ShaderNodeTexCoord');brick=nt.nodes.new('ShaderNodeTexBrick')
    brick.inputs['Scale'].default_value=5;brick.inputs['Brick Width'].default_value=.7;brick.inputs['Row Height'].default_value=1.0
    brick.inputs['Mortar Size'].default_value=.005
    brick.inputs['Color1'].default_value=(.075,.082,.083,1);brick.inputs['Color2'].default_value=(.22,.225,.22,1);brick.inputs['Mortar'].default_value=(.105,.11,.105,1)
    nt.links.new(coord.outputs['Generated'],brick.inputs['Vector'])
    noise=nt.nodes.new('ShaderNodeTexNoise');noise.inputs['Scale'].default_value=110;noise.inputs['Detail'].default_value=3
    nt.links.new(coord.outputs['Generated'],noise.inputs['Vector'])
    mix=nt.nodes.new('ShaderNodeMixRGB');mix.blend_type='MULTIPLY';mix.inputs[0].default_value=.55
    nt.links.new(brick.outputs['Color'],mix.inputs[1]);nt.links.new(noise.outputs['Color'],mix.inputs[2]);nt.links.new(mix.outputs[0],bs.inputs['Base Color'])
    bump=nt.nodes.new('ShaderNodeBump');bump.inputs['Strength'].default_value=.22;bump.inputs['Distance'].default_value=.0007
    nt.links.new(noise.outputs['Fac'],bump.inputs['Height']);nt.links.new(bump.outputs[0],bs.inputs['Normal'])
    mat['fit_note']='Grey patchwork and worn weave interpreted from lounge photograph, not exact textile scan'
    mat['web_export_note']='Bake base colour and normal before glTF export'
    rug.data.materials.clear();rug.data.materials.append(mat)
    # Wall sconce visible above the first family portrait in the hall photo.
    gold=bpy.data.materials.get('brass')or bpy.data.materials['wood_honey']
    cream=bpy.data.materials.new('Room pass | Hall sconce parchment');cream.use_nodes=True
    cream.node_tree.nodes['Principled BSDF'].inputs['Base Color'].default_value=(.73,.59,.30,1)
    cream.node_tree.nodes['Principled BSDF'].inputs['Roughness'].default_value=.65
    x,y,z=-4.44,3.68,8.54
    vs=[];fs=[];rings=[(.088,0),(.049,.155),(.045,.155),(.084,0)]
    for radius,h in rings:
        for k in range(32):
            a=2*math.pi*k/32;vs.append((x+radius*math.cos(a),y+radius*math.sin(a),z+h))
    for ring in range(4):
        for k in range(32):fs.append((ring*32+k,ring*32+(k+1)%32,((ring+1)%4)*32+(k+1)%32,((ring+1)%4)*32+k))
    shade=make_mesh('F2 | Family gallery wall sconce shade',vs,fs,cream,2)
    shade['reference']='kat_3_hol_1.jpg left wall sconce above family gallery'
    for p in shade.data.polygons:p.use_smooth=True
    solid_box('F2 | Gallery sconce wall plate',(x-.025,3.80,z-.12),(x+.025,3.84,z+.025),gold,2,.018)
    solid_box('F2 | Gallery sconce arm',(x-.009,y,z-.065),(x+.009,3.81,z-.047),gold,2,.008)
    solid_box('F2 | Gallery sconce stem',(x-.009,y-.009,z-.06),(x+.009,y+.009,z+.025),gold,2,.008)
    light=bpy.data.lights.new('F2 gallery sconce warm light','POINT');light.energy=3;light.color=(1,.67,.30);light.shadow_soft_size=.025
    lamp=bpy.data.objects.new(light.name,light);bpy.data.collections['level-2'].objects.link(lamp);lamp.location=(x,y,z+.045)
    SC['lounge_rug_hall_sconce']=True;bpy.context.view_layer.update();bpy.ops.wm.save_mainfile()

def render_lounge_perspective():
    old=(SC.camera,SC.render.engine,SC.render.resolution_x,SC.render.resolution_y,SC.render.resolution_percentage,SC.render.filepath)
    data=bpy.data.cameras.get('C05 photo review')or bpy.data.cameras.new('C05 photo review')
    cam=bpy.data.objects.get('C05 photo review')
    if cam is None:cam=bpy.data.objects.new('C05 photo review',data);SC.collection.objects.link(cam)
    cam.location=(-2.02,.87,11.02);target=Vector((-4.78,2.42,10.12));cam.rotation_euler=(target-cam.location).to_track_quat('-Z','Y').to_euler();data.lens=21
    lampdata=bpy.data.lights.new('Temporary lounge review fill','POINT');lampdata.energy=70;lampdata.shadow_soft_size=.6
    lamp=bpy.data.objects.new(lampdata.name,lampdata);SC.collection.objects.link(lamp);lamp.location=(-3.5,1.2,11.45)
    try:
        SC.camera=cam;SC.render.engine='CYCLES';SC.cycles.samples=32;SC.cycles.use_denoising=True
        SC.render.resolution_x=1200;SC.render.resolution_y=900;SC.render.resolution_percentage=100
        SC.render.filepath=str(OUT/'attic-lounge-photo-review.png');bpy.ops.render.render(write_still=True)
    finally:
        SC.camera,SC.render.engine,SC.render.resolution_x,SC.render.resolution_y,SC.render.resolution_percentage,SC.render.filepath=old
        bpy.data.objects.remove(lamp,do_unlink=True);bpy.data.lights.remove(lampdata)
    bpy.ops.wm.save_mainfile()

def fit_lounge_floor_contacts():
    if SC.get('lounge_floor_contacts'):return
    groups={
      'blue chair':[o for o in SC.objects if o.name.startswith('C05 | Blue chair')],
      'brown recliner':[o for o in SC.objects if o.name.startswith('C05 | Brown recliner')],
      'coffee table':[o for o in SC.objects if o.name.startswith('C05 | Square ')],
      'side cabinet':[o for o in SC.objects if o.name.startswith('C05 | Sofa side cabinet') or o.name.startswith('C05 | Cabinet vertical')],
      'desk chair':[o for o in SC.objects if o.name.startswith('C05 | Ivory desk chair') or o.name.startswith('C05 | Desk chair tapered')],
    }
    rows=[]
    for label,objects in groups.items():
        lo=[min(bounds(o)[0][i] for o in objects) for i in range(3)]
        hi=[max(bounds(o)[1][i] for o in objects) for i in range(3)]
        hit=floor_finish_hit(3,Vector(((lo[0]+hi[0])/2,(lo[1]+hi[1])/2,9.47)))
        if not hit:continue
        dz=hit[0].z-lo[2]
        for o in objects:o.location.z+=dz
        rows.append({'assembly':label,'floor_z':hit[0].z,'vertical_correction':dz})
    # The desk pedestals have short feet, visible below their bottom board.
    for y in (1.62,2.47):
        for x in (-5.80,-5.48):
            p=floor_finish_hit(3,Vector((x,y,9.47)))
            assert p
            photo_note(solid_box('C05 | Desk short foot',(x-.025,y-.025,p[0].z),(x+.025,y+.025,9.526),bpy.data.materials['wood_dark.003'],3,.004),'Short desk feet fitted to actual floor')
    SC['lounge_floor_contacts']=True;bpy.context.view_layer.update();write_report('lounge-floor-contacts.json',rows)

def new_details_wall_intersections():
    from mathutils.bvhtree import BVHTree
    deps=bpy.context.evaluated_depsgraph_get()
    def tree(o):
        ev=o.evaluated_get(deps);me=ev.to_mesh();verts=[o.matrix_world@v.co for v in me.vertices];polys=[tuple(p.vertices)for p in me.polygons]
        result=BVHTree.FromPolygons(verts,polys);ev.to_mesh_clear();return result
    rows=[]
    for lev in (2,3):
        walls=[o for o in bpy.data.collections[f'level-{lev}'].objects if o.type=='MESH' and ('DUVAR' in o.name or 'partition core' in o.name or 'ÇATII' in o.name)]
        walltrees=[(w,tree(w)) for w in walls]
        targets=[o for o in bpy.data.collections[f'level-{lev}'].objects if o.type=='MESH' and (o.get('room_detail_pass')=='attic-furniture' or o.name.startswith(('F2 | Hall tied curtain','F2 | Roman blind','F2 | Gallery sconce','F2 | Family gallery wall sconce')))]
        for o in targets:
            own=tree(o)
            for w,other in walltrees:
                collisions=own.overlap(other)
                if collisions:rows.append({'object':o.name,'wall':w.name,'intersecting_face_pairs':len(collisions)})
    write_report('new-details-wall-intersections.json',rows);print('NEW DETAIL WALL INTERSECTIONS',len(rows))

def resolve_north_wall_fit():
    if SC.get('lounge_north_wall_fit'):return
    for o in SC.objects:
        if o.name.startswith('C05 | Brown recliner'):o.location.y-=.12
        if o.name.startswith(('C05 | Window writing desk','C05 | Desk drawer','C05 | Desk framed drawer','C05 | Desk middle drawer','C05 | Desk short foot')):
            inv=o.matrix_world.inverted()
            for v in o.data.vertices:
                p=o.matrix_world@v.co;p.y=1.57+(p.y-1.57)*(.83/.97);v.co=inv@p
            o.data.update()
        if o.name.startswith('C05 | Desk framed drawer'):
            o.data.materials.clear();o.data.materials.append(bpy.data.materials['wood_dark.003'])
    SC['lounge_north_wall_fit']=True;bpy.context.view_layer.update()

def final_detail_qa_and_save():
    attic_furniture_qa();new_details_wall_intersections()
    # Both attic additions and hall window/light additions must have closed evaluated meshes.
    hall=[];deps=bpy.context.evaluated_depsgraph_get()
    for o in SC.objects:
        if o.type!='MESH' or not o.name.startswith(('F2 | Hall tied curtain','F2 | Roman blind','F2 | Hall curtain rod','F2 | Gallery sconce','F2 | Family gallery wall sconce','F2 | Hall photographed radiator')):continue
        ev=o.evaluated_get(deps);me=ev.to_mesh();bm=bmesh.new();bm.from_mesh(me)
        hall.append({'name':o.name,'open_edges':sum(not e.is_manifold for e in bm.edges),'zero_area':sum(f.calc_area()<1e-10 for f in bm.faces)})
        bm.free();ev.to_mesh_clear()
    write_report('hall-details-mesh-qa.json',hall)
    assert not json.loads((OUT/'new-details-wall-intersections.json').read_text(encoding='utf-8'))
    assert all(r['open_edges']==0 and r['zero_area']==0 for r in hall)
    for file in ('attic-furniture-mesh-qa.json',):
        assert all(r['open_edges']==0 and r['zero_area']==0 for r in json.loads((OUT/file).read_text(encoding='utf-8')))
    complete_geometry_review()
    t=bpy.data.texts.get('native_attic_furniture.py')or bpy.data.texts.new('native_attic_furniture.py')
    t.clear();t.write((ROOT/'tools/native_attic_furniture.py').read_text(encoding='utf-8'))
    bpy.ops.file.pack_all();bpy.ops.wm.save_mainfile()
