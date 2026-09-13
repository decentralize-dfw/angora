"""Native Blender interior completion, using the existing roompass namespace."""

def inspect_completion_sources():
    rows=[]
    for o in bpy.data.collections['level-2'].objects:
        if o.type!='MESH':continue
        lo,hi=bounds(o)
        if lo[0]>-5.2 and hi[0]<-2.3 and lo[1]>-5.1 and hi[1]<-3.9:
            rows.append({'name':o.name,'bounds':[lo,hi],'materials':[m.name if m else None for m in o.data.materials]})
    write_report('106-existing-exterior-joinery.json',rows)
    rows=[]
    for o in bpy.data.collections['level-3'].objects:
        if o.type!='MESH' or not any(s in o.name for s in ('DUVAR','ÇATII','partition core','TAVAN')):continue
        ps=[o.matrix_world@v.co for v in o.data.vertices]
        subset=[p for p in ps if -6.5<p.x<-1.1 and .3<p.y<3.9 and p.z>10.6]
        rows.append({'name':o.name,'bounds':bounds(o),'materials':[m.name if m else None for m in o.data.materials],'bay_vertices':sorted(set(tuple(round(v,4)for v in p)for p in subset))})
    write_report('attic-bay-structure.json',rows)
    roof=bpy.data.objects['F3 | ÇATII']
    write_report('roof-native-before-completion.json',{'vertices':[list(roof.matrix_world@v.co)for v in roof.data.vertices],'faces':[list(p.vertices)for p in roof.data.polygons],'materials':[p.material_index for p in roof.data.polygons]})
    print('COMPLETION SOURCE INSPECTION SAVED')

def completion_note(o,room,note):
    o['interior_completion_room']=room;o['fit_note']=note;o['walk_role']='solid';return o

def fix_106_photographed_window():
    if SC.get('completion_106_window'):return
    records=json.loads((OUT/'106-existing-exterior-joinery.json').read_text(encoding='utf-8'));changed=[]
    for row in records:
        o=bpy.data.objects[row['name']]
        if not o.name.startswith('R33 |'):continue
        old=o.data;old.use_fake_user=True;o.data=old.copy();inv=o.matrix_world.inverted()
        for v in o.data.vertices:
            p=o.matrix_world@v.co;p.z=7.11+(p.z-6.3714)*(8.3296-7.11)/(8.3296-6.3714);v.co=inv@p
        bm=bmesh.new();bm.from_mesh(o.data);bmesh.ops.remove_doubles(bm,verts=list(bm.verts),dist=.000035);bmesh.ops.recalc_face_normals(bm,faces=list(bm.faces));bm.to_mesh(o.data);bm.free()
        o['original_joinery_name']=o.name;o.name='106 window | '+o.name.replace('R33 | ','');completion_note(o,'f2-106','Photo-identified window: former generic floor-height joinery shortened above a visible parapet; source mesh retained')
        changed.append(o.name)
    plaster=bpy.data.materials['interior.002'];white=bpy.data.materials['white_trim.002']
    o=solid_box('106 | Visible photographed window parapet',(-4.1766,-4.215,6.371),(-2.9866,-3.9928,7.081),plaster,2)
    completion_note(o,'f2-106','Visible opaque parapet below photo window; this is not a doorway or walking route');o['intentional_wall_join']=True
    o=solid_box('106 | Window marble sill',(-4.185,-4.23,7.081),(-2.978,-3.945,7.11),white,2,.004);completion_note(o,'f2-106','Photo window sill fitted to frame');o['intentional_wall_join']=True
    for k in range(16):
        x=-4.095+k*.062;o=solid_box('106 | Photographed radiator fin',(x,-3.934,6.47),(x+.040,-3.85,7.025),white,2,.007);completion_note(o,'f2-106','Photographed white radiator below window; clear of the bed and curtain')
    SC['completion_106_window']=True;write_report('106-window-completed.json',{'objects':changed,'sill':7.11,'source':'kat_3_yatak_odalari/WhatsApp Image 2026-08-26 at 11.51.45 (2).jpeg','interpretation':'Window identification visually confirmed; sill dimension fitted to photograph, not a surveyed measurement'})
    bpy.context.view_layer.update();bpy.ops.wm.save_mainfile()

def bay_old_height(x,y):
    return max(.69*x+12.80,12.02-.6912*abs(y-2.0281))

def bay_height_delta(x,y):
    if x>=-.49 or y<=.06279 or y>=3.994472:return 0.0
    weight=min(1.,max(0.,(y-.06279)/.40),max(0.,(3.994472-y)/.40))
    return max(0.,max(.69*x+12.80,12.17-.145*abs(y-2.0281))-bay_old_height(x,y))*weight

def fit_attic_lounge_ceiling():
    if SC.get('completion_attic_ceiling'):return
    changed=[]
    targets=[o for o in bpy.data.collections['level-3'].objects if o.type=='MESH' and any(s in o.name for s in ('DUVAR','ÇATII','partition core'))]
    for o in targets:
        old=o.data;old.use_fake_user=True;o.data=old.copy();bm=bmesh.new();bm.from_mesh(o.data);bm.transform(o.matrix_world)
        if 'ÇATII' in o.name:
            # Subdivide only the local bay so the new shallow ceiling meets the retained main roof.
            for axis,values in [(0,[-6.56+i*.20 for i in range(31)]),(1,[.06279,.46279,2.0281,3.594472,3.994472]+[.1+i*.2 for i in range(20)])]:
                for value in values:
                    chosen=[f for f in bm.faces if any(v.co.x<-.48 and -.01<v.co.y<4.05 and v.co.z>9.8 for v in f.verts)]
                    if not chosen:continue
                    geom=set(chosen)
                    for f in chosen:geom.update(f.edges);geom.update(f.verts)
                    co=Vector((0,0,0));co[axis]=value;normal=Vector((0,0,0));normal[axis]=1
                    bmesh.ops.bisect_plane(bm,geom=list(geom),dist=.00001,plane_co=co,plane_no=normal,clear_inner=False,clear_outer=False)
        count=0;maximum=0.
        for v in bm.verts:
            p=v.co;delta=bay_height_delta(p.x,p.y)
            if delta<=0 or p.z<9.9:continue
            if 'ÇATII' not in o.name:
                # Preserve window/door geometry below the upper wall; extend only the high section.
                fraction=min(1.,max(0.,(p.z-10.5)/max(.15,bay_old_height(p.x,p.y)-10.5)))
                delta*=fraction
            p.z+=delta;count+=1;maximum=max(maximum,delta)
        bmesh.ops.remove_doubles(bm,verts=list(bm.verts),dist=.00002)
        bmesh.ops.recalc_face_normals(bm,faces=list(bm.faces));bm.transform(o.matrix_world.inverted());bm.to_mesh(o.data);bm.free();o.data.update()
        o['photo_ceiling_fit']='C05: upper wall and shallow cross-bay ceiling fitted to source photos; original mesh preserved'
        changed.append({'object':o.name,'moved_vertices':count,'maximum_raise':maximum})
    SC['completion_attic_ceiling']=True;bpy.context.view_layer.update();write_report('attic-ceiling-photo-fit.json',{'changes':changed,'ridge_inner_z':12.17,'inner_slope':.145,'floor_z':9.46977,'source':'kat_4/WhatsApp Image 2026-08-26 at 11.53.10 (2).jpeg','dimension_status':'Photo-proportioned reconstruction, not surveyed elevations; main roof retained outside the cross-bay'})
    bpy.ops.wm.save_mainfile()

def fit_bay_roof_details():
    if SC.get('completion_bay_details'):return
    rows=[]
    for o in SC.objects:
        if o.type!='MESH' or not (o.name.startswith('Projected clay tile') or (o.name.startswith('F3 |') and any(s in o.name for s in ('ÇATI ALIN','ek dalgalar')))):continue
        old=o.data;old.use_fake_user=True;o.data=old.copy();inv=o.matrix_world.inverted();count=0
        for v in o.data.vertices:
            p=o.matrix_world@v.co
            if p.z<10.5:continue
            d=bay_height_delta(p.x,p.y)
            if d>0:p.z+=d;v.co=inv@p;count+=1
        o.data.update();rows.append({'object':o.name,'vertices_moved':count})
    SC['completion_bay_details']=True;write_report('bay-roof-details-fit.json',rows);bpy.context.view_layer.update()

def clip_wall_opening(o,planes,y_range,label):
    # Subtract a convex XZ aperture from existing faces. Keep UVs and material slots.
    old=o.data;old.use_fake_user=True;world=[o.matrix_world@v.co for v in old.vertices];uv=old.uv_layers.active
    vs=[];uvs=[];fs=[];mats=[];cut_count=0
    def emit(poly,mi):
        if len(poly)<3:return
        ids=[]
        for p,t in poly:ids.append(len(vs));vs.append(tuple(p));uvs.append(tuple(t))
        fs.append(ids);mats.append(mi)
    def divide(poly,n,b):
        inside=[];outside=[]
        for j,a in enumerate(poly):
            c=poly[(j+1)%len(poly)];da=n.dot(a[0])-b;dc=n.dot(c[0])-b
            (inside if da<=1e-8 else outside).append(a)
            if (da<0 and dc>0) or (da>0 and dc<0):
                t=da/(da-dc);p=(a[0].lerp(c[0],t),a[1].lerp(c[1],t));inside.append(p);outside.append(p)
        return inside,outside
    for f in old.polygons:
        poly=[(world[old.loops[li].vertex_index],Vector(uv.data[li].uv) if uv else Vector((world[old.loops[li].vertex_index].x,world[old.loops[li].vertex_index].z)))for li in f.loop_indices]
        if min(p.y for p,t in poly)<y_range[0] or max(p.y for p,t in poly)>y_range[1]:emit(poly,f.material_index);continue
        remain=poly;outs=[]
        for n,b in planes:
            if len(remain)<3:break
            remain,out=divide(remain,n,b)
            if len(out)>=3:outs.append(out)
        if len(remain)<3:emit(poly,f.material_index);continue
        cut_count+=1
        for piece in outs:emit(piece,f.material_index)
    if not cut_count:return 0
    mesh=bpy.data.meshes.new(old.name+' '+label);inv=o.matrix_world.inverted();mesh.from_pydata([inv@Vector(v)for v in vs],[],fs)
    for mat in old.materials:mesh.materials.append(mat)
    layer=mesh.uv_layers.new(name='UVMap')
    for f,mi in zip(mesh.polygons,mats):
        f.material_index=mi
        for li in f.loop_indices:layer.data[li].uv=uvs[mesh.loops[li].vertex_index]
    bm=bmesh.new();bm.from_mesh(mesh);bmesh.ops.remove_doubles(bm,verts=list(bm.verts),dist=.000015)
    tiny=[f for f in bm.faces if f.calc_area()<1e-12]
    if tiny:bmesh.ops.delete(bm,geom=tiny,context='FACES')
    bmesh.ops.recalc_face_normals(bm,faces=list(bm.faces));bm.to_mesh(mesh);bm.free();mesh.update();o.data=mesh
    o[label]=cut_count;return cut_count

def ring_y(name,cx,cz,y0,y1,ri,ro,mat,level=3):
    vs=[];fs=[];n=48
    for y,r in [(y0,ri),(y0,ro),(y1,ri),(y1,ro)]:
        vs.extend((cx+r*math.cos(k*math.tau/n),y,cz+r*math.sin(k*math.tau/n))for k in range(n))
    for k in range(n):
        j=(k+1)%n
        for a,b in [(0,n),(n,3*n),(3*n,2*n),(2*n,0)]:fs.append((a+k,a+j,b+j,b+k))
    return make_mesh(name,vs,fs,mat,level)

def finish_lounge_photo_details():
    if SC.get('completion_lounge_photo_details'):return
    fit_bay_roof_details();cx,cz,r=-5.40,11.22,.235;n=48
    planes=[]
    for k in range(n):
        a=(k+.5)*math.tau/n;normal=Vector((math.cos(a),0,math.sin(a)));planes.append((normal,normal.dot(Vector((cx,0,cz)))+r*math.cos(math.pi/n)))
    rows=[]
    for o in list(bpy.data.collections['level-3'].objects):
        if o.type=='MESH' and any(s in o.name for s in ('DUVAR','partition core')):
            count=clip_wall_opening(o,planes,(3.20,3.90),'C05 real circular opening');rows.append({'object':o.name,'cut_faces':count})
    white=bpy.data.materials['white_trim.003'];wood=bpy.data.materials['wood_dark.003'];glass=bpy.data.materials['glass.003']
    for name,y0,y1,ri,ro,mat in [('Plaster circular reveal',3.268,3.578,.230,.255,white),('Round timber window frame',3.493,3.563,.194,.232,wood),('Round interior trim',3.263,3.284,.226,.266,white)]:
        o=ring_y('C05 | '+name,cx,cz,y0,y1,ri,ro,mat);completion_note(o,'f3-C05','Photographed circular window; visible opening cut through native wall layers');o['intentional_wall_join']=True
    o=rod_mesh('C05 | Circular physical glazing',(cx,3.525,cz),(cx,3.531,cz),.194,glass,3,48);completion_note(o,'f3-C05','Visible glass with thickness in actual circular wall opening');o['walk_role']='glass'
    ref='kat_4/WhatsApp Image 2026-08-26 at 11.52.44 (17).jpeg';artmat=image_material('C05 | Original four framed paintings',ref)
    frames=[(-4.64,11.37,.34,.62,[(416,417),(504,405),(507,580),(422,578)]),(-4.22,11.24,.42,.48,[(506,455),(621,443),(622,589),(508,583)]),(-3.64,11.43,.56,.76,[(622,379),(796,343),(790,560),(623,562)]),(-2.94,11.28,.64,.56,[(794,424),(992,395),(986,578),(790,572)])]
    for k,(x,z,w,h,corners)in enumerate(frames):
        back=solid_box('C05 | Painting frame depth '+str(k+1),(x-w/2,3.499,z-h/2),(x+w/2,3.522,z+h/2),wood,3,.003);completion_note(back,'f3-C05','Four original frame proportions and arrangement, fitted from source photo')
        verts=[(x-w/2,3.495,z+h/2),(x+w/2,3.495,z+h/2),(x+w/2,3.495,z-h/2),(x-w/2,3.495,z-h/2)]
        o=make_mesh('C05 | Original framed art '+str(k+1),verts,[(0,1,2,3)],artmat,3)
        for f in o.data.polygons:
            for li in f.loop_indices:
                px,py=corners[o.data.loops[li].vertex_index];o.data.uv_layers.active.data[li].uv=(px/1200,1-py/1600)
        mod=o.modifiers.new('Thin picture surface','SOLIDIFY');mod.thickness=.001
        completion_note(o,'f3-C05','Actual local photograph of artwork; original photo lighting retained');o['walk_role']='decoration';o['reference']=ref
    for k in range(9):
        x=-5.62+k*.059;o=solid_box('C05 | Radiator below circular window',(x,3.172,9.63),(x+.042,3.254,10.08),white,3,.005);completion_note(o,'f3-C05','Visible white radiator below round window, behind recliner')
    # Three swept white blades and motor, fitted above the coffee table.
    fx,fy=-4.43,2.0281
    for name,profile in [('Ceiling fan canopy',[(.07,12.153),(.11,12.145),(.075,12.085)]),('Ceiling fan motor',[(.075,11.87),(.15,11.82),(.15,11.72),(.08,11.675)])]:
        completion_note(lathe_solid('C05 | '+name,(fx,fy),profile,white,3),'f3-C05','Photographed white ceiling fan; simplified visible profile')
    completion_note(rod_mesh('C05 | Ceiling fan downrod',(fx,fy,11.83),(fx,fy,12.11),.018,white,3),'f3-C05','Ceiling fan suspension')
    outline=[(.12,-.045),(.30,-.09),(.57,-.12),(.66,-.08),(.65,.06),(.56,.09),(.29,.04),(.12,.035)]
    for k in range(3):
        a=k*math.tau/3;vs=[]
        for z in [11.79,11.802]:
            vs.extend((fx+x*math.cos(a)-y*math.sin(a),fy+x*math.sin(a)+y*math.cos(a),z)for x,y in outline)
        count=len(outline);fs=[tuple(range(count-1,-1,-1)),tuple(range(count,count*2))]+[(i,(i+1)%count,(i+1)%count+count,i+count)for i in range(count)]
        completion_note(make_mesh('C05 | White ceiling fan blade',vs,fs,white,3),'f3-C05','Swept white fan blade; overhead clearance exceeds 2.2 m')
    SC['completion_lounge_photo_details']=True;write_report('lounge-round-window-cut.json',rows);bpy.context.view_layer.update();bpy.ops.file.pack_all();bpy.ops.wm.save_mainfile()

def rect_planes(x0,x1,z0,z1):
    return [(Vector((-1,0,0)),-x0),(Vector((1,0,0)),x1),(Vector((0,0,-1)),-z0),(Vector((0,0,1)),z1)]

def correct_107_balcony_door():
    if SC.get('completion_107_balcony'):return
    rows=[]
    for o in list(bpy.data.collections['level-2'].objects):
        if o.type!='MESH':continue
        if 'DUVAR' in o.name or 'Fitted walnut skirtings' in o.name:
            count=clip_wall_opening(o,rect_planes(-1.057,.1433,6.3711,8.3001),(-5.6,-4.94),'107 balcony opening')
        elif 'PENCERE_KAPI' in o.name:
            count=clip_wall_opening(o,rect_planes(-1.017,.103,7.09,8.31),(-5.205,-5.12),'107 replaced window joinery')
        else:continue
        if count:rows.append({'object':o.name,'cut_faces':count})
    wood=bpy.data.materials['wood_dark.002'];glass=bpy.data.materials['glass.002'];white=bpy.data.materials['white_trim.002'];brass=bpy.data.materials.get('brass.002')or bpy.data.materials['R31 | R35 door brass']
    def part(name,lo,hi,mat=wood):
        o=solid_box('107 balcony | '+name,lo,hi,mat,2,.0015);completion_note(o,'f2-107','Photographed full-height glazed balcony door; replaces the generic parapet window');return o
    x0,x1=-1.057,.1433;y=-5.16;z0,z1=6.379,8.30
    for label,lo,hi in [('Left fixed jamb',(x0,y-.046,z0),(x0+.055,y+.046,z1)),('Right fixed jamb',(x1-.055,y-.046,z0),(x1,y+.046,z1)),('Fixed lintel',(x0,y-.046,z1-.055),(x1,y+.046,z1))]:
        o=part(label,lo,hi);o['intentional_wall_join']=True
    # New lower reveal faces close the exposed wall thickness while retaining a clear passage.
    for label,lo,hi in [('Left plaster reveal',(x0-.018,-5.33,6.371),(x0,-4.988,7.105)),('Right plaster reveal',(x1,-5.33,6.371),(x1+.018,-4.988,7.105))]:
        o=part(label,lo,hi,bpy.data.materials['interior.002']);o['intentional_wall_join']=True
    for side in [0,1]:
        hx=(x0+.062)if side==0 else(x1-.062);sign=1 if side==0 else -1;width=(x1-x0-.124)/2-.005
        hinge=Vector((hx,y,z0+.009));rotation=Matrix.Rotation(-math.pi/2 if side==0 else math.pi/2,4,'Z');group=[]
        def leaf_box(label,a,b,mat=wood):
            ax=hx+sign*a[0];bx=hx+sign*b[0]
            o=part(label,(min(ax,bx),y+a[1],hinge.z+a[2]),(max(ax,bx),y+b[1],hinge.z+b[2]),mat)
            o.matrix_world=Matrix.Translation(hinge)@rotation@Matrix.Translation(-hinge)@o.matrix_world
            o['door_id']='f2-balcony-107';o['open_angle_deg']=90.;o['door_part']='external_leaf';group.append(o);return o
        height=z1-.066-hinge.z
        for label,a,b in [('Hinge stile',(0,-.021,0),(.045,.021,height)),('Latch stile',(width-.045,-.021,0),(width,.021,height)),('Bottom rail',(.045,-.021,0),(width-.045,.021,.08)),('Top rail',(.045,-.021,height-.055),(width-.045,.021,height)),('Mid rail',(.045,-.021,.87),(width-.045,.021,.925))]:leaf_box(str(side+1)+' '+label,a,b)
        for a,b in [(.08,.87),(.925,height-.055)]:
            o=leaf_box(str(side+1)+' Clear physical glass',(.045,-.005,a),(width-.045,.005,b),glass);o['walk_role']='glass'
        leaf_box(str(side+1)+' Brass handle',(width-.085,.023,.90),(width-.069,.062,1.02),brass)
    sill=part('Flush marble threshold',(-1.057,-5.36,6.292),(.1433,-4.975,6.3711),white);sill['intentional_wall_join']=True;sill['walk_role']='floor'
    # White side curtain clears the new right jamb and the walking width.
    o=bpy.data.objects['107 | Ivory door side curtain'];o.location.x+=.17
    SC['completion_107_balcony']=True;bpy.context.view_layer.update();write_report('107-balcony-opening-repaired.json',{'source':'kat_3_yatak_odalari/WhatsApp Image 2026-08-26 at 11.51.46 (14).jpeg','changes':rows,'clear_width':1.09,'sill_z':6.3711,'leaves_open_degrees':90,'dimensions':'Existing CAD opening width and lintel retained; floor-height interpretation confirmed in photographs'})
    bpy.ops.wm.save_mainfile()

def completion_probes():
    write_report('107-dense-clearance-probes.json',[{'x':round(x,3),'z':round(z,3),'hit':ray_info((x,-4.86,z),(0,-1,0),1.7)}for x in [-.9,-.7,-.5,-.3,-.1]for z in [6.41+i*.05 for i in range(37)]])
    write_report('attic-detail-location-probes.json',{'ceiling':[{'xy':(x,y),'hit':ray_info((x,y,10.5),(0,0,1),3)}for x,y in [(-3,5.1),(-2.7,5.1),(-.5,-.1),(.5,-.1),(1.5,-1.8),(.7,5.65)]],'round_window':[{'xz':(x,z),'hit':ray_info((x,3.15,z),(0,1,0),2)}for x,z in [(-5.4,11.22),(-5.5,11.22),(-5.3,11.22),(-5.4,11.1),(-5.4,11.35)]]})
    write_report('completion-current-inventory.json',[{'name':o.name,'bounds':bounds(o),'level':[c.name for c in o.users_collection],'materials':[m.name if m else None for m in o.data.materials]}for o in SC.objects if o.type=='MESH'])
    print('COMPLETION PROBES SAVED')

def finish_attic_bed_and_bath():
    if SC.get('completion_attic_bed_bath'):return
    # Remove only the old horizontal window sill trims crossing the new balcony door.
    rows=[]
    for name in ['F2 | PENCERE_KAPI$CEPHE FRAME','F2 | PENCERE_KAPI$ÇEPHE ÇERÇECE']:
        o=bpy.data.objects[name];count=clip_wall_opening(o,rect_planes(-1.057,.1433,6.98,7.17),(-5.6,-4.98),'107 old sill trim removed');rows.append({'name':name,'cut_faces':count})
    white=bpy.data.materials['white_trim.003'];wood=bpy.data.materials['wood_honey.003'];metal=finish_material('Completion | Dark satin metal',(.023,.027,.031),.36,.7)
    blue=finish_material('Completion | Blue grey painted chest',(.19,.265,.29),.48);pink=finish_material('Completion | Dusty pink chest trim',(.38,.24,.23),.55)
    def part(room,name,lo,hi,mat=white,bevel=.003):return completion_note(solid_box(room+' | '+name,lo,hi,mat,3,bevel),'f3-'+room,'Visible room photo detail; proportions fitted to existing CAD shell')
    removed=[]
    for o in list(bpy.data.collections['level-3'].objects):
        if o.type!='MESH':continue
        lo,hi=bounds(o)
        if 1.0<lo[0] and hi[0]<1.8 and -3.9<lo[1] and hi[1]<-1.6 and any(s in o.name for s in ('Drawer','Lamp','Hollow case')):removed.append(o.name);archive_object(o)
    # The single timber bed has a low shaped headboard and a matching footboard.
    o=bpy.data.objects['Headboard.004'];old=o.data;old.use_fake_user=True;o.data=old.copy();inv=o.matrix_world.inverted()
    for v in o.data.vertices:
        p=o.matrix_world@v.co;p.z=9.6755+(p.z-9.6755)*.67;v.co=inv@p
    completion_note(o,'f3-C04','Lower timber headboard matches the photographed single bed')
    part('C04','Timber footboard',(-.430,-3.242,9.565),(-.368,-2.158,10.055),wood,.008)
    for x in [-.418,1.641]:
        part('C04','Timber top rail',(x-.025,-3.258,10.035 if x<0 else 10.345),(x+.027,-2.142,10.105 if x<0 else 10.415),wood,.009)
    for y in [-3.212,-2.23]:part('C04','Visible timber side rail',(-.368,y,9.575),(1.625,y+.04,9.76),wood,.004)
    part('C04','Blue three drawer bedside case',(1.15,-2.04,9.475),(1.70,-1.52,10.23),blue,.01)
    for k in range(3):
        z=9.54+k*.219
        part('C04','Bedside drawer',(1.124,-2.011,z),(1.149,-1.548,z+.188),blue,.004)
        for yy in [-2.017,-1.55]:part('C04','Bedside pink frame stile',(1.116,yy,z-.004),(1.125,yy+.012,z+.194),pink,.001)
        for zz in [z-.004,z+.182]:part('C04','Bedside pink frame rail',(1.116,-2.005,zz),(1.125,-1.538,zz+.012),pink,.001)
        part('C04','Bedside brass pull',(1.10,-1.81,z+.07),(1.116,-1.75,z+.09),wood,.004)
    # White wardrobe is located on the full-height wall, clear of the door leaf.
    x0,x1,y0,y1,z0,z1=-.67,.58,-.35,.19,9.475,11.46
    for label,lo,hi in [('Wardrobe left side',(x0,y0,z0),(x0+.022,y1,z1)),('Wardrobe right side',(x1-.022,y0,z0),(x1,y1,z1)),('Wardrobe back',(x0+.022,y1-.018,z0),(x1-.022,y1,z1)),('Wardrobe top',(x0,y0,z1-.025),(x1,y1,z1)),('Wardrobe base',(x0,y0,z0),(x1,y1,z0+.025))]:part('C04',label,lo,hi)
    for xa,xb in [(x0+.025,-.055),(-.035,x1-.025)]:
        part('C04','White wardrobe door',(xa,y0-.022,z0+.04),(xb,y0-.002,z1-.04),white,.005)
        hx=xb-.05 if xa<-.1 else xa+.05;part('C04','Wardrobe long handle',(hx-.005,y0-.05,10.27),(hx+.005,y0-.023,10.60),metal,.003)
    part('C04','Wardrobe upper interior shelf',(x0+.025,y0+.025,11.10),(x1-.025,y1-.02,11.12))
    # A narrow black rack beside the wardrobe, as shown in the room photographs.
    for x in [-1.035,-.745]:
        for y in [-.105,.145]:completion_note(rod_mesh('C04 | Black storage rack upright',(x,y,9.475),(x,y,11.22),.009,metal,3,12),'f3-C04','Photographed open black storage rack')
    for z in [9.56,9.9,10.23,10.56,10.9,11.18]:part('C04','Black storage rack shelf',(-1.04,-.11,z),(-.74,.15,z+.012),metal,.002)
    for k in range(12):
        y=-2.35+k*.075;part('C04','Window radiator fin',(-3.127,y,9.60),(-3.047,y+.05,10.26),white,.005)
    # Preserve and reuse the house's existing detailed fan instead of another placeholder.
    fan_origin=Vector((-1.31,7.57,9.4705));fan_target=Vector((-2.12,-.42,9.4705))
    for src in list(bpy.data.collections['level-3'].objects):
        if src.name.startswith('Attic floor fan'):
            o=src.copy();o.data=src.data.copy();o.name='C04 | Photographed fan '+src.name.replace('Attic floor fan ','');bpy.data.collections['level-3'].objects.link(o);o.matrix_world=Matrix.Translation(fan_target-fan_origin)@src.matrix_world;completion_note(o,'f3-C04','Floor fan beside the blue chest; source detailed fan reused')
    # Compact white writing desk and two chairs in the free half of the north gable.
    part('C02','Window writing desk top',(-3.125,4.84,10.18),(-2.66,5.73,10.22),white,.006)
    for x in [-3.08,-2.70]:
        for y in [4.89,5.68]:part('C02','Writing desk leg',(x-.017,y-.017,9.475),(x+.017,y+.017,10.18),white)
    for y in [5.07,5.51]:
        part('C02','Ivory writing chair seat',(-2.64,y-.17,9.89),(-2.29,y+.17,9.935),white,.013)
        part('C02','Ivory writing chair back',(-2.32,y-.17,9.93),(-2.285,y+.17,10.32),white,.016)
        for x in [-2.60,-2.33]:
            for yy in [y-.13,y+.13]:part('C02','Writing chair leg',(x-.013,yy-.013,9.475),(x+.013,yy+.013,9.89),wood)
    # Bathroom radiator, mirror light and shelf toiletries are visible in the source set.
    for k in range(9):
        y=6.45+k*.066;part('C03','White radiator fin',(1.735,y,9.60),(1.815,y+.045,10.28),white,.005)
    completion_note(rod_mesh('C03 | Mirror light backplate',(.35,7.995,11.47),(.35,8.014,11.47),.055,metal,3,24),'f3-C03','Dark metal wall light above the bathroom mirror')
    completion_note(rod_mesh('C03 | Mirror light arm',(.35,7.995,11.47),(.35,7.85,11.57),.012,metal,3),'f3-C03','Wall light curved-arm approximation')
    opal=finish_material('Completion | Opal bathroom lamp',(.9,.88,.78),.3)
    completion_note(lathe_solid('C03 | Bathroom lamp globe',(.35,7.85),[(.025,11.535),(.055,11.56),(.045,11.64),(.016,11.665)],opal,3),'f3-C03','Photographed white bulb on wall sconce')
    bottle_mats=[finish_material('Completion | Toiletry teal',(.025,.17,.16),.3),finish_material('Completion | Toiletry ivory',(.72,.69,.57),.45),finish_material('Completion | Toiletry amber',(.20,.085,.025),.28)]
    for j,z in enumerate([9.9365,10.2765,10.6165,10.9565]):
        for k in range(3):
            x=-.025+k*.063;h=.12+.025*((j+k)%3);mat=bottle_mats[(j+k)%3]
            completion_note(lathe_solid('C03 | Shelf toiletry bottle',(x,7.25),[(.021,z),(.024,z+.01),(.023,z+h-.025),(.014,z+h-.008),(.014,z+h)],mat,3,16),'f3-C03','Small bottles on the photographed black bathroom rack')
    for o in list(bpy.data.collections['level-3'].objects):
        if o.name.startswith('Radiator fin.'):
            lo,hi=bounds(o)
            if hi[0]<-2.8 and lo[1]>7.7:
                o.matrix_world=Matrix.Translation(Vector((-3.065,5.30,9.4705)))@Matrix.Rotation(math.pi/2,4,'Z')@Matrix.Translation(Vector((3.20,-7.83,-9.4705)))@o.matrix_world
                completion_note(o,'f3-C02','Original radiator was outside the north bedroom; fitted below the real west window and desk')
    for o in SC.objects:
        if o.type=='MESH' and o.get('interior_completion_room'):
            bm=bmesh.new();bm.from_mesh(o.data);bmesh.ops.remove_doubles(bm,verts=list(bm.verts),dist=.00002);bmesh.ops.recalc_face_normals(bm,faces=list(bm.faces));bm.to_mesh(o.data);bm.free()
    SC['completion_attic_bed_bath']=True;write_report('attic-bed-bath-final-details.json',{'removed_generic_parts':removed,'balcony_trim_fix':rows,'fit_status':'Photo-interpreted visible details; existing CAD room shell retained'})
    bpy.context.view_layer.update();bpy.ops.wm.save_mainfile()

def completion_geometry_qa():
    from mathutils.bvhtree import BVHTree
    deps=bpy.context.evaluated_depsgraph_get();rows=[];hits=[]
    def tree(o):
        ev=o.evaluated_get(deps);me=ev.to_mesh();t=BVHTree.FromPolygons([o.matrix_world@v.co for v in me.vertices],[tuple(p.vertices)for p in me.polygons]);ev.to_mesh_clear();return t
    walls={lev:[(o,tree(o))for o in bpy.data.collections[f'level-{lev}'].objects if o.type=='MESH' and any(s in o.name for s in ('DUVAR','TAVAN','ÇATII','partition core'))]for lev in [2,3]}
    for o in SC.objects:
        if o.type!='MESH' or not o.get('interior_completion_room'):continue
        ev=o.evaluated_get(deps);me=ev.to_mesh();bm=bmesh.new();bm.from_mesh(me);rows.append({'object':o.name,'room':o['interior_completion_room'],'open_edges':sum(not e.is_manifold for e in bm.edges),'zero_area':sum(f.calc_area()<1e-10 for f in bm.faces)});bm.free();ev.to_mesh_clear()
        if o.get('intentional_wall_join'):continue
        lev=int(o['interior_completion_room'][1]);own=tree(o)
        for wall,t in walls[lev]:
            overlap=own.overlap(t)
            if overlap:hits.append({'object':o.name,'wall':wall.name,'face_pairs':len(overlap)})
    write_report('completion-mesh-qa.json',rows);write_report('completion-wall-intersections.json',hits)
    completion_probes();print('COMPLETION QA',len(rows),'objects',sum(r['open_edges']for r in rows),'open edges',len(hits),'wall contacts')
    bpy.ops.wm.save_mainfile()

def settle_completion_contacts():
    if not SC.get('completion_window_reveal_fit'):
        rows=[]
        for o in bpy.data.collections['level-2'].objects:
            if o.type=='MESH' and 'DUVAR' in o.name:
                count=clip_wall_opening(o,rect_planes(-4.181,-2.982,7.106,8.334),(-4.8,-3.90),'106 window clear reveal');rows.append({'object':o.name,'cut_faces':count})
        write_report('106-window-reveal-fit.json',rows);SC['completion_window_reveal_fit']=True
    for name in ['C04 | Photographed fan metal guard','C04 | Photographed fan base']:
        o=bpy.data.objects[name];bm=bmesh.new();bm.from_mesh(o.data);bmesh.ops.remove_doubles(bm,verts=list(bm.verts),dist=.000035)
        boundary=[e for e in bm.edges if e.is_boundary]
        if boundary:bmesh.ops.holes_fill(bm,edges=boundary,sides=0)
        bmesh.ops.recalc_face_normals(bm,faces=list(bm.faces));bm.to_mesh(o.data);bm.free()
    bpy.context.view_layer.update();bpy.ops.wm.save_mainfile()

def all_interior_furniture_audit():
    from mathutils.bvhtree import BVHTree
    deps=bpy.context.evaluated_depsgraph_get();rows=[];checked=[]
    def tree(o):
        ev=o.evaluated_get(deps);me=ev.to_mesh();t=BVHTree.FromPolygons([o.matrix_world@v.co for v in me.vertices],[tuple(p.vertices)for p in me.polygons]);ev.to_mesh_clear();return t
    for lev in range(4):
        group=bpy.data.collections[f'level-{lev}'];walltrees=[(w,tree(w))for w in group.objects if w.type=='MESH' and any(s in w.name for s in ('DUVAR','TAVAN','ÇATII','partition core'))]
        for o in group.objects:
            if o.type!='MESH' or o.name.startswith(('F0 |','F1 |','F2 |','F3 |','f0-','f1-','f2-','f3-','Review','Restored floor')) or o.get('intentional_wall_join'):continue
            lo,hi=bounds(o)
            if hi[0]-lo[0]>8 or hi[1]-lo[1]>8:continue
            own=tree(o);checked.append(o.name)
            for wall,t in walltrees:
                overlap=own.overlap(t)
                if overlap:rows.append({'object':o.name,'wall':wall.name,'face_pairs':len(overlap),'bounds':[lo,hi]})
        write_report('all-interior-furniture-audit-progress.json',{'last_level':lev,'tested':len(checked),'contacts':len(rows)})
    write_report('all-interior-furniture-wall-contacts.json',rows);write_report('all-interior-furniture-audit-scope.json',{'objects_tested':len(checked),'objects':checked,'method':'Evaluated triangle intersections against each floor native walls and ceiling. Structural objects and intentional window/door jamb joins excluded. Contacts are findings for review, not automatic defects.'})
    print('ALL FURNITURE AUDIT',len(checked),'objects',len(rows),'contacts')

def resolve_existing_furniture_contacts():
    if SC.get('completion_existing_contacts'):return
    changes=[]
    # The garden-kitchen backs extended through the finished wall by a few cm.
    for o in bpy.data.collections['level-0'].objects:
        if o.type!='MESH' or o.name.startswith(('F0 |','f0-')):continue
        lo,hi=bounds(o)
        if -5.8<lo[0] and hi[0]<-4.85 and .83<lo[1] and hi[1]<3.2 and hi[2]<2.5:
            o.location.x+=.047;o['interior_contact_repair']='Garden kitchen complete assembly moved 47 mm clear of finished wall';changes.append(o.name)
    # Keep the wardrobe front and bed clearance; shorten only the rear 35 mm.
    for o in bpy.data.collections['level-3'].objects:
        if o.type!='MESH':continue
        lo,hi=bounds(o)
        if -.95<lo[0] and hi[0]<-.20 and 5.50<lo[1] and hi[1]<6.96:
            old=o.data;old.use_fake_user=True;o.data=old.copy();inv=o.matrix_world.inverted()
            for v in o.data.vertices:
                p=o.matrix_world@v.co;p.x-=.035*min(1,max(0,(p.x+.40)/.06));v.co=inv@p
            o['interior_contact_repair']='C02 wardrobe back shortened clear of east partition, front unchanged';changes.append(o.name)
    # Source photographs show the enclosure in the high corner, basin beside entrance.
    # Retain native products and sizes; relocate complete assemblies instead of cutting their glass.
    shower=Matrix.Translation(Vector((-.055,8.00,0)))@Matrix.Rotation(math.pi,4,'Z')@Matrix.Translation(Vector((-1.895,-5.35,0)))
    basin=Matrix.Translation(Vector((.155,6.02,0)))@Matrix.Rotation(math.pi/2,4,'Z')@Matrix.Translation(Vector((-.35,-7.80,0)))
    rack_delta=Vector((0,-.43,0));rad=Matrix.Translation(Vector((1.35,5.405,0)))@Matrix.Rotation(-math.pi/2,4,'Z')@Matrix.Translation(Vector((-1.775,-6.7365,0)))
    for o in list(bpy.data.collections['level-3'].objects):
        if o.type!='MESH':continue
        matrix=None
        if o.name.startswith(('R33 | Shower ','R33 | Fixed curved shower','R33 | Open sliding shower','R33 | Quadrant molded shower')):matrix=shower
        elif o.name.startswith(('R33 | Open porcelain washbasin.002','R33 | Washbasin chrome drain.002','R33 | Curved mixer neck.001','R33 | Mixer plinth.001','R33 | Mixer lever.002','R33 | Porcelain pedestal.001','R33 | Mirror physical glass.001','R33 | Towel ring.001','C03 | Mirror light','C03 | Bathroom lamp')):matrix=basin
        elif o.name.startswith(('R33 | Rack ','C03 | Shelf toiletry')):matrix=Matrix.Translation(rack_delta)
        elif o.name.startswith('C03 | White radiator'):matrix=rad
        if matrix:
            o.matrix_world=matrix@o.matrix_world;o['interior_contact_repair']='C03 complete fixture arrangement reconciled with photos and native roof clearance';changes.append(o.name)
    rug=bpy.data.objects['C03 | Woven bath runner'];rug.location.y-=.34
    # Restore flat normals at architectural folds after welding imported source vertices.
    for o in bpy.data.collections['level-3'].objects:
        if o.type=='MESH' and any(s in o.name for s in ['DUVAR','ÇATII','ÇATI ALIN','ek dalgalar','partition core']):
            for p in o.data.polygons:p.use_smooth=False
    SC['completion_existing_contacts']=True;write_report('existing-furniture-contact-repairs.json',{'objects':changes,'bath_reference':'kat_4/WhatsApp Image 2026-08-26 at 11.53.32 (13).jpeg','status':'Photo-interpreted fixture layout; no alteration of the CAD walls or bathroom roof'})
    bpy.context.view_layer.update();bpy.ops.wm.save_mainfile()

def reconcile_north_bedroom_layout():
    if SC.get('completion_C02_layout'):return
    matrix=Matrix.Translation(Vector((-1.60,5.10,0)))@Matrix.Rotation(math.pi,4,'Z')@Matrix.Translation(Vector((2.02,-6.50,0)))
    moved=[]
    bed_names=['Bed base.003','Mattress.003','Headboard.003','R33 | Soft tailored pillow.006','R33 | Soft tailored pillow.007','R33 | Fitted draped bedcover.002']
    for o in list(bpy.data.collections['level-3'].objects):
        if o.type!='MESH':continue
        if o.name in bed_names or o.name.startswith('Attic headboard ivory'):
            o.matrix_world=matrix@o.matrix_world;completion_note(o,'f3-C02','Bed head oriented away from the gable desk, following the room photographs');moved.append(o.name)
        elif o.name.startswith('Attic leaning mirror'):
            o.location.y-=1.30;completion_note(o,'f3-C02','Mirror between the head end and wardrobe');moved.append(o.name)
        elif o.name.startswith('Attic floor fan'):
            o.location+=Vector((.16,-1.42,0));o['interior_contact_repair']='C02 fan beside head end, clear of the bed and mirror';moved.append(o.name)
        else:
            lo,hi=bounds(o)
            if -.95<lo[0] and hi[0]<-.20 and 5.50<lo[1] and hi[1]<6.96:o.location.y+=.90;o['interior_contact_repair']='C02 wardrobe aligned alongside the head end, desk bay kept free';moved.append(o.name)
    old=[o for o in list(bpy.data.collections['level-3'].objects)if o.name.startswith(('C02 | Window writing','C02 | Writing','C02 | Ivory writing'))]
    for o in old:archive_object(o)
    grey=finish_material('C02 | Blue grey metal writing desks',(.235,.29,.31),.52,.12);ivory=bpy.data.materials['white_trim.003']
    def box(name,lo,hi,mat=grey,b=.003):return completion_note(solid_box('C02 | '+name,lo,hi,mat,3,b),'f3-C02','Two photographed writing desks with ivory chairs; fitted dimensions')
    for y0,y1 in [(5.89,6.64),(6.66,7.41)]:
        box('Writing desk top',(-2.875,y0,10.18),(-2.325,y1,10.22),grey,.005)
        for x in [-2.84,-2.36]:
            for y in [y0+.035,y1-.035]:box('Writing desk square leg',(x-.014,y-.014,9.475),(x+.014,y+.014,10.18))
        y=(y0+y1)/2
        box('Ivory writing chair seat',(-2.32,y-.19,9.895),(-1.94,y+.19,9.94),ivory,.018)
        box('Ivory writing chair back',(-1.982,y-.19,9.93),(-1.941,y+.19,10.38),ivory,.02)
        for x in [-2.275,-1.985]:
            for yy in [y-.145,y+.145]:box('Writing chair leg',(x-.012,yy-.012,9.475),(x+.012,yy+.012,9.90),ivory)
    for o in bpy.data.collections['level-3'].objects:
        if o.name.startswith('Radiator fin.') and o.get('interior_completion_room')=='f3-C02':o.location.y+=1.05
    path='kat_4/WhatsApp Image 2026-08-26 at 11.53.10 (11).jpeg';mat=image_material('C02 | Original red framed artwork',path)
    wood=bpy.data.materials['wood_dark.003'];box('Red picture depth',(-2.19,7.991,10.44),(-1.37,8.02,11.20),wood)
    o=make_mesh('C02 | Original red wall picture',[(-2.19,7.986,11.20),(-1.37,7.986,11.20),(-1.37,7.986,10.44),(-2.19,7.986,10.44)],[(0,1,2,3)],mat,3)
    corners=[(712,620),(870,613),(841,881),(703,797)]
    for f in o.data.polygons:
        for li in f.loop_indices:
            x,y=corners[o.data.loops[li].vertex_index];o.data.uv_layers.active.data[li].uv=(x/1200,1-y/1600)
    mod=o.modifiers.new('Picture depth','SOLIDIFY');mod.thickness=.001;completion_note(o,'f3-C02','Actual photographed red artwork, perspective-corrected UV');o['walk_role']='decoration'
    SC['completion_C02_layout']=True;write_report('C02-photo-layout-reconciled.json',{'moved':moved,'reference':path,'fit_status':'Photo-interpreted furniture arrangement using existing native room boundary; no surveyed furniture dimensions'})
    bpy.context.view_layer.update();bpy.ops.file.pack_all();bpy.ops.wm.save_mainfile()

def finishing_probes_and_minor_fits():
    if not SC.get('completion_kitchen_corner'):
        for o in bpy.data.collections['level-0'].objects:
            if o.type!='MESH' or o.name.startswith(('F0 |','f0-')):continue
            lo,hi=bounds(o)
            if -5.1<lo[0] and hi[0]<-3.3 and -.35<lo[1] and hi[1]<.42 and hi[2]<2.5:o.location.x+=.065;o['interior_contact_repair']='South kitchen assembly cleared 65 mm from west return'
        bpy.data.objects['Garden west backsplash'].location.x+=.055;SC['completion_kitchen_corner']=True
    cam=next(o for o in SC.objects if o.type=='CAMERA' and o.get('room_id')=='f3-C03');cam.location=(.90,6.40,10.97)
    o=bpy.data.objects['C04 | Photographed fan metal guard'];bm=bmesh.new();bm.from_mesh(o.data)
    bad=[e for e in bm.edges if len(e.link_faces)>2]
    if bad:bmesh.ops.split_edges(bm,edges=bad)
    boundary=[e for e in bm.edges if e.is_boundary]
    if boundary:bmesh.ops.holes_fill(bm,edges=boundary,sides=0)
    bmesh.ops.recalc_face_normals(bm,faces=list(bm.faces));bm.to_mesh(o.data);bm.free()
    write_report('master-arch-opening-probes.json',[{'y':y,'z':z,'hit':ray_info((-.12,y,z),(1,0,0),.60)}for y in [3.8+i*.1 for i in range(19)]for z in [7.,8.3,8.5]])
    bpy.context.view_layer.update();bpy.ops.wm.save_mainfile()

def inspect_remaining_openings():
    rows=[]
    for lev,xy in [(2,(-1.2,.3,-5.5,-4.95)),(3,(-5.8,-4.8,3.3,4.0))]:
        for o in bpy.data.collections[f'level-{lev}'].objects:
            if o.type!='MESH':continue
            vs=[o.matrix_world@v.co for v in o.data.vertices]
            selected=[p for p in vs if xy[0]<p.x<xy[1] and xy[2]<p.y<xy[3]]
            if not selected:continue
            rows.append({'object':o.name,'level':lev,'count':len(selected),'materials':[m.name if m else None for m in o.data.materials],'points':sorted(set(tuple(round(a,5)for a in p)for p in selected))[:250]})
    write_report('remaining-openings-source.json',rows)
    write_report('remaining-openings-rays.json',{'north_wall':[{'x':x,'z':z,'ray':ray_info((x,3.1,z),(0,1,0),1.5)}for x in [-5.5,-5.2,-4.5,-3.5]for z in [10.,11.,11.3,11.6,11.9]],'107':[{'x':x,'z':z,'ray':ray_info((x,-4.7,z),(0,-1,0),1.0)}for x in [-.9,-.5,0.]for z in [6.42,6.8,7.2,7.7,8.2,8.4]]})
    print('REMAINING OPENINGS INSPECTED')

def final_circulation_fits():
    if not SC.get('completion_final_circulation'):
        for o in bpy.data.collections['level-3'].objects:
            if o.name.startswith(('C04 | Wardrobe','C04 | White wardrobe','C04 | Black storage rack')):o.location.x-=1.05
            elif o.name.startswith('C04 | Photographed fan'):o.location.y-=.40
            elif o.name.startswith(('R33 | Open porcelain washbasin.002','R33 | Washbasin chrome drain.002','R33 | Curved mixer neck.001','R33 | Mixer plinth.001','R33 | Mixer lever.002','R33 | Porcelain pedestal.001','R33 | Mirror physical glass.001','R33 | Towel ring.001','C03 | Mirror light','C03 | Bathroom lamp')):o.location.y+=.39
        cover=bpy.data.objects['R33 | Fitted draped bedcover.002'];old=cover.data;old.use_fake_user=True;cover.data=old.copy();inv=cover.matrix_world.inverted()
        for v in cover.data.vertices:
            p=cover.matrix_world@v.co;p.y=4.395+(p.y-4.31785)*(5.805-4.395)/(5.8822-4.31785);v.co=inv@p
        # Weld the source GLB's duplicated triangle seams, retaining the actual forms and UVs.
        for o in SC.objects:
            if o.type!='MESH' or o.get('interior_completion_room')!='f3-C02':continue
            old=o.data;old.use_fake_user=True;o.data=old.copy();bm=bmesh.new();bm.from_mesh(o.data)
            bmesh.ops.remove_doubles(bm,verts=list(bm.verts),dist=.000035);bmesh.ops.recalc_face_normals(bm,faces=list(bm.faces));bm.to_mesh(o.data);bm.free()
        SC['completion_final_circulation']=True
    next(o for o in SC.objects if o.type=='CAMERA' and o.get('room_id')=='f3-C02').location=(-1.43,6.64,10.97)
    write_report('master-arch-wall-vertices.json',sorted(set(tuple(round(c,5)for c in v)for o in bpy.data.collections['level-2'].objects if o.type=='MESH' and 'DUVAR' in o.name for v in [o.matrix_world@a.co for a in o.data.vertices] if .12<v.x<.32 and 5<v.y<6.1)))
    bpy.context.view_layer.update();bpy.ops.wm.save_mainfile()

def finish_master_arch():
    if SC.get('completion_master_arch'):return
    # Existing measured 800 mm rough opening; photograph shows a shallow plaster arch.
    # Raise the old rectangular lintel locally so the arch does not reduce walking headroom.
    y0,y1=5.07692,5.87734;top=8.652;spring=8.432;mid=(y0+y1)/2;radius=(y1-y0)/2
    planes=[(Vector((1,0,0)),.30),(Vector((-1,0,0)),-.136),(Vector((0,1,0)),y1),(Vector((0,-1,0)),-y0),(Vector((0,0,1)),top),(Vector((0,0,-1)),-6.369)]
    changes=[]
    for o in bpy.data.collections['level-2'].objects:
        if o.type=='MESH' and 'DUVAR' in o.name:changes.append({'object':o.name,'cut_faces':clip_wall_opening(o,planes,(-100,100),'Master dressing arch')})
    # Each strip has a curved lower edge; weld the strips into a closed solid header.
    vs=[];fs=[];n=40
    for k in range(n+1):
        y=y0+(y1-y0)*k/n;z=spring+.20*math.sqrt(max(0,1-((y-mid)/radius)**2))
        vs.extend([(.13812,y,z),(.2982,y,z),(.13812,y,top),(.2982,y,top)])
    for k in range(n):
        a=4*k;b=a+4
        fs.extend([(a,b,b+1,a+1),(a+2,a+3,b+3,b+2),(a,a+2,b+2,b),(a+1,b+1,b+3,a+3)])
    fs.extend([(0,1,3,2),(4*n,4*n+2,4*n+3,4*n+1)])
    mat=bpy.data.materials['interior.002'];o=make_mesh('Master | Photographed shallow plaster arch',vs,fs,mat,2);completion_note(o,'f2-102','Photographed shallow arch fitted to native 800 mm rough opening; crown 2.26 m above finish');o['intentional_wall_join']=True
    for label,lo,hi in [('Left plaster reveal',(.13812,y0-.001,6.3714),(.2982,y0+.012,spring)),('Right plaster reveal',(.13812,y1-.012,6.3714),(.2982,y1+.001,spring))]:
        o=solid_box('Master | '+label,lo,hi,mat,2,.001);completion_note(o,'f2-102','Opaque finished edge of the real arch opening');o['intentional_wall_join']=True
    # Restore cloth clearance around the bed base after fitting the south-wall clearance.
    o=bpy.data.objects['R33 | Fitted draped bedcover.002'];inv=o.matrix_world.inverted()
    for v in o.data.vertices:
        p=o.matrix_world@v.co;p.y=4.365+(p.y-4.395)*(5.835-4.365)/(5.805-4.395);v.co=inv@p
    SC['completion_master_arch']=True;bpy.context.view_layer.update()
    write_report('master-arch-completed.json',{'wall_changes':changes,'rough_width':y1-y0,'spring_clearance':spring-6.3714,'crown_clearance':spring+.20-6.3714,'source':'kat_3_master_bedroom/WhatsApp Image 2026-08-26 at 11.52.43.jpeg','dimension_status':'Native horizontal opening, photo-interpreted arch rise','passage_probes':[{'y':y,'z':z,'hit':ray_info((-.1,y,z),(1,0,0),.55)}for y in [5.19,5.33,5.477,5.62,5.76]for z in [6.42,6.7,7.32,8.02,8.27]]})
    bpy.ops.wm.save_mainfile()

def final_joinery_clearance():
    if not SC.get('completion_joinery_clearance'):
        for o in bpy.data.collections['level-3'].objects:
            if o.name in ['Bed base.003','Mattress.003','Headboard.003','R33 | Soft tailored pillow.006','R33 | Soft tailored pillow.007','R33 | Fitted draped bedcover.002'] or o.name.startswith('Attic headboard ivory'):o.location.y+=.06
        cuts=[]
        # Correct small rough-opening intrusions behind the retained, already open frames.
        for lev,lo,hi in [(0,(-1.553,8.02,.003),(-.420,8.80,2.065)),(2,(-1.553,8.02,6.374),(-.420,8.80,8.265)),(0,(6.130,6.20,.003),(6.842,7.05,1.827))]:
            planes=[]
            for axis in range(3):
                v=Vector((0,0,0));v[axis]=1;planes.append((v,hi[axis]));planes.append((-v,-lo[axis]))
            for o in bpy.data.collections[f'level-{lev}'].objects:
                if o.type=='MESH' and 'DUVAR' in o.name:cuts.append({'object':o.name,'cut_faces':clip_wall_opening(o,planes,(-100,100),'Open leaf rough opening fit')})
        write_report('external-leaf-reveal-clearance.json',cuts);SC['completion_joinery_clearance']=True
    bpy.context.view_layer.update();bpy.ops.wm.save_mainfile()

def final_leaf_furniture_check():
    from mathutils.bvhtree import BVHTree
    deps=bpy.context.evaluated_depsgraph_get();hits=[];count=0
    def tree(o):
        ev=o.evaluated_get(deps);me=ev.to_mesh();result=BVHTree.FromPolygons([o.matrix_world@v.co for v in me.vertices],[tuple(p.vertices)for p in me.polygons]);ev.to_mesh_clear();return result
    for d in DOORS:
        leaf=bpy.data.objects.get(d['id']+' | Solid six-panel open leaf')
        if not leaf:continue
        lt=tree(leaf);a,b=bounds(leaf)
        for o in bpy.data.collections[f"level-{d['level']}"].objects:
            if o.type!='MESH' or o.name.startswith(('F0 |','F1 |','F2 |','F3 |','f0-','f1-','f2-','f3-')):continue
            c,e=bounds(o)
            if any(b[k]<c[k] or e[k]<a[k] for k in range(3)):continue
            count+=1;over=lt.overlap(tree(o))
            if over:hits.append({'door':d['id'],'object':o.name,'face_pairs':len(over)})
    write_report('final-open-leaves-furniture.json',{'tested_nearby_pairs':count,'contacts':hits})
    print('OPEN LEAF FURNITURE CONTACTS',len(hits))

def seal_interior_review():
    o=bpy.data.objects['Master blue bathmat']
    if not o.get('door_clearance_fit'):
        old=o.data;old.use_fake_user=True;o.data=old.copy();inv=o.matrix_world.inverted()
        for v in o.data.vertices:
            p=o.matrix_world@v.co;p.z=6.3729+(p.z-6.3729)*.20;v.co=inv@p
        o['door_clearance_fit']='3.4 mm bathmat pile clears the open door bottom';o['walk_role']='decoration'
    bpy.context.view_layer.update();final_leaf_furniture_check();room_object_audit()
    contacts=json.loads((OUT/'all-interior-furniture-wall-contacts.json').read_text(encoding='utf-8'))
    for row in contacts:
        name=row['object']
        if name.startswith(('Interior window casing','R33 | External doorway frame','R33 | Door hinge')):kind='Fixed frame or hinge embedded in its wall opening'
        elif name.startswith('Opal ceiling diffuser'):kind='Ceiling fitting mounting contact'
        elif name.startswith(('Lift shaft','R31 | Solid salon','R40 | B03')):kind='Structural wall/column/step junction'
        elif name.startswith('Gallery R42'):kind='Balustrade end attachment at wall'
        else:kind='UNRESOLVED'
        row['review_classification']=kind
    write_report('final-wall-contacts-reviewed.json',contacts)
    assert not any(r['review_classification']=='UNRESOLVED' for r in contacts)
    read=lambda name:json.loads((OUT/name).read_text(encoding='utf-8'))
    passes=read('final-13-doors-passages.json');bodies=read('room-body-and-visibility.json');meshes=read('completion-mesh-qa.json')
    proof={'native_file':bpy.data.filepath,'scope':'Blender interior correction and sampled geometric QA; no web runtime acceptance or surveyed product replication claim','interior_doors':len(passes),'door_rays':35*len(passes),'door_ray_hits':sum(len(d['rays'])for d in passes),'floor_samples':sum(len(d['floor'])for d in passes),'room_stations':len(bodies['rooms']),'body_radius_hits':sum(len(r['body_radius_hits'])for r in bodies['rooms']),'visibility_issues':bodies['mesh_issues'],'completion_mesh_objects':len(meshes),'completion_nonmanifold_edges':sum(r['open_edges']for r in meshes),'completion_zero_area_faces':sum(r['zero_area']for r in meshes),'completion_wall_intersections':read('completion-wall-intersections.json'),'open_leaf_furniture':read('final-open-leaves-furniture.json'),'furniture_audit_objects':read('all-interior-furniture-audit-scope.json')['objects_tested'],'reviewed_attachment_contacts':len(contacts),'master_arch_clear_rays':sum(r['hit'] is None for r in read('master-arch-completed.json')['passage_probes'])}
    write_report('INTERIOR-FINAL-QA.json',proof)
    assert proof['door_ray_hits']==proof['body_radius_hits']==proof['completion_nonmanifold_edges']==proof['completion_zero_area_faces']==0
    assert not proof['visibility_issues'] and not proof['completion_wall_intersections'] and not proof['open_leaf_furniture']['contacts']
    SC['interior_review_status']='Photo-directed interior correction and sampled native geometry QA complete; see ROOM-PASS-TR.md for evidence limits'
    for path in [ROOT/'tools/native_interior_completion.py',OUT/'INTERIOR-FINAL-QA.json',OUT/'ROOM-PASS-TR.md']:
        text=bpy.data.texts.get(path.name) or bpy.data.texts.new(path.name);text.clear();text.write(path.read_text(encoding='utf-8'))
    bpy.ops.file.pack_all();bpy.ops.wm.save_mainfile();print('INTERIOR FINAL QA PASSED',proof['door_rays'],proof['room_stations'])

def final_render_remaining():
    done=[]
    recent={'f3-C02','f3-C03','f3-C04','f2-102','f2-103','f0-B02'}
    ids=sorted(o['room_id']for o in SC.objects if o.type=='CAMERA' and o.get('room_id') and o['room_id']not in recent)
    for rid in ids:
        render_rooms([rid]);done.append(rid);write_report('final-render-progress.json',{'completed':done,'pending':ids[len(done):],'previously_refreshed':sorted(recent)})
    render_bedroom_perspectives(['106','107-bed']);render_lounge_perspective()
    bpy.ops.wm.save_mainfile()
