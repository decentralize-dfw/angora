"""User photograph corrections, September 13. Run inside the Blender roompass namespace."""
REVIEW=ROOT/'build/qa/user-review-2026-09-13'
REVIEW.mkdir(parents=True,exist_ok=True)

def inspect_user_review():
    rows=[]
    for o in SC.objects:
        if o.type!='MESH' or o.hide_render:continue
        names=[m.name if m else '' for m in o.data.materials]
        if o.name.startswith(('F3 |','C04 |','Bed ','Mattress','Pillow','Duvet')) or any(w in o.name.lower() for w in ('roof','ceiling','radiator','landing','sill')):
            rows.append({'name':o.name,'bounds':bounds(o),'materials':names,'faces':len(o.data.polygons),'props':{k:str(o[k]) for k in o.keys() if k not in ('_RNA_UI',)}})
    mats=[]
    for m in bpy.data.materials:
        if any(w in m.name.lower() for w in ('interior','ceiling','plaster','facade')):
            mats.append({'name':m.name,'nodes':[{'name':n.name,'type':n.type,'image':n.image.filepath if n.type=='TEX_IMAGE' and n.image else None}for n in m.node_tree.nodes]if m.use_nodes else []})
    (REVIEW/'scene-inspection.json').write_text(json.dumps({'objects':rows,'materials':mats},indent=2),encoding='utf-8')
    print('USER REVIEW INSPECTION',len(rows),len(mats))

def clean_native_plaster():
    import re
    changed=[]
    for m in bpy.data.materials:
        if not re.fullmatch(r'(interior|ceiling)(\.\d+)?',m.name) or not m.use_nodes:continue
        bs=m.node_tree.nodes.get('Principled BSDF')
        if not bs:continue
        for link in list(bs.inputs['Normal'].links):m.node_tree.links.remove(link)
        bs.inputs['Base Color'].default_value=(.82,.81,.78,1) if m.name.startswith('ceiling') else (.78,.77,.74,1)
        bs.inputs['Roughness'].default_value=.85;bs.inputs['Metallic'].default_value=0
        m['user_review']='Smooth painted plaster, no horizontal relief; September 13'
        changed.append(m.name)
    (REVIEW/'plaster-correction.json').write_text(json.dumps(changed),encoding='utf-8')
    print('NATIVE PLASTER CORRECTED',len(changed))

def inspect_attic_review_geometry():
    rows=[]
    for o in SC.objects:
        if o.type!='MESH' or o.hide_render:continue
        lo,hi=bounds(o)
        if lo[2]>9.3 and lo[0]>-.6 and hi[0]<1.9 and lo[1]>-3.5 and hi[1]<-2.0:
            rows.append({'name':o.name,'bounds':[lo,hi]})
    roofs=[]
    for name in ['F3 | ÇATII','F3 | KAT 3$DUVAR','F3 | KAT 3$DUVAR KAPLAMA']:
        o=bpy.data.objects[name]
        roofs.append({'name':name,'vertices':[list(o.matrix_world@v.co)for v in o.data.vertices],'faces':[list(p.vertices)for p in o.data.polygons],'materials':[p.material_index for p in o.data.polygons]})
    (REVIEW/'attic-geometry.json').write_text(json.dumps({'bed':rows,'geometry':roofs}),encoding='utf-8')
    print('ATTIC GEOMETRY SAVED',len(rows))

def review_probes():
    checks={}
    checks['bed_wall']=[ray_info((x,-1,10.3),(0,1,0),3)for x in [.4,.9,1.3]]
    checks['roof']=[{'xy':[x,y],'hit':ray_info((x,y,10.5),(0,0,1),4)}for x in [-2.8,-2,-1,0,1]for y in [-3.2,-2,-1,.0]]
    (REVIEW/'target-probes.json').write_text(json.dumps(checks),encoding='utf-8')
    print('TARGET PROBES SAVED')

def correct_c04_bed():
    from mathutils import Matrix
    if SC.get('user_review_c04_bed'):return
    rows=json.loads((REVIEW/'attic-geometry.json').read_text())['bed']
    names=[r['name']for r in rows if not r['name'].startswith('C04 | Bedside')]
    rotation=Matrix.Translation(Vector((1.16,-.895,0)))@Matrix.Rotation(math.pi/2,4,'Z')@Matrix.Translation(Vector((-.616,-(-2.7),0)))
    for name in names:
        o=bpy.data.objects[name];o.matrix_world=rotation@o.matrix_world;o['user_review']='C04 bed rotated 90 degrees CCW, head against north wall, door approach freed'
    for o in bpy.data.collections['level-3'].objects:
        if o.name.startswith(('C04 | Blue three drawer','C04 | Bedside')):
            o.location.x-=1.35;o.location.y+=1.52
    bpy.context.view_layer.update()
    SC['user_review_c04_bed']=True
    (REVIEW/'c04-bed-corrected.json').write_text(json.dumps([{'name':n,'bounds':bounds(bpy.data.objects[n])}for n in names]),encoding='utf-8')
    print('C04 BED CORRECTED',len(names))

def correct_inner_wall_finish():
    changed=[]
    for o in SC.objects:
        if o.type!='MESH' or o.hide_render or 'DUVAR KAPLAMA' not in o.name:continue
        inner=next((m for m in o.data.materials if m and m.name.startswith('interior')),None)
        if not inner:continue
        for slot in o.material_slots:
            if slot.material and slot.material.name.startswith('stucco'):
                slot.link='OBJECT';slot.material=inner;changed.append(o.name)
    (REVIEW/'inner-wall-finish.json').write_text(json.dumps(changed),encoding='utf-8')
    print('INNER WALL FINISH CORRECTED',len(changed))

def consolidate_roof_finish():
    if SC.get('user_review_roof_consolidated'):return
    o=bpy.data.objects['F3 | ÇATII'];old=o.data;old.use_fake_user=True
    src=json.loads((REVIEW/'roof-finish-repaired.json').read_text())
    mesh=bpy.data.meshes.new('Attic roof with consolidated plaster faces')
    inv=o.matrix_world.inverted()
    mesh.from_pydata([inv@Vector(p)for p in src['vertices']],[],src['faces']);mesh.update()
    for m in old.materials:mesh.materials.append(m)
    for p,mi in zip(mesh.polygons,src['materials']):p.material_index=mi
    uv=mesh.uv_layers.new(name='UVMap')
    retained=[p for p in old.polygons if p.material_index!=1]
    for p,original in zip(mesh.polygons,retained):
        if old.uv_layers.active:
            for a,b in zip(p.loop_indices,original.loop_indices):uv.data[a].uv=old.uv_layers.active.data[b].uv
    for p in list(mesh.polygons)[len(retained):]:
        for li in p.loop_indices:
            v=mesh.vertices[mesh.loops[li].vertex_index].co;uv.data[li].uv=(v.x,v.y)
    o.data=mesh
    o['user_review']='Coincident ceiling faces consolidated by shared plane; exterior geometry and UVs retained; original mesh retained as backup'
    SC['user_review_roof_consolidated']=True
    print('ROOF FINISH CONSOLIDATED',len(old.polygons),len(mesh.polygons))

def clear_c04_bedside_approach():
    if SC.get('user_review_c04_bedside_clear'):return
    for o in bpy.data.collections['level-3'].objects:
        if o.name.startswith(('C04 | Blue three drawer','C04 | Bedside')):o.location.y-=1.15
    SC['user_review_c04_bedside_clear']=True
    bpy.context.view_layer.update()
    print('C04 BEDSIDE MOVED CLEAR OF DOOR APPROACH')

def line_c04_dormer_wall():
    if bpy.data.objects.get('C04 | Interior dormer plaster returns'):return
    o=bpy.data.objects['F3 | KAT 3$DUVAR'];vs=[];fs=[]
    for p in o.data.polygons:
        if not o.material_slots[p.material_index].material.name.startswith('stucco'):continue
        points=[o.matrix_world@o.data.vertices[i].co for i in p.vertices]
        if not all(-3.69<v.x<-3.63 and -4.05<v.y<.07 for v in points):continue
        if max(v.x for v in points)-min(v.x for v in points)>.005:continue
        if p.area<1e-8:continue
        start=len(vs);vs.extend((v.x+.035,v.y,v.z)for v in points);fs.append(tuple(range(start,start+len(points))))
    liner=make_mesh('C04 | Interior dormer plaster returns',vs,fs,bpy.data.materials['interior.003'],3)
    liner['user_review']='Interior plaster lining follows existing dormer wall apertures; exterior blue stucco remains outside'
    liner['walk_role']='solid'
    print('C04 DORMER LINED',len(fs))

def correct_rear_room_opening_assignment():
    if SC.get('user_review_rear_openings'):return
    rows=[]
    for o in list(bpy.data.collections['level-2'].objects):
        if o.type!='MESH':continue
        if o.name.startswith('106 window |'):
            o.data.use_fake_user=True;o.data=o.data.copy();inv=o.matrix_world.inverted()
            for v in o.data.vertices:
                p=o.matrix_world@v.co;p.z=6.3714+(p.z-7.11)*(8.3296-6.3714)/(8.3296-7.11);v.co=inv@p
            o.data.update();o.name=o.name.replace('106 window |','106 balcony |')
            o['user_review']='Restore floor-height balcony access per explicit user correction SS7';rows.append(o.name)
        elif o.name.startswith(('106 | Visible photographed window parapet','106 | Window marble sill','106 | Photographed radiator fin')):
            rows.append('Archived: '+o.name);archive_object(o)
        elif o.name.startswith('107 balcony |'):
            if 'plaster reveal' in o.name or 'Flush marble threshold' in o.name:
                rows.append('Archived: '+o.name);archive_object(o);continue
            o.data.use_fake_user=True;o.data=o.data.copy();inv=o.matrix_world.inverted()
            for v in o.data.vertices:
                p=o.matrix_world@v.co;p.z=7.11+(p.z-6.379)*(8.30-7.11)/(8.30-6.379);v.co=inv@p
            o.data.update();o.name=o.name.replace('107 balcony |','107 window |')
            for key in ('door_id','door_part','open_angle_deg'):
                if key in o:del o[key]
            o['user_review']='Window above parapet per explicit user correction SS8; not an exterior walking portal';rows.append(o.name)
    plaster=bpy.data.materials['interior.002'];white=bpy.data.materials['white_trim.002']
    p=solid_box('107 | Restored window parapet',(-1.057,-5.205,6.3711),(.1433,-4.989,7.081),plaster,2)
    p['walk_role']='solid';p['user_review']='Restore window parapet after mistaken balcony interpretation'
    p=solid_box('107 | Restored marble window sill',(-1.08,-5.25,7.081),(.166,-4.95,7.11),white,2,.004);p['walk_role']='solid'
    SC['user_review_rear_openings']=True;bpy.context.view_layer.update()
    (REVIEW/'rear-openings-corrected.json').write_text(json.dumps(rows),encoding='utf-8')
    print('REAR ROOM OPENING ASSIGNMENT CORRECTED',len(rows))

def remove_unbuilt_basement_bathroom():
    if SC.get('user_review_basement_bath_removed'):return
    removed=[]
    for o in list(SC.objects):
        if o.name.startswith(('R40 | B03','B03 | CAD','f0-D13 |')) or (o.type=='CAMERA' and o.get('room_id')=='f0-B10'):
            removed.append(o.name);archive_object(o)
    SC['user_review_basement_bath_removed']=True
    (REVIEW/'basement-bathroom-removed.json').write_text(json.dumps(removed),encoding='utf-8')
    bpy.context.view_layer.update();print('UNBUILT BASEMENT BATHROOM ARCHIVED',len(removed))

def inspect_basement_stairs():
    rows=[]
    for o in bpy.data.collections['level-0'].objects:
        if o.type!='MESH':continue
        lo,hi=bounds(o)
        if (lo[0]>0.6 and hi[0]<3.8 and lo[1]>1 and hi[1]<5.5)or any(w in o.name.lower()for w in ('merdiven','stair','tread')):
            rows.append({'name':o.name,'bounds':[lo,hi],'materials':[s.material.name if s.material else None for s in o.material_slots]})
    (REVIEW/'basement-stair-inspection.json').write_text(json.dumps(rows),encoding='utf-8')
    print('BASEMENT STAIR INSPECTION',len(rows))

def move_ground_kitchen_radiator_inside():
    if SC.get('user_review_kitchen_radiator'):return
    from mathutils import Matrix
    transform=Matrix.Translation((-5.44,-3.70,0))@Matrix.Rotation(math.pi/2,4,'Z')@Matrix.Translation((4.0425,4.73,0))
    moved=[]
    for o in bpy.data.collections['level-1'].objects:
        if not o.name.startswith('Radiator fin'):continue
        lo,hi=bounds(o)
        if not (-4.9<lo[1]<-4.6 and 3.1<lo[2]<3.3):continue
        o.matrix_world=transform@o.matrix_world
        o['user_review']='Kitchen radiator inside west wall beside sink cabinetry, matching kitchen photo 11.53.33; outside door approach cleared'
        moved.append(o.name)
    assert len(moved)==12,moved
    SC['user_review_kitchen_radiator']=True;bpy.context.view_layer.update()
    (REVIEW/'kitchen-radiator-corrected.json').write_text(json.dumps([{'name':n,'bounds':bounds(bpy.data.objects[n])}for n in moved]),encoding='utf-8')
    print('GROUND KITCHEN RADIATOR MOVED INSIDE',len(moved))

def inspect_remaining_contacts():
    data={}
    data['c04_window']=[{'yz':[y,z],'hit':ray_info((-2.5,y,z),(-1,0,0),2)}for y in [-3,-2.6,-2.2,-1.8,-1.4,-1,-.6]for z in [10.65,10.95,11.25]]
    data['chair_wall']=[{'xz':[x,z],'hit':ray_info((x,3.57,z),(0,1,0),.6)}for x in [-4.7,-4.4,-4.1,-3.4,-3.1,-2.8]for z in [6.9,7.25]]
    data['chair_parts']=[]
    for o in bpy.data.collections['level-2'].objects:
        if o.type!='MESH':continue
        lo,hi=bounds(o)
        if -5<lo[0] and hi[0]<-2.5 and 2.4<lo[1] and hi[1]<3.6:
            data['chair_parts'].append({'name':o.name,'bounds':[lo,hi],'assembly':o.get('assembly_id')})
    (REVIEW/'remaining-contact-probes.json').write_text(json.dumps(data),encoding='utf-8')
    print('CONTACT PROBES SAVED')

def finish_c04_inner_core_and_hall_chairs():
    if not SC.get('user_review_c04_core_finish'):
        o=bpy.data.objects['F3 | Attic partition core'];o.data.use_fake_user=True;o.data=o.data.copy()
        inner=next(i for i,s in enumerate(o.material_slots)if s.material and s.material.name.startswith('interior'))
        changed=0
        for p in o.data.polygons:
            if not o.material_slots[p.material_index].material.name.startswith('stucco'):continue
            points=[o.matrix_world@o.data.vertices[i].co for i in p.vertices]
            if all(abs(v.x+3.58176)<.004 and -4.03<v.y<.07 for v in points):p.material_index=inner;changed+=1
        # The earlier wall-skin lining sat behind the repaired core and is redundant.
        liner=bpy.data.objects.get('C04 | Interior dormer plaster returns')
        if liner:archive_object(liner)
        SC['user_review_c04_core_finish']=True;print('C04 INNER CORE MATERIAL FACES',changed)
    if not SC.get('user_review_hall_chairs'):
        rows=[]
        for assembly in ['Upper hall / wing chair 1','Upper hall / wing chair 2']:
            objects=[o for o in bpy.data.collections['level-2'].objects if o.get('assembly_id')==assembly]
            assert objects,assembly
            max_y=max(bounds(o)[1][1]for o in objects);delta=3.84703-.005-max_y
            for o in objects:o.location.y+=delta;o['user_review']='Back of armchair placed against measured finished hall wall'
            rows.append({'assembly':assembly,'shift_y':delta,'wall_y':3.84703,'gap':.005})
        SC['user_review_hall_chairs']=True
        (REVIEW/'hall-chairs-corrected.json').write_text(json.dumps(rows),encoding='utf-8')
        print('HALL CHAIRS AGAINST WALL',rows)
    bpy.context.view_layer.update()

def inspect_detail_queue():
    rows=[]
    for o in SC.objects:
        if o.type not in ('MESH','CAMERA') or o.hide_render:continue
        rows.append({'name':o.name,'bounds':bounds(o),'collections':[c.name for c in o.users_collection], 'materials':[s.material.name if s.material else '' for s in o.material_slots], 'assembly':o.get('assembly_id'),'room_id':o.get('room_id')})
    (REVIEW/'detail-inventory.json').write_text(json.dumps(rows),encoding='utf-8')
    print('DETAIL INVENTORY',len(rows))

def inspect_closet_and_stair_faces():
    data={'closet_wall':[{'x':x,'z':z,'hit':ray_info((x,4.4,z),(0,-1,0),2)}for x in [.4,.8,1.2,1.6,2,2.3]for z in [6.9,7.8,8.5]],'faces':[]}
    for lev in range(4):
        for o in bpy.data.collections[f'level-{lev}'].objects:
            if o.type!='MESH' or not o.name.startswith('F'):continue
            for p in o.data.polygons:
                vs=[o.matrix_world@o.data.vertices[i].co for i in p.vertices]
                if not all(-.1<v.x<4.6 and .5<v.y<3.5 for v in vs):continue
                if max(v.z for v in vs)-min(v.z for v in vs)>.035:continue
                if max(v.z for v in vs)<2.5:continue
                data['faces'].append({'name':o.name,'index':p.index,'vertices':[list(v)for v in vs],'material':o.material_slots[p.material_index].material.name})
    (REVIEW/'closet-stair-probes.json').write_text(json.dumps(data),encoding='utf-8');print('CLOSET STAIR PROBES',len(data['faces']))

def extend_dressing_wardrobe():
    if SC.get('user_review_dressing_return'):return
    from mathutils import Matrix
    originals=[o for o in bpy.data.collections['level-2'].objects if o.get('assembly_id')=='Walk-in closet / Walk-in closet']
    assert len(originals)>25
    # South wall was probed at y=3.35731; the new back is 5 mm inside the room.
    # Rotate the matching joinery onto the right-hand wall and fit its measured span.
    transform=Matrix(((0,2.07/2.4,0,.34-3.45*2.07/2.4),(-1,0,0,3.36231+3.04),(0,0,1,0),(0,0,0,1)))
    rows=[]
    for source in originals:
        o=source.copy();o.data=source.data.copy();o.name='Master right return | '+source.name
        bpy.data.collections['level-2'].objects.link(o);o.matrix_world=transform@source.matrix_world
        o['assembly_id']='Walk-in closet / photographed right return';o['user_review']='L-shaped wardrobe continuation shown in master bedroom photos 11.52.08 (8), (10); width fitted to native wall'
        rows.append(o.name)
    SC['user_review_dressing_return']=True;bpy.context.view_layer.update()
    (REVIEW/'dressing-return-corrected.json').write_text(json.dumps({'objects':rows,'back_wall_y':3.35731,'clearance':.005,'dimension_basis':'Existing native wall span; photographed joinery continuation'}),encoding='utf-8')
    print('DRESSING RIGHT RETURN ADDED',len(rows))

def inspect_stair_projection():
    probes=[]
    for z in [2.5,2.65,2.75,2.9,3.05,3.2,5.7,5.9,6.05,6.2,6.35,6.5,8.9,9.1,9.3,9.5]:
        for origin,direction in [((3.6,2,z),(1,0,0)),((2.4,2.6,z),(0,1,0)),((2.4,1.3,z),(0,-1,0))]:
            probes.append({'origin':origin,'direction':direction,'hit':ray_info(origin,direction,1.2)})
    (REVIEW/'stair-projection-rays.json').write_text(json.dumps(probes),encoding='utf-8');print('STAIR PROJECTION RAYS',len(probes))

def render_review_view(label,position,target):
    col=bpy.data.collections['Review cameras']
    camera=bpy.data.objects.get('User review perspective')
    if camera is None:
        camera=bpy.data.objects.new('User review perspective',bpy.data.cameras.new('User review perspective'));col.objects.link(camera)
    camera.data.type='PERSP';camera.data.lens=20;camera.data.clip_start=.03
    camera.location=position;camera.rotation_euler=(Vector(target)-camera.location).to_track_quat('-Z','Y').to_euler()
    old=(SC.camera,SC.render.resolution_x,SC.render.resolution_y,SC.cycles.samples)
    light=bpy.data.objects['Room pass inspection fill'];light.location=Vector(position)+Vector((0,0,.25));light.data.energy=150;light.hide_render=False
    SC.camera=camera;SC.render.resolution_x=1400;SC.render.resolution_y=1000;SC.cycles.samples=16;SC.cycles.use_denoising=True
    try:
        SC.render.filepath=str(REVIEW/(label+'.png'));bpy.ops.render.render(write_still=True)
    finally:
        light.hide_render=True;SC.camera,SC.render.resolution_x,SC.render.resolution_y,SC.cycles.samples=old
    print('REVIEW VIEW',label)

def inspect_attic_inner_faces():
    data=[]
    for name in ['F3 | Attic partition core','F3 | KAT 3$DUVAR','F3 | KAT 3$DUVAR KAPLAMA']:
        o=bpy.data.objects[name]
        for p in o.data.polygons:
            mat=o.material_slots[p.material_index].material
            if not mat or not mat.name.startswith('stucco'):continue
            points=[o.matrix_world@o.data.vertices[i].co for i in p.vertices]
            data.append({'name':name,'index':p.index,'points':[list(v)for v in points]})
    (REVIEW/'attic-blue-faces.json').write_text(json.dumps(data),encoding='utf-8');print('ATTIC BLUE FACES',len(data))

def finish_stair_dormer_plaster():
    if SC.get('user_review_stair_dormer_plaster'):return
    o=bpy.data.objects['F3 | Attic partition core'];o.data.use_fake_user=True;o.data=o.data.copy()
    inner=next(i for i,s in enumerate(o.material_slots)if s.material and s.material.name.startswith('interior'))
    changed=[]
    for p in o.data.polygons:
        if not o.material_slots[p.material_index].material.name.startswith('stucco'):continue
        points=[o.matrix_world@o.data.vertices[i].co for i in p.vertices]
        if all(1.10<v.x<4.19 and .927<v.y<3.128 for v in points):
            p.material_index=inner;changed.append(p.index)
    SC['user_review_stair_dormer_plaster']=True;bpy.context.view_layer.update()
    (REVIEW/'stair-dormer-plaster.json').write_text(json.dumps({'inner_core_faces':changed,'exterior_facade_retained':True}),encoding='utf-8')
    print('STAIR DORMER INNER PLASTER',len(changed))

def remove_stair_gravel_intrusion():
    if SC.get('user_review_stair_gravel_trim'):return
    o=bpy.data.objects['Garage flat roof gravel'];lo,hi=bounds(o);mat=o.material_slots[0].material
    # This thin gravel slab belongs outside the house. Its old western edge at
    # x=3.825 crossed the stair finish at x=4.08772; terminate within the wall core.
    collections=list(o.users_collection)
    archive_object(o)
    new=solid_box('Garage flat roof gravel',(4.20,lo[1],lo[2]),hi,mat,1,.002)
    for c in list(new.users_collection):c.objects.unlink(new)
    for c in collections:c.objects.link(new)
    new['user_review']='Trim exterior roof gravel to wall core; remove SS8 false stair shelf'
    SC['user_review_stair_gravel_trim']=True;bpy.context.view_layer.update()
    checks=[ray_info((3.5,y,z),(1,0,0),.7)for y in [1.1,1.5,2,2.5,2.9]for z in [5.98,5.99,6.0]]
    assert all(p and 'gravel' not in p['object'].lower()for p in checks),checks
    (REVIEW/'stair-shelf-removed.json').write_text(json.dumps({'original_bounds':[lo,hi],'new_bounds':bounds(new),'wall_checks':checks}),encoding='utf-8')
    print('FALSE STAIR SHELF REMOVED; WALL CHECKS',len(checks))

def fit_c04_photographed_group():
    if SC.get('user_review_c04_photo_group'):return
    from mathutils import Matrix
    names=[r['name']for r in json.loads((REVIEW/'attic-geometry.json').read_text())['bed']if not r['name'].startswith('C04 | Bedside')]
    bed=[bpy.data.objects[n]for n in names];dx=-3.42-min(bounds(o)[0][0]for o in bed)
    for o in bed:o.location.x+=dx
    bedside=[o for o in bpy.data.collections['level-3'].objects if o.name.startswith(('C04 | Blue three drawer','C04 | Bedside'))]
    lo=[min(bounds(o)[0][i]for o in bedside)for i in range(3)];hi=[max(bounds(o)[1][i]for o in bedside)for i in range(3)]
    cx,cy=(lo[0]+hi[0])/2,(lo[1]+hi[1])/2
    tr=Matrix.Translation((-1.995,-.09,0))@Matrix.Rotation(math.pi/2,4,'Z')@Matrix.Translation((-cx,-cy,0))
    for o in bedside:o.matrix_world=tr@o.matrix_world
    for o in list(bpy.data.collections['level-3'].objects):
        if o.name.startswith(('C04 | White wardrobe door','C04 | Wardrobe long handle')):archive_object(o)
        elif o.name.startswith('C04 | Wardrobe'):
            o.data.use_fake_user=True;o.data=o.data.copy();inv=o.matrix_world.inverted()
            for v in o.data.vertices:
                p=o.matrix_world@v.co;p.x=-1.69+(p.x+1.72)*.8;v.co=inv@p
        elif o.name.startswith('C04 | Black storage rack'):o.location.x+=1.45
        elif o.name.startswith('C04 | Window radiator fin'):o.location.x-=.42
    white=bpy.data.materials['white_trim.003'];mirror=bpy.data.materials['R31 | R33 wardrobe mirror']
    for k in range(3):
        xa=-1.67+k*.32;xb=xa+.307
        solid_box('C04 | White wardrobe photographed door',(xa,-.372,9.515),(xb,-.352,11.42),white,3,.004)
        if k==1:solid_box('C04 | Wardrobe centre mirror',(xa+.035,-.376,9.62),(xb-.035,-.373,11.27),mirror,3,.001)
        else:
            for zz in [9.56,11.31]:solid_box('C04 | Wardrobe recessed door rail',(xa+.025,-.376,zz),(xb-.025,-.373,zz+.035),white,3,.001)
        solid_box('C04 | White wardrobe photographed handle',(xb-.04,-.4,10.27),(xb-.029,-.374,10.6),white,3,.003)
    SC['user_review_c04_photo_group']=True;bpy.context.view_layer.update()
    (REVIEW/'c04-photo-group.json').write_text(json.dumps({'bed':[{'name':o.name,'bounds':bounds(o)}for o in bed],'bedside':[bounds(o)for o in bedside],'reference':'kat_4/11.53.10 (16), (17): bed, bedside, mirrored white wardrobe, black rack along north wall','door_clearance_retained':True}),encoding='utf-8')
    print('C04 PHOTOGRAPHED NORTH WALL GROUP FITTED')

def fit_c04_tv_and_probe_windows():
    from mathutils import Matrix
    if not SC.get('user_review_c04_tv_clear'):
        group=[o for o in bpy.data.collections['level-3'].objects if o.get('assembly_id')=='Attic blue chest / Attic blue chest']
        assert len(group)>30
        transform=Matrix.Translation((1.205,-.035,.07))@Matrix.Rotation(-math.pi/2,4,'Z')@Matrix.Translation((2.6,1.2,0))
        for o in group:o.matrix_world=transform@o.matrix_world
        for o in bpy.data.collections['level-3'].objects:
            if o.name.startswith('C04 | Photographed fan'):o.location+=Vector((3.85,.54,0))
        SC['user_review_c04_tv_clear']=True
        bpy.context.view_layer.update()
        (REVIEW/'c04-tv-placement.json').write_text(json.dumps({'reference':'kat_4/11.53.32 (11): TV chest to right of doorway; fan beside chest','objects':[{'name':o.name,'bounds':bounds(o)}for o in group]}),encoding='utf-8')
    probes=[]
    for y in [1.25,1.5,1.75,2,2.25,2.5,2.8]:
        for z in [6.95,7.2,7.5,7.8,8.05,8.25]:
            probes.append({'origin':[-5.4,y,z],'hit':ray_info((-5.4,y,z),(-1,0,0),1.0)})
    (REVIEW/'hall-window-probes.json').write_text(json.dumps(probes),encoding='utf-8')
    print('C04 TV CLEAR OF BED; WINDOW PROBES',len(probes))

def correct_hall_centre_window():
    if SC.get('user_review_hall_window'):return
    o=bpy.data.objects['F2 | PENCERE_KAPI$ÇEPHE ÇERÇECE']
    o.data.use_fake_user=True;o.data=o.data.copy()
    wood=bpy.data.materials['wood_dark.002'];o.data.materials.append(wood);idx=len(o.data.materials)-1
    changed=[]
    for p in o.data.polygons:
        points=[o.matrix_world@o.data.vertices[i].co for i in p.vertices]
        if all(-6.25<v.x<-6.07 and 1.74<v.y<2.34 and 6.87<v.z<8.29 for v in points):
            p.material_index=idx;changed.append(p.index)
    assert changed,'No middle window faces found'
    SC['user_review_hall_window']=True;bpy.context.view_layer.update()
    (REVIEW/'hall-window-corrected.json').write_text(json.dumps({'faces':changed,'material':wood.name,'reference':'kat_3_hol: three dark timber window frames'}),encoding='utf-8')
    print('HALL CENTRE WINDOW TIMBER FACES',len(changed))

def inspect_c04_roof_contacts():
    rows=[]
    for x in [-3.45,-3.2,-2.8,-2.4,-1.8,-1,.2,1.2,1.8]:
        for y in [-3.5,-2.8,-2,-1.2,-.5,0]:
            rows.append({'origin':[x,y,10.5],'hit':ray_info((x,y,10.5),(0,0,1),4)})
    (REVIEW/'c04-roof-contacts.json').write_text(json.dumps(rows),encoding='utf-8')

def inspect_window_and_high_floor_faces():
    rows=[]
    for name in ['F2 | PENCERE_KAPI$ÇEPHE ÇERÇECE','F3 | KAT 3$ZEMİN KAPLAMA']:
        o=bpy.data.objects[name]
        for p in o.data.polygons:
            pts=[o.matrix_world@o.data.vertices[i].co for i in p.vertices]
            if name.startswith('F2'):
                if not all(-6.4<v.x<-5.9 and 1.5<v.y<2.55 for v in pts):continue
            elif not all(-3.9<v.x<2 and -4.1<v.y<.3 and v.z>10 for v in pts):continue
            rows.append({'object':name,'index':p.index,'points':[list(v)for v in pts],'material':o.material_slots[p.material_index].material.name})
    (REVIEW/'window-high-floor-faces.json').write_text(json.dumps(rows),encoding='utf-8')
    print('WINDOW AND HIGH FLOOR FACES',len(rows))

def detail_c04_tv_chest():
    if SC.get('user_review_c04_four_drawers'):return
    from mathutils import Matrix
    group=[o for o in bpy.data.collections['level-3'].objects if o.get('assembly_id')=='Attic blue chest / Attic blue chest']
    blue=bpy.data.materials['R31 | R33 chest blue paint'];timber=bpy.data.materials['wood_dark.003']
    for o in group:
        if o.name.startswith(('R33 | Blue chest drawer','R33 | Blue chest framed')):archive_object(o)
    for i in range(4):
        z=9.61+i*.213
        solid_box('C04 | TV chest photographed drawer',(.852,-.279,z),(1.558,-.266,z+.195),blue,3,.002)
        for x in [.857,1.541]:solid_box('C04 | TV chest timber drawer border',(x,-.283,z+.005),(x+.012,-.280,z+.190),timber,3,.001)
        for zz in [z+.005,z+.178]:solid_box('C04 | TV chest timber drawer border',(.869,-.283,zz),(1.541,-.280,zz+.012),timber,3,.001)
    solid_box('C04 | TV chest solid top',(.814,-.298,10.537),(1.596,.208,10.568),blue,3,.004)
    solid_box('C04 | TV chest timber plinth',(.817,-.283,9.535),(1.593,.201,9.576),timber,3,.003)
    for x in [.831,1.527]:
        for y in [-.263,.135]:solid_box('C04 | TV chest timber foot',(x,y,9.4705),(x+.052,y+.052,9.541),timber,3,.002)
    # Turn the floor fan side-on as photographed; keep its circular guard off the wall.
    tr=Matrix.Translation((1.715,-.33,0))@Matrix.Rotation(math.pi/2,4,'Z')@Matrix.Translation((-1.73,.28,0))
    for o in bpy.data.collections['level-3'].objects:
        if o.name.startswith('C04 | Photographed fan'):o.matrix_world=tr@o.matrix_world
    SC['user_review_c04_four_drawers']=True;bpy.context.view_layer.update()
    print('C04 FOUR DRAWER CHEST AND FLOOR FAN FITTED')

def trim_c04_sill_roof_intersection():
    if SC.get('user_review_c04_sill_ends'):return
    o=bpy.data.objects['F3 | KAT 3$ZEMİN KAPLAMA'];o.data.use_fake_user=True;o.data=o.data.copy();inv=o.matrix_world.inverted()
    count=0
    for v in o.data.vertices:
        p=o.matrix_world@v.co
        if -3.64<p.x<-3.16 and -3.23<p.y<-.40 and 10.62<p.z<10.66:
            p.y=max(-3.17,min(-.465,p.y));v.co=inv@p;count+=1
    SC['user_review_c04_sill_ends']=True;bpy.context.view_layer.update()
    print('C04 SILL TERMINATED BELOW DORMER SOFFIT',count)

def inspect_c04_headboard_occlusion():
    data={'rays':[],'bed':[]}
    for x in [-3.3,-3,-2.7,-2.4]:
        for z in [9.9,10.1,10.3,10.6,11]:
            data['rays'].append({'origin':[x,-.7,z],'hit':ray_info((x,-.7,z),(0,1,0),1.3)})
    for name in ['Headboard.004','C04 | Timber top rail.001']:
        o=bpy.data.objects[name];ev=o.evaluated_get(bpy.context.evaluated_depsgraph_get())
        data['bed'].append({'name':name,'bounds':bounds(o),'evaluated_bounds':bounds(ev),'modifiers':[m.name for m in o.modifiers]})
    (REVIEW/'c04-headboard-occlusion.json').write_text(json.dumps(data),encoding='utf-8')
    print('HEADBOARD OCCLUSION PROBES SAVED')

def fit_c04_actual_wall_contact():
    if not SC.get('user_review_c04_bed_actual_wall'):
        names=[r['name']for r in json.loads((REVIEW/'c04-photo-group.json').read_text())['bed']]
        for n in names:bpy.data.objects[n].location.y-=.52626
        for o in bpy.data.collections['level-3'].objects:
            if o.name.startswith(('C04 | Blue three drawer','C04 | Bedside')):o.location.y-=.52626
        SC['user_review_c04_bed_actual_wall']=True
    bpy.context.view_layer.update()
    pos=Vector((-1.5,-2.7,10.85));rot=(Vector((-2,.1,10.4))-pos).to_track_quat('-Z','Y')
    hits=[]
    for px,py in [(100,118),(330,375),(350,389),(500,77),(333,500)]:
        direction=rot@Vector(((px/1400-.5)*1.8,(.5-py/1000)*1.8/1.4,-1));direction.normalize()
        hits.append({'pixel':[px,py],'hit':ray_info(pos,direction,8)})
    (REVIEW/'c04-orange-surface-rays.json').write_text(json.dumps(hits),encoding='utf-8')
    print('BED FIT TO MEASURED WALL y=-0.32226; ROOF ARTIFACT RAYS SAVED')

def correct_basement_appliance_alignment():
    if SC.get('user_review_basement_appliances'):return
    moved=[]
    for o in list(bpy.data.collections['level-0'].objects):
        if o.type!='MESH':continue
        lo,hi=bounds(o)
        if lo[0]>-4.5 and hi[0]<-3.5 and lo[1]>-.3 and hi[1]<.36 and o.name.startswith(('Cooktop.001','Burner ring','Oven glass.001','Oven handle.001','Integrated under-cabinet extractor')):
            o.location.x-=.21969
            if o.name.startswith('Integrated under-cabinet extractor'):o.location.z-=.03
            moved.append(o.name)
        if o.get('assembly_id')=='Garden kitchen / base bay Kitchen base carcass.014' and o.name.startswith(('R33 | Green glazed base door','R33 | Frosted glass base infill','R33 | Cabinet shaped pull','R33 | Base internal shelf')):
            archive_object(o)
    metal=bpy.data.materials['metal'];black=bpy.data.materials['black']
    solid_box('Basement | Fitted oven surround',(-4.439,.251,.105),(-3.998,.269,.802),metal,0,.002)
    solid_box('Basement | Oven control fascia',(-4.439,.269,.738),(-3.998,.301,.812),black,0,.002)
    # The peninsula and sink run form one level, rather than two stacked slabs.
    bar=bpy.data.objects['Breakfast bar surface'];bar.location.z-=.03002
    SC['user_review_basement_appliances']=True;bpy.context.view_layer.update()
    (REVIEW/'basement-appliance-alignment.json').write_text(json.dumps({'moved':moved,'axis_x':-4.2185,'extractor_clearance_below_cupboard':.025,'counter_top_z':.91752,'remaining':'Full counter junction and photographed joinery details still under review'}),encoding='utf-8')
    print('BASEMENT OVEN HOB EXTRACTOR ALIGNED',moved)

def inspect_ceiling_material_links():
    rows=[]
    for name in ['ceiling.003','roof.003']:
        m=bpy.data.materials[name]
        rows.append({'name':name,'links':[(l.from_node.name,l.from_socket.name,l.to_node.name,l.to_socket.name)for l in m.node_tree.links]})
    (REVIEW/'ceiling-material-links.json').write_text(json.dumps(rows),encoding='utf-8')

def inspect_c04_visible_roof_slivers():
    pos=Vector((-1.5,-2.7,10.85));rot=(Vector((-2,.1,10.4))-pos).to_track_quat('-Z','Y');dg=bpy.context.evaluated_depsgraph_get();hits={}
    for px,cy in [(x,.315*x+82)for x in range(50,194,8)]+[(x,.40*x+246)for x in range(180,373,8)]:
        for d in range(-5,6):
            py=cy+d;direction=rot@Vector(((px/1400-.5)*1.8,(.5-py/1000)*1.8/1.4,-1));direction.normalize()
            ok,point,normal,index,obj,matrix=SC.ray_cast(dg,pos,direction,distance=8)
            if ok and obj.name=='F3 | ÇATII' and index>=0:
                p=obj.data.polygons[index]
                if obj.material_slots[p.material_index].material.name.startswith('roof'):
                    hits[index]={'index':index,'point':list(point),'points':[list(matrix@obj.data.vertices[j].co)for j in p.vertices]}
    (REVIEW/'c04-roof-slivers.json').write_text(json.dumps(list(hits.values())),encoding='utf-8')
    print('VISIBLE ROOF SLIVER FACES',len(hits))

def finish_c04_roof_lining_clearance():
    if SC.get('user_review_c04_lining_clearance'):return
    o=bpy.data.objects['F3 | ÇATII'];o.data.use_fake_user=True;o.data=o.data.copy();indices=set()
    for p in o.data.polygons:
        if p.material_index!=1:continue
        pts=[o.matrix_world@o.data.vertices[j].co for j in p.vertices]
        if all(-3.791<v.x<1.881 and -4.024<v.y<.228 for v in pts):indices.update(p.vertices)
    inv=o.matrix_world.inverted()
    for j in indices:
        p=o.matrix_world@o.data.vertices[j].co;p.z-=.03;o.data.vertices[j].co=inv@p
    # Initial ray samples measured 4–17 mm; vertex analysis subsequently found
    # a 58.96 mm maximum. The final pass below supplies the full clearance.
    core=bpy.data.objects['F3 | Attic partition core'];core.data.use_fake_user=True;core.data=core.data.copy()
    inner=next(i for i,s in enumerate(core.material_slots)if s.material and s.material.name.startswith('interior'))
    changed=[]
    for p in core.data.polygons:
        if not core.material_slots[p.material_index].material.name.startswith('stucco'):continue
        pts=[core.matrix_world@core.data.vertices[j].co for j in p.vertices]
        if all(-3.60<v.x<1.88 and -4.02<v.y<.24 and v.z>9.46 for v in pts):p.material_index=inner;changed.append(p.index)
    SC['user_review_c04_lining_clearance']=True;bpy.context.view_layer.update()
    (REVIEW/'c04-lining-clearance.json').write_text(json.dumps({'ceiling_vertices':len(indices),'lining_clearance':.03,'interior_core_faces':changed,'roof_skin_unchanged':True}),encoding='utf-8')
    print('C04 LINING CLEARANCE AND INTERNAL PLASTER',len(indices),len(changed))

def finalize_c04_lining_separation():
    if SC.get('user_review_c04_lining_70mm'):return
    assert SC.get('user_review_c04_lining_clearance'), 'Run initial 30 mm clearance first'
    o=bpy.data.objects['F3 | ÇATII'];o.data=o.data.copy();indices=set()
    for p in o.data.polygons:
        if p.material_index!=1:continue
        pts=[o.matrix_world@o.data.vertices[j].co for j in p.vertices]
        if all(-3.791<v.x<1.881 and -4.024<v.y<.228 for v in pts):indices.update(p.vertices)
    inv=o.matrix_world.inverted()
    for j in indices:
        p=o.matrix_world@o.data.vertices[j].co;p.z-=.04;o.data.vertices[j].co=inv@p
    SC['user_review_c04_lining_70mm']=True;bpy.context.view_layer.update()
    (REVIEW/'c04-final-lining-clearance.json').write_text(json.dumps({'ceiling_vertices':len(indices),'total_clearance_m':.07,'measured_skin_penetration_m':.0589561,'roof_skin_unchanged':True}),encoding='utf-8')
    print('C04 FINAL 70 MM LINING SEPARATION',len(indices))

def inspect_attic_remaining_junctions():
    cameras=[{'id':o.get('room_id'),'position':list(o.location)}for o in SC.objects if o.type=='CAMERA' and str(o.get('room_id','')).startswith('f3-')]
    roof=bpy.data.objects['F3 | ÇATII']
    faces=[]
    for p in roof.data.polygons:
        if p.material_index!=1:continue
        pts=[roof.matrix_world@roof.data.vertices[j].co for j in p.vertices]
        faces.append({'index':p.index,'points':[list(v)for v in pts],'normal':list(p.normal),'area':p.area})
    hits={};dg=bpy.context.evaluated_depsgraph_get()
    for row in cameras:
        for az in range(0,360,3):
            for el in range(-15,76,5):
                a=math.radians(az);e=math.radians(el);direction=Vector((math.cos(a)*math.cos(e),math.sin(a)*math.cos(e),math.sin(e)))
                ok,pt,n,idx,o,matrix=SC.ray_cast(dg,Vector(row['position']),direction,distance=8)
                if ok and idx>=0 and o.type=='MESH' and o.name.startswith('F3 |') and idx<len(o.data.polygons):
                    if o.data.polygons[idx].material_index>=len(o.material_slots):continue
                    mat=o.material_slots[o.data.polygons[idx].material_index].material
                    if mat and mat.name.startswith('stucco'):
                        key=(o.name,idx)
                        hits[key]={'object':o.name,'face':idx,'points':[list(matrix@o.data.vertices[j].co)for j in o.data.polygons[idx].vertices],'station':row['id']}
    (REVIEW/'attic-junction-current.json').write_text(json.dumps({'cameras':cameras,'ceiling_faces':faces,'visible_blue_faces':list(hits.values())}),encoding='utf-8')
    print('ATTIC JUNCTION AUDIT',len(faces),'ceiling faces;',len(hits),'visible blue faces')

def complete_c04_tv_drawer_spacing():
    if SC.get('user_review_c04_drawer_spacing'):return
    # Preserve the four photographed drawers and extend their vertical joinery
    # consistently to the underside of the top, closing the unintended slot.
    for o in bpy.data.collections['level-3'].objects:
        if not o.name.startswith(('C04 | TV chest photographed drawer','C04 | TV chest timber drawer border')):continue
        o.data=o.data.copy();inv=o.matrix_world.inverted()
        for v in o.data.vertices:
            p=o.matrix_world@v.co;p.z=9.61+(p.z-9.61)*(10.525-9.61)/(10.444-9.61);v.co=inv@p
    SC['user_review_c04_drawer_spacing']=True;bpy.context.view_layer.update()
    print('C04 FOUR DRAWER JOINERY FITTED TO TOP')

def repair_hall_ceiling_and_inner_planes(north=False,east=False):
    guard='user_review_east_lining_junction_strip' if east else ('user_review_north_lining_full_depth' if north else 'user_review_hall_lining_planes')
    if SC.get(guard):return
    def clip(poly,a,b,c,positive=True):
        out=[]
        if not poly:return out
        for u,v in zip(poly,poly[1:]+poly[:1]):
            du=a*u[0]+b*u[1]+c;dv=a*v[0]+b*v[1]+c
            iu=du>=-1e-8 if positive else du<=1e-8;iv=dv>=-1e-8 if positive else dv<=1e-8
            if iu:out.append(u)
            if iu!=iv:
                t=du/(du-dv);out.append([u[k]+t*(v[k]-u[k])for k in range(len(u))])
        return out
    o=bpy.data.objects['F3 | ÇATII'];old=o.data;old.use_fake_user=True
    x0,x1,y0,y1=-6.56,-.49,.227,3.99448
    if north:x0,x1,y0,y1=-3.79,1.88,3.99448,8.85
    if east:x0,x1,y0,y1=-.4931873,1.88,3.36,3.99448
    box=[(1,0,-x0),(-1,0,x1),(0,1,-y0),(0,-1,y1)]
    polygons=[]
    for p in old.polygons:
        pts=[]
        for li in p.loop_indices:
            co=o.matrix_world@old.vertices[old.loops[li].vertex_index].co
            uv=old.uv_layers.active.data[li].uv if old.uv_layers.active else (co.x,co.y)
            pts.append([*co,*uv])
        if p.material_index!=1:polygons.append((pts,p.material_index));continue
        for line in box:
            q=clip(pts,*line,False)
            if len(q)>=3:polygons.append((q,1))
            pts=clip(pts,*line)
    # CAD-derived shallow cross roof over the lounge joins the main pitched roof.
    planes=[(.6921,0,12.7963),(0,.145,11.876),(0,-.145,12.464)]
    if north:planes=[(.6921,0,12.7963),(-.69135,0,12.114),(0,.6922,7.486),(0,-.6922,15.698)]
    if east:planes=[(-.69135,0,12.114)]
    regions=[[[x0,y0],[x1,y0],[x1,y1],[x0,y1]]]
    for i,a in enumerate(planes):
        for b in planes[i+1:]:
            line=[a[j]-b[j]for j in range(3)]
            regions=[q for p in regions for q in [clip(p,*line),clip(p,*line,False)]if len(q)>=3]
    patches=0
    for p in regions:
        area=abs(sum(u[0]*v[1]-v[0]*u[1]for u,v in zip(p,p[1:]+p[:1])))/2
        if area<1e-7:continue
        x=sum(v[0]for v in p)/len(p);y=sum(v[1]for v in p)/len(p)
        heights=[a*x+b*y+c for a,b,c in planes]
        if east:a,b,c=planes[0]
        else:
            cross=min((1,2),key=lambda i:heights[i]);chosen=max((0,cross),key=lambda i:heights[i]);a,b,c=planes[chosen]
        if north:
            main=min((0,1),key=lambda i:heights[i]);dormer=min((2,3),key=lambda i:heights[i]);chosen=max((main,dormer),key=lambda i:heights[i])if x<-.49 else main;a,b,c=planes[chosen]
        polygons.append(([[u,v,a*u+b*v+c-.07,u,v]for u,v in reversed(p)],1));patches+=1
    vertices=[];faces=[];materials=[];uvs=[];inv=o.matrix_world.inverted()
    for points,mi in polygons:
        if len(points)<3:continue
        first=len(vertices);vertices.extend(inv@Vector(p[:3])for p in points);faces.append(list(range(first,first+len(points))));materials.append(mi);uvs.extend(p[3:]for p in points)
    mesh=bpy.data.meshes.new('Attic roof continuous hall lining');mesh.from_pydata(vertices,[],faces);mesh.update()
    for m in old.materials:mesh.materials.append(m)
    uv=mesh.uv_layers.new(name='UVMap')
    for p,mi in zip(mesh.polygons,materials):
        p.material_index=mi
        for li in p.loop_indices:uv.data[li].uv=uvs[mesh.loops[li].vertex_index]
    o.data=mesh
    audit=json.loads((REVIEW/'attic-junction-current.json').read_text());changed={}
    for name in set(r['object']for r in audit['visible_blue_faces']):
        wall=bpy.data.objects[name];wall.data.use_fake_user=True;wall.data=wall.data.copy()
        inner=next((i for i,m in enumerate(wall.data.materials)if m and m.name.startswith('interior')),None)
        if inner is None:wall.data.materials.append(bpy.data.materials['interior.003']);inner=len(wall.data.materials)-1
        seeds=[]
        for r in audit['visible_blue_faces']:
            if r['object']!=name:continue
            ps=[Vector(v)for v in r['points']];n=(ps[1]-ps[0]).cross(ps[2]-ps[0]).normalized();seeds.append((n,ps[0],sum(ps,Vector())/len(ps)))
        changed[name]=[]
        for p in wall.data.polygons:
            if not wall.material_slots[p.material_index].material.name.startswith('stucco'):continue
            ps=[wall.matrix_world@wall.data.vertices[j].co for j in p.vertices];centre=sum(ps,Vector())/len(ps)
            if any((centre-c).length<2 and all(abs((v-v0).dot(n))<.002 for v in ps)for n,v0,c in seeds):p.material_index=inner;changed[name].append(p.index)
    SC[guard]=True;bpy.context.view_layer.update()
    (REVIEW/('east-lining-corrected.json' if east else ('north-lining-corrected.json' if north else 'hall-lining-corrected.json'))).write_text(json.dumps({'patches':patches,'interior_faces':changed,'exterior_roof_uv_preserved':True}),encoding='utf-8')
    print('HALL CONTINUOUS CEILING',patches,'INTERIOR FACES',sum(len(v)for v in changed.values()))

def align_east_hall_lining_and_c04_station():
    if not SC.get('user_review_east_lining_70mm'):
        o=bpy.data.objects['F3 | ÇATII'];o.data=o.data.copy();indices=set();inv=o.matrix_world.inverted()
        for p in o.data.polygons:
            if p.material_index!=1:continue
            ps=[o.matrix_world@o.data.vertices[j].co for j in p.vertices]
            if all(-.49001<=v.x<=4.24001 and .22699<=v.y<=3.36001 for v in ps):indices.update(p.vertices)
        for j in indices:
            p=o.matrix_world@o.data.vertices[j].co;p.z-=.07;o.data.vertices[j].co=inv@p
        SC['user_review_east_lining_70mm']=True
    camera=next(o for o in SC.objects if o.type=='CAMERA' and o.get('room_id')=='f3-C04');camera.location=(-.9,-2.4,10.97)
    bpy.context.view_layer.update();checks=[]
    for z in [9.9,10.3,10.8,11.0]:
        for i in range(16):
            a=i*math.tau/16;checks.append(ray_info((-.9,-2.4,z),(math.cos(a),math.sin(a),0),.24))
    (REVIEW/'c04-station-clearance.json').write_text(json.dumps({'position':list(camera.location),'body_radius_m':.24,'blocked_samples':[x for x in checks if x]}),encoding='utf-8')
    print('C04 STATION MOVED; BODY CLEARANCE HITS',sum(x is not None for x in checks))

def add_ground_kitchen_corner_seating():
    if SC.get('user_review_kitchen_corner_seating'):return
    before=set(SC.objects);floor=3.0996;iron=finish_material('Kitchen corner | Black iron',(.028,.03,.027),.55)
    stone=finish_material('Kitchen corner | Pale mosaic stone',(.63,.59,.49),.78)
    dark=finish_material('Kitchen corner | Dark mosaic stone',(.14,.145,.13),.82)
    cx,cy=-.18,-3.53;top=floor+.69
    lathe_solid('Kitchen corner | Round mosaic tabletop',(cx,cy),[(.285,top-.025),(.30,top-.02),(.30,top),(.285,top+.006)],iron,1,64)
    lathe_solid('Kitchen corner | Mosaic centre',(cx,cy),[(.238,top+.004),(.238,top+.008)],stone,1,64)
    for i in range(32):
        a=i*math.tau/32;b=(i+.92)*math.tau/32
        make_mesh('Kitchen corner | Mosaic border',[(cx+r*math.cos(t),cy+r*math.sin(t),top+.009)for r,t in [(.245,a),(.283,a),(.283,b),(.245,b)]],[(0,1,2,3)],stone if i%2==0 else dark,1)
    lathe_solid('Kitchen corner | Lower circular shelf',(cx,cy),[(.12,floor+.31),(.12,floor+.326)],iron,1,32)
    for angle in [0,math.tau/3,2*math.tau/3]:
        coords=[(.22,.025),(.25,.07),(.19,.16),(.105,.28),(.085,.44),(.145,.61),(.20,.665)]
        pts=[(cx+r*math.cos(angle),cy+r*math.sin(angle),floor+z)for r,z in coords]
        for a,b in zip(pts,pts[1:]):rod_mesh('Kitchen corner | Curved table leg',a,b,.009,iron,1,10)
    for idx,(x,y,a) in enumerate([(-.73,-3.55,-math.pi/2),(.23,-3.04,2.48)]):
        def p(u,v,z):return(x+u*math.cos(a)-v*math.sin(a),y+u*math.sin(a)+v*math.cos(a),floor+z)
        for u in [-.185,.185]:
            for ends in [((u,-.20,.018),(u,.17,.47)),((u,.22,.018),(u,-.18,.47)),((u,.17,.45),(u,.19,.86))]:rod_mesh('Kitchen corner | Folding chair frame',p(*ends[0]),p(*ends[1]),.009,iron,1,10)
        for v in [-.15,-.09,-.03,.03,.09,.15]:rod_mesh('Kitchen corner | Chair seat slat',p(-.185,v,.445),p(.185,v,.445),.015,iron,1,8)
        for z in [.60,.68,.77,.86]:rod_mesh('Kitchen corner | Chair back rail',p(-.185,.19,z),p(.185,.19,z),.009,iron,1,10)
        rod_mesh('Kitchen corner | Chair lower brace',p(-.185,.17,.22),p(.185,.17,.22),.007,iron,1,10)
    for o in set(SC.objects)-before:
        o['reference']='kat_2_ust_mutfak/WhatsApp Image 2026-08-26 at 11.53.53 (2).jpeg';o['assembly_id']='Ground kitchen / photographed corner seating';o['walk_role']='solid'
    SC['user_review_kitchen_corner_seating']=True;bpy.context.view_layer.update()
    (REVIEW/'ground-kitchen-corner-seating.json').write_text(json.dumps({'table_centre':[cx,cy],'table_diameter':.60,'chairs':2,'doorway_preserved':'kitchen-front at x=-3.58','objects':len(set(SC.objects)-before)}),encoding='utf-8')
    print('GROUND KITCHEN PHOTO CORNER SEATING ADDED')

def complete_basement_counter_junction():
    if SC.get('user_review_basement_counter_union'):return
    mat=bpy.data.materials['Ivory kitchen countertop'];xs=[-5.578,-5.4935,-5.013,-4.928,-2.49];ys=[.88,1.705,2.18,2.295,2.9,3.12]
    cells=set()
    for i in range(len(xs)-1):
        for j in range(len(ys)-1):
            x=(xs[i]+xs[i+1])/2;y=(ys[j]+ys[j+1])/2
            inside=x<-4.928 or 2.18<y<2.9
            sink=-5.4935<x<-5.013 and 1.705<y<2.295
            if inside and not sink:cells.add((i,j))
    vs=[];fs=[];z0,z1=.8725,.91752
    for i,j in cells:
        x0,x1=xs[i:i+2];y0,y1=ys[j:j+2];k=len(vs)
        vs.extend([(x0,y0,z0),(x1,y0,z0),(x1,y1,z0),(x0,y1,z0),(x0,y0,z1),(x1,y0,z1),(x1,y1,z1),(x0,y1,z1)])
        faces=[(3,2,1,0),(4,5,6,7)]
        for neighbor,face in [((i,j-1),(0,1,5,4)),((i+1,j),(1,2,6,5)),((i,j+1),(2,3,7,6)),((i-1,j),(3,0,4,7))]:
            if neighbor not in cells:faces.append(face)
        fs.extend(tuple(k+v for v in f)for f in faces)
    o=make_mesh('Basement | Continuous sink and peninsula worktop',vs,fs,mat,0)
    bm=bmesh.new();bm.from_mesh(o.data);bmesh.ops.remove_doubles(bm,verts=list(bm.verts),dist=.000001);bmesh.ops.dissolve_limit(bm,angle_limit=.001,verts=list(bm.verts),edges=list(bm.edges));bmesh.ops.recalc_face_normals(bm,faces=list(bm.faces));bm.to_mesh(o.data);bm.free();o.data.update()
    bevel=o.modifiers.new('Soft stone edge','BEVEL');bevel.width=.004;bevel.segments=3;bevel.limit_method='ANGLE'
    for name in ['Countertop.003','Countertop.004','Countertop sink border.002','Countertop sink border.003','Breakfast bar surface']:archive_object(bpy.data.objects[name])
    steel=finish_material('Basement | Brushed stainless refrigerator',(.34,.36,.36),.38)
    steel.node_tree.nodes['Principled BSDF'].inputs['Metallic'].default_value=.8
    for name in ['Garden refrigerator beside elevator','R33 | Refrigerator enamel door','R33 | Refrigerator enamel door.001']:
        obj=bpy.data.objects[name];obj.data=obj.data.copy();obj.data.materials.clear();obj.data.materials.append(steel)
    # The actual photographs show opaque frosted panels, not clear glass shelves.
    for obj in bpy.data.collections['level-0'].objects:
        if obj.get('assembly_id','').startswith('Garden kitchen') and 'Frosted glass' in obj.name:
            for slot in obj.material_slots:
                if not slot.material:continue
                m=slot.material.copy();m.name='Basement | Photographed satin green panel';bs=m.node_tree.nodes.get('Principled BSDF')
                if bs:
                    for link in list(bs.inputs['Base Color'].links):m.node_tree.links.remove(link)
                    bs.inputs['Base Color'].default_value=(.14,.24,.22,1);bs.inputs['Roughness'].default_value=.52
                    if 'Transmission Weight'in bs.inputs:bs.inputs['Transmission Weight'].default_value=0
                slot.link='OBJECT';slot.material=m
    o['reference']='kat_1_bodrum_mutfak/WhatsApp Image 2026-08-26 at 11.54.10 (4).jpeg';o['walk_role']='solid'
    SC['user_review_basement_counter_union']=True;bpy.context.view_layer.update()
    (REVIEW/'basement-counter-union.json').write_text(json.dumps({'counter':o.name,'single_surface':True,'sink_opening_preserved':True,'top_z':z1,'source_slabs_archived':5}),encoding='utf-8')
    print('BASEMENT CONTINUOUS COUNTER AND PHOTO APPLIANCE FINISH')

def inspect_kitchen_wall_contacts():
    cases=[((-4.7,-3.7,3.6),(-1,0,0)),((-.5,-3.6,3.7),(0,-1,0)),((-4.5,.5,1.2),(-1,0,0)),((-5.2,1.1,1.2),(0,-1,0)),((-4.5,1.3,1.2),(-1,0,0))]
    data=[{'origin':p,'direction':d,'hit':ray_info(p,d,2)}for p,d in cases]
    (REVIEW/'kitchen-wall-contacts.json').write_text(json.dumps(data),encoding='utf-8');print('KITCHEN WALL CONTACTS SAVED')
    if not SC.get('user_review_kitchen_chair_orientation'):
        for o in bpy.data.collections['level-1'].objects:
            if not o.name.startswith(('Kitchen corner | Chair','Kitchen corner | Folding chair')):continue
            lo,hi=bounds(o);centre=Vector(((lo[0]+hi[0])/2,(lo[1]+hi[1])/2,0))
            pivot=min([Vector((-.73,-3.55,0)),Vector((.23,-3.04,0))],key=lambda p:(p-centre).length)
            o.matrix_world=Matrix.Translation(pivot)@Matrix.Rotation(math.pi,4,'Z')@Matrix.Translation(-pivot)@o.matrix_world
        SC['user_review_kitchen_chair_orientation']=True;bpy.context.view_layer.update()

def fit_kitchen_radiator_and_basement_tiles():
    if SC.get('user_review_kitchen_surface_contacts'):return
    for o in bpy.data.collections['level-1'].objects:
        if o.name.startswith('Radiator fin'):
            lo,hi=bounds(o)
            if -4.1<lo[1]<-3.3 and 3.1<lo[2]<3.3:o.location.x+=.5
        if o.get('assembly_id')=='Ground kitchen / photographed corner seating':o.location.y-=.55
    grout=finish_material('Basement | Warm tile grout',(.54,.48,.38),.9)
    tiles=[finish_material('Basement | Ochre wall tile '+str(i),(.29+.018*i,.185+.012*i,.10+.009*i),.63)for i in range(5)]
    # Wall coordinates are measured from the actual finished wall, not its core.
    surfaces=[('sink',(-5.547,.767),(0,1),2.383),('column-front',(-5.548,.762),(1,0),.546),('column-side',(-4.997,.30),(0,1),.457)]
    for label,(x,y),(dx,dy),width in surfaces:
        nx,ny=(1,0)if dy else(0,1)
        def q(u,z):return(x+dx*u,y+dy*u,z)
        panel=make_mesh('Basement | Tile grout '+label,[q(0,.92),q(width,.92),q(width,1.56),q(0,1.56)],[(0,1,2,3)],grout,0)
        count=math.ceil(width/.12)
        for i in range(count):
            for j in range(6):
                u0=i*.12+.002;u1=min(width,(i+1)*.12)-.002;z0=.92+j*.12+.002;z1=min(1.56,.92+(j+1)*.12)-.002
                if u1<=u0 or z1<=z0:continue
                points=[(a+nx*.003,b+ny*.003,c)for a,b,c in [q(u0,z0),q(u1,z0),q(u1,z1),q(u0,z1)]]
                tile=make_mesh('Basement | Photographed tiled backsplash '+label,points,[(0,1,2,3)],tiles[(i*3+j*7)%5],0)
                tile['walk_role']='decoration';tile['reference']='kat_1_bodrum_mutfak/WhatsApp Image 2026-08-26 at 11.54.10 (4).jpeg'
    SC['user_review_kitchen_surface_contacts']=True;bpy.context.view_layer.update()
    print('RADIATOR FIT TO x=-5.00189 FINISHED WALL; BASEMENT TILES WRAP COLUMN')

def match_basement_upper_joinery():
    if SC.get('user_review_basement_upper_joinery'):return
    wood=bpy.data.materials['R31 | R33 garden kitchen walnut'];green=finish_material('Basement | Satin green cupboard fronts',(.14,.24,.22),.52);metal=bpy.data.materials['chrome']
    archived=[]
    for o in list(bpy.data.collections['level-0'].objects):
        if o.type!='MESH' or not o.name.startswith(('Upper cupboard','R33 | Glazed upper cupboard')):continue
        lo,hi=bounds(o)
        south=-5.01<lo[0] and hi[0]<-3.45 and -.3<lo[1] and hi[1]<.15
        west=-5.6<lo[0] and hi[0]<-5.1 and .85<lo[1] and hi[1]<3.2
        if lo[2]>1.54 and hi[2]<2.45 and (south or west):archived.append(o.name);archive_object(o)
    def box(label,axis,u0,u1,v0,v1,z0,z1,mat):
        lo=(u0,v0,z0)if axis=='south' else(v0,u0,z0);hi=(u1,v1,z1)if axis=='south' else(v1,u1,z1)
        obj=solid_box('Basement | '+label,lo,hi,mat,0,.002);obj['assembly_id']='Basement / photographed upper cabinetry';return obj
    def door(axis,u0,u1,back,front,z0=1.56,z1=2.38,handle_side=1):
        box('Upper cabinet back',axis,u0,u1,back,back+.018,z0,z1,wood)
        for a,b in [(u0,u0+.022),(u1-.022,u1)]:box('Upper cabinet side',axis,a,b,back,front,z0,z1,wood)
        for a,b in [(z0,z0+.024),(z1-.024,z1)]:box('Upper cabinet shelf',axis,u0,u1,back,front,a,b,wood)
        box('Satin green upper door',axis,u0+.038,u1-.038,front+.011,front+.022,z0+.05,z1-.05,green)
        for a,b in [(u0+.003,u0+.045),(u1-.045,u1-.003)]:box('Upper door timber stile',axis,a,b,front,front+.035,z0+.005,z1-.005,wood)
        for a,b in [(z0+.005,z0+.055),(z1-.055,z1-.005)]:box('Upper door timber rail',axis,u0+.045,u1-.045,front,front+.035,a,b,wood)
        u=u1-.065 if handle_side>0 else u0+.065
        a=(u,front+.061,z0+.08)if axis=='south' else(front+.061,u,z0+.08)
        b=(u,front+.061,z0+.24)if axis=='south' else(front+.061,u,z0+.24)
        rod_mesh('Basement | Cabinet metal pull',a,b,.006,metal,0,12)
    def rack(axis,u0,u1,back,front):
        box('Spice rack back',axis,u0,u1,back,back+.02,1.56,2.38,wood)
        for a,b in [(u0,u0+.014),(u1-.014,u1)]:box('Spice rack upright',axis,a,b,back,front,1.56,2.38,wood)
        jar=finish_material('Basement | Spice jar amber',(.21,.095,.025),.4)
        for z in [1.565,1.72,1.88,2.04,2.20,2.36]:
            box('Spice rack shelf',axis,u0,u1,back,front,z,z+.012,wood)
            if z>2.3:continue
            u=(u0+u1)/2;v=front-.045;xy=(u,v)if axis=='south'else(v,u)
            lathe_solid('Basement | Spice jar',xy,[(.024,z+.012),(.024,z+.085),(.019,z+.10)],jar,0,12)
            lathe_solid('Basement | Spice jar cap',xy,[(.021,z+.10),(.021,z+.115)],metal,0,12)
    rack('south',-4.95,-4.79,-.266,.067)
    door('south',-4.78,-4.142,-.266,.067,handle_side=1)
    door('south',-4.134,-3.495,-.266,.067,handle_side=-1)
    door('south',-3.53,-2.935,-.266,.067,1.96,2.38,-1)
    for i,(a,b)in enumerate([(.89,1.412),(1.42,1.942),(2.062,2.584),(2.592,3.114)]):door('west',a,b,-5.55,-5.16,handle_side=1 if i%2==0 else-1)
    rack('west',1.95,2.054,-5.55,-5.16)
    box('South continuous crown','south',-4.965,-2.92,-.28,.11,2.38,2.42,wood)
    box('Sink continuous crown','west',.875,3.13,-5.57,-5.115,2.38,2.42,wood)
    SC['user_review_basement_upper_joinery']=True;bpy.context.view_layer.update()
    (REVIEW/'basement-upper-joinery.json').write_text(json.dumps({'archived':archived,'hob_cupboard_doors':2,'sink_cupboard_doors':4,'open_spice_racks':2,'short_cupboard_above_fridge':True}),encoding='utf-8')
    print('BASEMENT PHOTOGRAPHED UPPER JOINERY',len(archived),'source parts archived')

def apply_lift_photo_panels():
    if SC.get('user_review_lift_photo_panels'):return
    texture=ROOT/'assets/review-textures/lift-rose-photo-v1.png'
    img=bpy.data.images.load(str(texture),check_existing=True);img.pack()
    mat=finish_material('Lift | Photographed rose glass 80 percent',(.8,.8,.8),.55)
    bs=mat.node_tree.nodes.get('Principled BSDF');tex=mat.node_tree.nodes.new('ShaderNodeTexImage');tex.image=img
    mat.node_tree.links.new(tex.outputs['Color'],bs.inputs['Base Color']);bs.inputs['Alpha'].default_value=.8
    mat.diffuse_color=(.8,.8,.8,.8);mat.surface_render_method='DITHERED';mat.use_backface_culling=False
    mat['source_reference']='asansor/WhatsApp Image 2026-08-26 at 11.54.10 (10).jpeg; kat_1_bodrum_mutfak/WhatsApp Image 2026-08-26 at 11.54.10 (4).jpeg'
    mat['texture_method']='Built-in imagegen photo rectification; compare against source photographs';mat['opacity']=.8
    archived=[];panels=[]
    for level,z in enumerate([0,3.0996,6.3714]):
        col=bpy.data.collections['level-'+str(level)];pivot=Vector((-1.53,1.33,z))
        rotation=Matrix.Translation(pivot)@Matrix.Rotation(math.pi/2,4,'Z')@Matrix.Translation(-pivot)
        wood=None
        for o in list(col.objects):
            if o.name.startswith(('Lift floral','Lift glass rose','Lift stained-glass')):
                archived.append(o.name);archive_object(o)
            elif o.name.startswith(('Lift door stile','Lift door rail','Lift door pull')):
                o.matrix_world=rotation@o.matrix_world;o['lift_leaf_closed_pose']=True;o['lift_floor']=level
                if o.name.startswith('Lift door stile'):wood=o.material_slots[0].material
        for a,b in [(-2.37,-2.275),(-1.765,-1.67)]:
            o=solid_box('Lift door stile',(a,1.308,z+.33),(b,1.352,z+1.95),wood,level,.002)
            o['lift_leaf_closed_pose']=True;o['lift_floor']=level
        # A single two-sided pane avoids stacked translucent surfaces and carries
        # the same packed photo-derived PNG on every served landing.
        o=make_mesh('Lift floral textured glass',[(-2.275,1.33,z+.33),(-1.765,1.33,z+.33),(-1.765,1.33,z+1.95),(-2.275,1.33,z+1.95)],[(0,1,2,3)],mat,level)
        uv=o.data.uv_layers.new(name='UVMap')
        for loop,coord in zip(o.data.polygons[0].loop_indices,[(1,0),(0,0),(0,1),(1,1)]):uv.data[loop].uv=coord
        o['lift_leaf_closed_pose']=True;o['lift_floor']=level;o['walk_role']='dynamic';o['opacity']=.8
        panels.append(o.name)
    SC['user_review_lift_photo_panels']=True;bpy.context.view_layer.update()
    (REVIEW/'lift-photo-panels.json').write_text(json.dumps({'panels':panels,'archived_schematic_parts':archived,'opacity':.8,'initial_state':'closed','served_floors':[0,1,2],'texture':str(texture),'web_controller_update_required':True}),encoding='utf-8')
    print('THREE LIFT LANDINGS CLOSED; PACKED PHOTO ROSE PNG AT 80%')

def inspect_ceiling_seam_samples():
    rows=[];deps=bpy.context.evaluated_depsgraph_get()
    for rid,pixels in [('f3-C01',[(840,166),(840,185),(960,265),(960,288),(1100,410),(1100,430)])]:
        cam=next(o for o in SC.objects if o.type=='CAMERA' and o.get('room_id')==rid)
        for x,y in pixels:
            lon=(x/1600-.5)*math.tau;lat=(.5-y/800)*math.pi
            local=Vector((math.sin(lon)*math.cos(lat),math.sin(lat),-math.cos(lon)*math.cos(lat)))
            # render_rooms fixes the panoramic camera to +90 degrees around X.
            direction=Matrix.Rotation(math.pi/2,3,'X')@local
            hit,p,n,idx,o,mat=SC.ray_cast(deps,cam.matrix_world.translation,direction,distance=30)
            row={'room':rid,'pixel':[x,y],'hit':hit,'object':o.name if hit else None,'point':list(p),'normal':list(n),'index':idx}
            if hit and o.type=='MESH' and idx<len(o.data.polygons):
                face=o.data.polygons[idx];row['face']=[list(o.matrix_world@o.data.vertices[j].co)for j in face.vertices]
                row['material']=o.material_slots[face.material_index].material.name
            rows.append(row)
    (REVIEW/'ceiling-seam-samples.json').write_text(json.dumps(rows),encoding='utf-8');print('CEILING SEAM PIXEL PROBES',len(rows))

def finish_lift_panel_uv_and_timber():
    wood=finish_material('Lift | Photographed walnut door finish',(.12,.065,.035),.42)
    for o in SC.objects:
        if o.type!='MESH':continue
        if o.get('lift_leaf_closed_pose') and o.name.startswith('Lift floral textured glass'):
            for layer in o.data.uv_layers:
                for loop,coord in zip(o.data.polygons[0].loop_indices,[(1,0),(0,0),(0,1),(1,1)]):layer.data[loop].uv=coord
            o.data.uv_layers.active_index=0
        elif o.name.startswith(('Lift door stile','Lift door rail','Lift timber architrave','Lift timber head')):
            o.data=o.data.copy();o.data.materials.clear();o.data.materials.append(wood)
            for p in o.data.polygons:p.material_index=0
    bpy.context.view_layer.update();print('LIFT FULL-PANEL UV AND WALNUT FINISH CORRECTED')

def rebuild_lift_timber_and_uv():
    wood=bpy.data.materials['Lift | Photographed walnut door finish']
    for o in list(SC.objects):
        if o.type!='MESH':continue
        if o.get('lift_leaf_closed_pose') and o.name.startswith('Lift floral textured glass'):
            z=[0,3.0996,6.3714][o['lift_floor']]
            for layer in o.data.uv_layers:
                for loop in o.data.loops:
                    p=o.matrix_world@o.data.vertices[loop.vertex_index].co
                    layer.data[loop.index].uv=((-1.765-p.x)/.51,(p.z-z-.33)/1.62)
            bs=o.material_slots[0].material.node_tree.nodes.get('Principled BSDF');bs.inputs['Specular IOR Level'].default_value=.12
    if SC.get('user_review_lift_timber_rebuilt'):return
    for level,z in enumerate([0,3.0996,6.3714]):
        col=bpy.data.collections['level-'+str(level)]
        for o in list(col.objects):
            if o.name.startswith(('Lift door stile','Lift door rail')):archive_object(o)
            elif o.name.startswith(('Lift timber architrave','Lift timber head')):
                name=o.name;lo,hi=bounds(o);archive_object(o)
                solid_box(name,lo,hi,wood,level,.003)
        for a,b in [(-2.51,-2.275),(-1.765,-1.525)]:
            o=solid_box('Lift door stile',(a,1.308,z+.01),(b,1.352,z+2.07),wood,level,.003);o['lift_leaf_closed_pose']=True;o['lift_floor']=level
        for a,b in [(.01,.33),(1.95,2.07)]:
            o=solid_box('Lift door rail',(-2.275,1.308,z+a),(-1.765,1.352,z+b),wood,level,.003);o['lift_leaf_closed_pose']=True;o['lift_floor']=level
    SC['user_review_lift_timber_rebuilt']=True;bpy.context.view_layer.update();print('LIFT TIMBER JOINTS REBUILT; UV MAPPED BY WORLD COORDINATES')

def align_attic_ridge_joint():
    if SC.get('user_review_attic_ridge_joint'):return
    o=bpy.data.objects['F3 | ÇATII'];o.data=o.data.copy();inv=o.matrix_world.inverted();indices=set()
    for face in o.data.polygons:
        if face.material_index==1:indices.update(face.vertices)
    changed=0
    for i in indices:
        p=o.matrix_world@o.data.vertices[i].co
        if abs(p.x+.49)<.00002 and .227-1e-5<=p.y<=3.99449 and p.z>12.37:
            p.x=-.4931873;p.z=12.384965;o.data.vertices[i].co=inv@p;changed+=1
    SC['user_review_attic_ridge_joint']=True;bpy.context.view_layer.update();print('ATTIC RIDGE JOINT ALIGNED',changed)

def inspect_joinery_and_window():
    cases=[((-1.48,3.3,2.05),(0,-1,0)),((-2.56,3.3,2.05),(0,-1,0))]
    cases += [((x,-4.6,z),(0,-1,0))for x in [-1,-.5,0]for z in [3.4,3.8,4.2,5.5]]
    rows=[{'origin':p,'hit':ray_info(p,d,2)}for p,d in cases]
    joinery=[{'name':o.name,'bounds':bounds(o),'materials':[s.material.name if s.material else None for s in o.material_slots]}for o in bpy.data.collections['level-2'].objects if o.type=='MESH' and str(o.get('assembly_id','')).startswith('Walk-in closet')]
    (REVIEW/'joinery-window-probes.json').write_text(json.dumps({'probes':rows,'joinery':joinery}),encoding='utf-8');print('JOINERY AND WINDOW PROBES SAVED')

def finish_lift_architrave_contacts():
    if SC.get('user_review_lift_frame_contacts'):return
    for level,z in enumerate([0,3.0996,6.3714]):
        col=bpy.data.collections['level-'+str(level)]
        head=next(o for o in col.objects if o.name.startswith('Lift timber head'));bottom=bounds(head)[0][2]
        for o in col.objects:
            if not o.name.startswith('Lift timber architrave'):continue
            o.data=o.data.copy();inv=o.matrix_world.inverted()
            for v in o.data.vertices:
                p=o.matrix_world@v.co
                if p.z>bottom:p.z=bottom;v.co=inv@p
    wood=bpy.data.materials['Lift | Photographed walnut door finish'];wood.node_tree.nodes['Principled BSDF'].inputs['Base Color'].default_value=(.07,.029,.014,1)
    SC['user_review_lift_frame_contacts']=True;bpy.context.view_layer.update();print('LIFT FRAME OVERLAPPING COPLANAR JOINTS REMOVED')

def complete_kitchen_window_fittings():
    if SC.get('user_review_kitchen_window_fittings'):return
    white=finish_material('Kitchen corner | Radiator enamel',(.78,.79,.76),.37)
    timber=finish_material('Kitchen corner | Walnut blind slats',(.16,.075,.027),.63)
    cord=finish_material('Kitchen corner | Blind cord',(.4,.29,.17),.9)
    for i in range(15):
        x=-1.03+i*.076
        solid_box('Kitchen corner | Under-window radiator fin',(x,-4.948,3.215),(x+.067,-4.86,3.66),white,1,.012)
    for z in [3.245,3.635]:rod_mesh('Kitchen corner | Radiator manifold',(-1.04,-4.913,z),(.12,-4.913,z),.018,white,1,12)
    for i in range(22):
        z=5.01+i*.025
        solid_box('Kitchen corner | Timber blind slat',(-1.12,-4.975,z),(.23,-4.94,z+.013),timber,1,.002)
    solid_box('Kitchen corner | Blind headrail',(-1.13,-4.99,5.55),(.24,-4.93,5.59),timber,1,.003)
    solid_box('Kitchen corner | Blind bottom rail',(-1.13,-4.99,4.993),(.24,-4.93,5.011),timber,1,.003)
    for x in [-.94,.05]:rod_mesh('Kitchen corner | Blind cord',(x,-4.927,5),(x,-4.927,5.56),.0017,cord,1,8)
    SC['user_review_kitchen_window_fittings']=True;bpy.context.view_layer.update();print('PHOTOGRAPHED WINDOW RADIATOR AND TIMBER BLIND ADDED')

def audit_review_stations():
    rooms=[]
    for cam in SC.objects:
        if cam.type!='CAMERA' or not cam.get('room_id'):continue
        p=cam.matrix_world.translation;floor=p.z-1.5;hits=[]
        for h in [.45,.8,1.2,1.5]:
            for i in range(16):
                a=i*math.tau/16;r=ray_info((p.x,p.y,floor+h),(math.cos(a),math.sin(a),0),.19)
                if r:hits.append({'height':h,**r})
        support=ray_info((p.x,p.y,floor+.15),(0,0,-1),.5)
        rooms.append({'id':cam['room_id'],'position':list(p),'body_hits':hits,'floor_support':support})
    (REVIEW/'all-room-station-clearance.json').write_text(json.dumps(rooms),encoding='utf-8')
    print('ALL ROOM STATIONS',len(rooms),'BODY HITS',sum(len(r['body_hits'])for r in rooms),'MISSING FLOOR',sum(r['floor_support'] is None for r in rooms))
