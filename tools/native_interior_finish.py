"""Continue native Blender interior corrections; load into the roompass namespace."""

def inspect_roof_sections():
    roofs=[o for o in SC.objects if o.type=='MESH' and o.name.startswith('F3 |') and ('ÇATII' in o.name or 'TAVAN' in o.name)]
    planes=[];rays=[]
    for o in roofs:
        groups={}
        for p in o.data.polygons:
            vs=[o.matrix_world@o.data.vertices[i].co for i in p.vertices]
            n=(vs[1]-vs[0]).cross(vs[2]-vs[0])
            if n.length<1e-8:continue
            area=n.length/2;n.normalize()
            if abs(n.z)<.1:continue
            a,b,c=-n.x/n.z,-n.y/n.z,n.dot(vs[0])/n.z
            key=tuple(round(v,2) for v in (a,b,c))
            g=groups.setdefault(key,{'plane':key,'area':0,'bounds':[[float('inf')]*3,[-float('inf')]*3],'faces':0})
            g['area']+=area;g['faces']+=1
            for v in vs:
                for i in range(3):g['bounds'][0][i]=min(g['bounds'][0][i],v[i]);g['bounds'][1][i]=max(g['bounds'][1][i],v[i])
        planes.append({'object':o.name,'bounds':bounds(o),'planes':sorted(groups.values(),key=lambda g:-g['area'])[:30]})
        inv=o.matrix_world.inverted()
        for x in (-5.5,-4.5,-3.5,-2):
            for y in (.8,1.8,2.8,3.5):
                z=9.48;hits=[]
                for attempt in range(12):
                    found,p,n,idx=o.ray_cast(inv@Vector((x,y,z)),inv.to_3x3()@Vector((0,0,1)),distance=6)
                    if not found:break
                    p=o.matrix_world@p;hits.append({'height':p.z,'material':o.data.materials[o.data.polygons[idx].material_index].name});z=p.z+.004
                rays.append({'object':o.name,'xy':[x,y],'hits':hits})
    write_report('roof-plane-inspection.json',planes);write_report('roof-section-inspection.json',rays)
    print('ROOF SECTION INSPECTION',len(roofs))

def finish_material(name,color,rough=.65,metal=0):
    m=bpy.data.materials.get(name)or bpy.data.materials.new(name);m.use_nodes=True
    bs=m.node_tree.nodes.get('Principled BSDF');bs.inputs['Base Color'].default_value=(*color,1);bs.inputs['Roughness'].default_value=rough;bs.inputs['Metallic'].default_value=metal
    return m

def interior_note(o,room,reference,note):
    o['interior_finish_room']=room;o['reference']=reference;o['fit_note']=note;o['walk_role']='solid';return o

def rod_mesh(name,a,b,r,mat,level,sides=16):
    a,b=Vector(a),Vector(b);direction=(b-a).normalized();ref=Vector((0,0,1))if abs(direction.z)<.9 else Vector((1,0,0))
    u=direction.cross(ref).normalized();v=direction.cross(u);vs=[]
    for p in (a,b):
        vs.extend(tuple(p+r*(math.cos(k*math.tau/sides)*u+math.sin(k*math.tau/sides)*v))for k in range(sides))
    fs=[tuple(range(sides-1,-1,-1)),tuple(range(sides,2*sides))]
    fs.extend((k,(k+1)%sides,(k+1)%sides+sides,k+sides) for k in range(sides))
    return make_mesh(name,vs,fs,mat,level)

def lathe_solid(name,xy,profile,mat,level,sides=32):
    vs=[];fs=[]
    for radius,z in profile:
        for k in range(sides):
            a=math.tau*k/sides;vs.append((xy[0]+radius*math.cos(a),xy[1]+radius*math.sin(a),z))
    for ring in range(len(profile)-1):
        for k in range(sides):fs.append((ring*sides+k,ring*sides+(k+1)%sides,(ring+1)*sides+(k+1)%sides,(ring+1)*sides+k))
    fs.extend([tuple(range(sides-1,-1,-1)),tuple((len(profile)-1)*sides+k for k in range(sides))])
    o=make_mesh(name,vs,fs,mat,level)
    for p in o.data.polygons:p.use_smooth=len(p.vertices)==4
    return o

def image_material(name,path):
    image=bpy.data.images.load(str(ROOT/path),check_existing=True);image.pack()
    mat=bpy.data.materials.new(name);mat.use_nodes=True;nt=mat.node_tree;tex=nt.nodes.new('ShaderNodeTexImage');tex.image=image
    nt.links.new(tex.outputs['Color'],nt.nodes['Principled BSDF'].inputs['Base Color']);nt.nodes['Principled BSDF'].inputs['Roughness'].default_value=.85
    mat['reference']=path;mat['fit_note']='Original photo UV projection; existing photo lighting retained'
    return mat

def drape_panel(name,x0,x1,y,z0,z1,mat,level,uv_corners=None):
    vs=[];fs=[];uv=[];nx,nz=32,20
    for j in range(nz+1):
        t=j/nz
        for i in range(nx+1):
            u=i/nx;vs.append((x0+(x1-x0)*u,y+.026*math.cos(u*math.pi*10),z0+t*(z1-z0)))
            if uv_corners:
                a,b,c,d=uv_corners
                top=Vector(a)*(1-u)+Vector(b)*u;bottom=Vector(d)*(1-u)+Vector(c)*u;p=bottom*(1-t)+top*t;uv.append((p.x/1200,1-p.y/1600))
            else:uv.append((u,t))
    for j in range(nz):
        for i in range(nx):
            k=j*(nx+1)+i;fs.append((k,k+1,k+nx+2,k+nx+1))
    o=make_mesh(name,vs,fs,mat,level)
    for p in o.data.polygons:
        p.use_smooth=True
        for li in p.loop_indices:o.data.uv_layers.active.data[li].uv=uv[o.data.loops[li].vertex_index]
    mod=o.modifiers.new('Cloth thickness','SOLIDIFY');mod.thickness=.002
    return o

def bedroom_window_bounds(room):
    if room=='f2-106':
        # No glazing remains at this source opening. Use its native exterior frame.
        frame=bpy.data.objects['F2 | PENCERE_KAPI$CEPHE FRAME']
        ps=[frame.matrix_world@v.co for v in frame.data.vertices]
        ps=[p for p in ps if -5.1<p.x<-2.12 and p.y<-3.75 and p.z>6.3]
        assert ps
        return [[min(p.x for p in ps),-4.01,7.20],[max(p.x for p in ps),-3.99,max(p.z for p in ps)]]
    glass=bpy.data.objects['F2 | PENCERE_KAPI$CAM'];ps=[glass.matrix_world@v.co for v in glass.data.vertices]
    if room=='f2-106':ps=[p for p in ps if -5.1<p.x<-2.12 and p.y<-3.99 and p.z>6.5]
    else:ps=[p for p in ps if -1.96<p.x<1.05 and p.y<-4.99 and p.z>6.2]
    assert ps
    return [[min(p[i]for p in ps)for i in range(3)],[max(p[i]for p in ps)for i in range(3)]]

def fit_bedroom_curtains():
    if SC.get('bedroom_curtains_finish'):return
    path='kat_3_yatak_odalari/WhatsApp Image 2026-08-26 at 11.51.45 (2).jpeg'
    mat=image_material('Room finish | Bedroom original damask',path)
    black=finish_material('Room finish | Black iron',(.012,.014,.015),.32,.65)
    records=[]
    lo,hi=bedroom_window_bounds('f2-106');top=min(8.78,hi[2]+.37);plane=hi[1]+.155
    for side,(a,b) in enumerate([(lo[0]-.28,lo[0]+.10),(hi[0]-.10,hi[0]+.28)]):
        o=drape_panel(f'106 | Photographed damask side {side+1}',a,b,plane,6.397,top,mat,2,[(313,279),(428,289),(450,981),(302,986)])
        interior_note(o,'f2-106',path,'Two patterned side panels; fitted to existing window')
    rod=rod_mesh('106 | Black curtain pole',(lo[0]-.34,plane,top+.035),(hi[0]+.34,plane,top+.035),.012,black,2)
    interior_note(rod,'f2-106',path,'Black curtain pole above original opening')
    # Existing source has a floor-height exterior passage here. Do not obstruct it
    # with the photo radiator until the source opening/photo correspondence is resolved.
    records.append({'room':'f2-106','frame_fit':[lo,hi],'curtain_top':top,'unresolved':'Photo window/radiator versus current floor-height exterior opening; passage retained'})
    lo,hi=bedroom_window_bounds('f2-107');top=min(8.78,hi[2]+.13);plane=hi[1]+.17
    ivory=finish_material('Room finish | Bedroom ivory drape',(.73,.70,.63),.95)
    o=drape_panel('107 | Ivory door side curtain',hi[0]-.12,hi[0]+.34,plane,6.397,top,ivory,2)
    interior_note(o,'f2-107','kat_3_yatak_odalari_1.jpg','Ivory curtain beside balcony door, open walking passage retained')
    rod=rod_mesh('107 | Black curtain pole',(lo[0]-.12,plane,top+.035),(hi[0]+.39,plane,top+.035),.011,black,2)
    interior_note(rod,'f2-107','kat_3_yatak_odalari_1.jpg','Balcony door curtain pole')
    records.append({'room':'f2-107','glass':[lo,hi],'curtain_top':top})
    SC['bedroom_curtains_finish']=True;bpy.context.view_layer.update();write_report('bedroom-window-finishes.json',records)
    bpy.ops.file.pack_all();bpy.ops.wm.save_mainfile()

def bedroom_finish_qa():
    from mathutils.bvhtree import BVHTree
    deps=bpy.context.evaluated_depsgraph_get();rows=[];trees=[];hits=[]
    def tree(o):
        ev=o.evaluated_get(deps);me=ev.to_mesh()
        result=BVHTree.FromPolygons([o.matrix_world@v.co for v in me.vertices],[tuple(p.vertices)for p in me.polygons])
        ev.to_mesh_clear();return result
    for o in bpy.data.collections['level-2'].objects:
        if o.type=='MESH' and ('DUVAR' in o.name or 'TAVAN' in o.name or 'partition core' in o.name):trees.append((o,tree(o)))
    for o in SC.objects:
        if o.type!='MESH' or not o.get('interior_finish_room'):continue
        ev=o.evaluated_get(deps);me=ev.to_mesh();bm=bmesh.new();bm.from_mesh(me)
        rows.append({'name':o.name,'room':o['interior_finish_room'],'open_edges':sum(not e.is_manifold for e in bm.edges),'zero_area':sum(f.calc_area()<1e-10 for f in bm.faces),'bounds':bounds(o)})
        bm.free();ev.to_mesh_clear();own=tree(o)
        for wall,other in trees:
            overlap=own.overlap(other)
            if overlap:hits.append({'object':o.name,'wall':wall.name,'face_pairs':len(overlap)})
    write_report('bedroom-finish-mesh-qa.json',rows);write_report('bedroom-finish-wall-intersections.json',hits)
    print('BEDROOM FINISH QA',len(rows),'parts','open edges',sum(r['open_edges']for r in rows),'wall intersections',len(hits))
    complete_geometry_review()
    t=bpy.data.texts.get('native_interior_finish.py')or bpy.data.texts.new('native_interior_finish.py');t.clear();t.write((ROOT/'tools/native_interior_finish.py').read_text(encoding='utf-8'))
    bpy.ops.file.pack_all();bpy.ops.wm.save_mainfile()

def fit_bedroom_details_after_review():
    o=bpy.data.objects['107 | Ivory door side curtain']
    if not o.get('wall_fit_corrected'):
        o.location.y+=.065;o['wall_fit_corrected']=True
        bpy.data.objects['107 | Black curtain pole'].location.y+=.065
    rows=[]
    for name in ('R33 | Soft tailored pillow.002','R33 | Soft tailored pillow.003'):
        o=bpy.data.objects[name];bm=bmesh.new();bm.from_mesh(o.data)
        before=sum(not e.is_manifold for e in bm.edges)
        bmesh.ops.remove_doubles(bm,verts=list(bm.verts),dist=.000035)
        bmesh.ops.recalc_face_normals(bm,faces=list(bm.faces));after=sum(not e.is_manifold for e in bm.edges)
        bm.to_mesh(o.data);bm.free();o.data.update();rows.append({'object':name,'before_open_edges':before,'after_open_edges':after})
    write_report('bedroom-pillow-source-seams.json',rows);bpy.context.view_layer.update()

def wooden_bedroom_photo_details():
    if SC.get('wooden_bedroom_photo_details'):return
    ref='kat_3_yatak_odalari/WhatsApp Image 2026-08-26 at 11.51.46 (7).jpeg';removed=[]
    for o in list(bpy.data.collections['level-2'].objects):
        if o.type!='MESH' or not o.name.startswith(('Lamp ','Drawer ','R33 | Hollow case')):continue
        lo,hi=bounds(o)
        if -1.99<lo[0] and hi[0]<-.9 and -4.8<lo[1] and hi[1]<-2.0:
            removed.append(o.name);archive_object(o)
    old=bpy.data.objects['Headboard.002'];wood=old.data.materials[0];archive_object(old)
    n=40;y0,y1=-4.17,-2.53
    top=[7.59+.045*math.cos(t/n*math.tau)+.014*math.sin(t/n*math.tau*2)for t in range(n+1)]
    def shaped_board(name,x0,x1,base,cap=False):
        polygon=[(y0,base),(y1,base)]+[(y0+(y1-y0)*k/n,top[k])for k in range(n,-1,-1)] if not cap else [(y0+(y1-y0)*k/n,top[k]-.035)for k in range(n+1)]+[(y0+(y1-y0)*k/n,top[k]+.014)for k in range(n,-1,-1)]
        vs=[(x,y,z)for x in (x0,x1)for y,z in polygon];m=len(polygon)
        fs=[tuple(range(m-1,-1,-1)),tuple(range(m,m*2))]+[(k,(k+1)%m,(k+1)%m+m,k+m)for k in range(m)]
        o=make_mesh(name,vs,fs,wood,2);interior_note(o,'f2-107',ref,'Curved timber headboard and raised top moulding, photograph-fitted profile')
        return o
    shaped_board('107 | Curved timber headboard',-1.90,-1.80,6.576)
    shaped_board('107 | Headboard curved top rail',-1.915,-1.775,0,True)
    for yy in (y0,y1-.04):
        o=solid_box('107 | Headboard raised edge',(-1.915,yy,6.60),(-1.775,yy+.04,7.634),wood,2,.007);interior_note(o,'f2-107',ref,'Narrow raised timber edge')
    archive_object(bpy.data.objects['R33 | Soft tailored pillow.005'])
    o=bpy.data.objects['R33 | Soft tailored pillow.004'];o.data=o.data.copy();lo,hi=bounds(o);centre=Vector([(lo[i]+hi[i])/2 for i in range(3)])
    o.matrix_world=Matrix.Translation(Vector((-1.02,-3.35,7.095)))@Matrix.Rotation(math.radians(-12),4,'Z')@Matrix.Translation(-centre)@o.matrix_world
    pink=finish_material('Room finish | Pink gingham pillow',(.55,.21,.14),.92);nt=pink.node_tree;checker=nt.nodes.new('ShaderNodeTexChecker');checker.inputs['Scale'].default_value=72;checker.inputs['Color1'].default_value=(.65,.29,.22,1);checker.inputs['Color2'].default_value=(.87,.59,.43,1);nt.links.new(checker.outputs['Color'],nt.nodes['Principled BSDF'].inputs['Base Color'])
    o.data.materials.clear();o.data.materials.append(pink);interior_note(o,'f2-107',ref,'Single pink checked decorative cushion; ruffle and fabric pattern simplified')
    bm=bmesh.new();bm.from_mesh(o.data);bmesh.ops.remove_doubles(bm,verts=list(bm.verts),dist=.000035);bmesh.ops.recalc_face_normals(bm,faces=list(bm.faces));bm.to_mesh(o.data);bm.free()
    white=bpy.data.materials['white_trim.002']
    for k in range(9):
        x=.49+k*.049;o=solid_box('107 | Balcony side radiator fin',(x,-4.925,6.48),(x+.031,-4.845,7.43),white,2,.008);interior_note(o,'f2-107','kat_3_yatak_odalari/WhatsApp Image 2026-08-26 at 11.51.46 (9).jpeg','Narrow white radiator beside balcony opening, clear of curtain and passage')
    SC['wooden_bedroom_photo_details']=True;write_report('wooden-bedroom-removed-generic-fixtures.json',removed);bpy.context.view_layer.update();bpy.ops.wm.save_mainfile()

def render_bedroom_perspectives(rooms=None):
    old=(SC.camera,SC.render.resolution_x,SC.render.resolution_y,SC.render.filepath,SC.cycles.samples)
    light=bpy.data.objects['Room pass inspection fill'];light.hide_render=False;light.data.energy=85
    try:
        for room,position,target in [('106',(-2.32,-1.76,7.98),(-4.42,-2.96,7.55)),('107',(-.15,-4.55,7.95),(.4,-2.5,7.5)),('107-bed',(.65,-2.7,7.98),(-1.15,-3.65,7.43))]:
            if rooms and room not in rooms:continue
            name=room+' bedroom photo review';cam=bpy.data.objects.get(name)
            if cam is None:cam=bpy.data.objects.new(name,bpy.data.cameras.new(name));bpy.data.collections['Review cameras'].objects.link(cam)
            cam.location=position;cam.rotation_euler=(Vector(target)-cam.location).to_track_quat('-Z','Y').to_euler();cam.data.lens=21;cam.data.clip_start=.03
            light.location=Vector(position)+Vector((0,0,.2));SC.camera=cam;SC.cycles.samples=24;SC.render.resolution_x=1200;SC.render.resolution_y=900
            SC.render.filepath=str(OUT/(room+'-bedroom-photo-review.png'));bpy.ops.render.render(write_still=True)
    finally:
        light.hide_render=True;SC.camera,SC.render.resolution_x,SC.render.resolution_y,SC.render.filepath,SC.cycles.samples=old
    bpy.ops.wm.save_mainfile()

def wooden_wardrobe_mirror():
    o=bpy.data.objects['R33 | Wardrobe recessed front.006']
    if o.get('photo_mirror_finish'):return
    o.data=o.data.copy();mirror=finish_material('Room finish | Wardrobe mirror',(.93,.95,.97),.025,1)
    o.data.materials.clear();o.data.materials.append(mirror)
    interior_note(o,'f2-107','kat_3_yatak_odalari/WhatsApp Image 2026-08-26 at 11.51.46 (7).jpeg','Mirror on existing end wardrobe panel; original panel dimensions retained')
    bm=bmesh.new();bm.from_mesh(o.data);bmesh.ops.remove_doubles(bm,verts=list(bm.verts),dist=.000035);bmesh.ops.recalc_face_normals(bm,faces=list(bm.faces));bm.to_mesh(o.data);bm.free();o['photo_mirror_finish']=True
    bpy.context.view_layer.update()

def settle_headboard_edge_joint():
    for o in SC.objects:
        if not o.name.startswith('107 | Headboard raised edge') or o.get('joint_fit'):continue
        # Offset the moulding face from the top rail's face to avoid coplanar flicker.
        for v in o.data.vertices:
            if v.co.x> -1.79:v.co.x=-1.770
        o.data.update();o['joint_fit']=True
    bpy.context.view_layer.update()

def bedroom_crown_moldings():
    if SC.get('bedroom_crown_finish'):return
    spaces=json.loads((ROOT/'build/web/full/room-spaces.json').read_text(encoding='utf-8'))
    profile=[(.003,-.13),(.018,-.13),(.024,-.118),(.021,-.110),(.036,-.10),(.047,-.060),(.075,-.034),(.09,-.025),(.09,-.004),(.003,-.004)]
    white=bpy.data.materials['white_trim.002'];rows=[]
    for room,spaceid,sample in [('f2-106','f2-S5',(-3,-3,8.8)),('f2-107','f2-S6',(0,-3,8.8))]:
        hit=ray_info(sample,(0,0,1),.4);assert hit and 'TAVAN' in hit['object'],hit
        top=hit['point'][2]
        points=[Vector((x,-y))for x,y in next(s['boundary_xz']for s in spaces['spaces']if s['space_id']==spaceid)]
        # Eliminate a 27 mm raster step; it is smaller than the measured finish offset.
        points=[p for i,p in enumerate(points) if (p-points[i-1]).length>.04]
        area=sum(a.x*b.y-b.x*a.y for a,b in zip(points,points[1:]+points[:1]))
        if area<0:points.reverse()
        vs=[];fs=[];n=len(points);m=len(profile)
        for i,p in enumerate(points):
            before=(p-points[i-1]).normalized();after=(points[(i+1)%n]-p).normalized()
            na=Vector((-before.y,before.x));nb=Vector((-after.y,after.x));mitre=(na+nb)/max(.2,1+na.dot(nb))
            for dist,dz in profile:
                q=p+mitre*dist;vs.append((q.x,q.y,top+dz))
        for i in range(n):
            for j in range(m):fs.append((i*m+j,i*m+(j+1)%m,((i+1)%n)*m+(j+1)%m,((i+1)%n)*m+j))
        o=make_mesh(room+' | Fitted stepped ceiling cornice',vs,fs,white,2)
        interior_note(o,room,'kat_3_yatak_odalari_1.jpg','Stepped white cornice following registered finished room boundary; ceiling height ray verified')
        rows.append({'room':room,'ceiling_height':top,'segments':n})
    SC['bedroom_crown_finish']=True;write_report('bedroom-crown-finishes.json',rows);bpy.ops.wm.save_mainfile()

def iron_bedroom_photo_details():
    if SC.get('iron_bedroom_photo_details'):return
    reference='kat_3_yatak_odalari/WhatsApp Image 2026-08-26 at 11.51.45 (2).jpeg'
    black=finish_material('Room finish | Black iron',(.012,.014,.015),.32,.65)
    removed=[]
    prefixes=('Lamp ','Drawer ','R33 | Hollow case','Chandelier ','Curved chandelier','Candle ')
    for o in list(bpy.data.collections['level-2'].objects):
        if o.type!='MESH' or not o.name.startswith(prefixes):continue
        lo,hi=bounds(o)
        if not (-5.1<lo[0] and hi[0]<-2.11 and -3.95<lo[1] and hi[1]<-.7):continue
        removed.append(o.name);archive_object(o)
    # A dark round folding bedside table, as visible beside the window.
    x,y=-4.57,-3.5;z=6.998
    table=lathe_solid('106 | Round black bedside tabletop',(x,y),[(.26,z-.028),(.27,z-.020),(.27,z),(.26,z+.007)],black,2)
    interior_note(table,'f2-106',reference,'Photographed dark round table replaces two generic timber drawer cabinets')
    for yy in (y-.17,y+.17):
        for direction in (-1,1):
            o=rod_mesh('106 | Folding table crossed leg',(x-.20*direction,yy,6.38),(x+.19*direction,yy,z-.02),.012,black,2)
            interior_note(o,'f2-106',reference,'Crossed folding-table legs')
    green=finish_material('Room finish | Dark green desk lamp',(.015,.035,.029),.25,.55)
    for name,profile in [('base',[(.08,z+.006),(.08,z+.023),(.058,z+.037)]),('shade',[(.105,z+.325),(.105,z+.34),(.092,z+.385),(.06,z+.420),(.018,z+.44)])]:
        o=lathe_solid('106 | Green bedside lamp '+name,(x-.03,y+.025),profile,green,2)
        interior_note(o,'f2-106',reference,'Small dark green metal table lamp; profile interpreted from photo')
    o=rod_mesh('106 | Green bedside lamp stem',(x-.03,y+.025,z+.025),(x-.03,y+.025,z+.35),.008,green,2)
    interior_note(o,'f2-106',reference,'Metal lamp stem')
    # Black three-shade ceiling fitting instead of the generic gold candle chandelier.
    center=Vector((-3.9,-2,8.74))
    o=rod_mesh('106 | Black light suspension',center,(-3.9,-2,8.982),.014,black,2);interior_note(o,'f2-106',reference,'Black three-shade ceiling fitting')
    inner=finish_material('Room finish | Warm opal lamp',(.8,.74,.59),.4)
    for k in range(3):
        a=k*math.tau/3;pos=center+Vector((math.cos(a)*.27,math.sin(a)*.27,-.065))
        o=rod_mesh('106 | Black light radial arm',center,pos,.009,black,2);interior_note(o,'f2-106',reference,'Three small radial black arms')
        o=lathe_solid('106 | Black ceiling shade',(pos.x,pos.y),[(.070,pos.z-.12),(.065,pos.z-.08),(.028,pos.z)],black,2)
        interior_note(o,'f2-106',reference,'Downward dark shade fitted from visible photo')
        o=lathe_solid('106 | Ceiling shade diffuser',(pos.x,pos.y),[(.055,pos.z-.124),(.055,pos.z-.119)],inner,2)
        interior_note(o,'f2-106',reference,'Small opaque diffuser below shade')
    # Place the actual long framed artwork on the headboard wall.
    path='kat_3_yatak_odalari/WhatsApp Image 2026-08-26 at 11.51.46 (1).jpeg'
    mat=image_material('Room finish | Original bedroom line artwork',path)
    vs=[(-4.973,-3.025,7.91),(-4.973,-1.875,7.91),(-4.973,-1.875,8.40),(-4.973,-3.025,8.40)]
    art=make_mesh('106 | Original framed line artwork',vs,[(0,1,2,3)],mat,2)
    # Native left/right correspond to the source perspective's horizontal direction.
    uvs=[(43/1200,1-526/1600),(505/1200,1-533/1600),(506/1200,1-352/1600),(24/1200,1-305/1600)]
    for p in art.data.polygons:
        for li in p.loop_indices:art.data.uv_layers.active.data[li].uv=uvs[art.data.loops[li].vertex_index]
    mod=art.modifiers.new('Frame back thickness','SOLIDIFY');mod.thickness=.022
    interior_note(art,'f2-106',path,'Actual photograph of framed artwork; dimension fitted to bed width')
    pillowmat=finish_material('Room finish | Bedroom brown check pillows',(.25,.16,.085),.95)
    nt=pillowmat.node_tree;tex=nt.nodes.new('ShaderNodeTexChecker');tex.inputs['Color1'].default_value=(.35,.23,.12,1);tex.inputs['Color2'].default_value=(.72,.61,.44,1);tex.inputs['Scale'].default_value=48
    nt.links.new(tex.outputs['Color'],nt.nodes['Principled BSDF'].inputs['Base Color']);pillowmat['fit_note']='Small brown/cream checks approximate the photographed houndstooth textile'
    for name in ('R33 | Soft tailored pillow.002','R33 | Soft tailored pillow.003'):
        o=bpy.data.objects[name];lo,hi=bounds(o);centre=Vector([(lo[i]+hi[i])/2 for i in range(3)])
        target=Vector((-4.68,centre.y,7.14));o.matrix_world=Matrix.Translation(target)@Matrix.Rotation(math.radians(60),4,'Y')@Matrix.Translation(-centre)@o.matrix_world
        o.data=o.data.copy();o.data.materials.clear();o.data.materials.append(pillowmat)
        interior_note(o,'f2-106',path,'Pillows propped against iron headboard; brown checked fabric')
    SC['iron_bedroom_photo_details']=True;bpy.context.view_layer.update();write_report('iron-bedroom-removed-generic-fixtures.json',removed)
    bpy.ops.file.pack_all();bpy.ops.wm.save_mainfile()
