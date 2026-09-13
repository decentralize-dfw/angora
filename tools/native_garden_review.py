"""Garden inspection and repairs, executed inside the current Blender UI."""
import numpy as np
from mathutils.bvhtree import BVHTree
GARDEN_TREES={}
GOUT=ROOT/'build/qa/garden-native'
GOUT.mkdir(parents=True,exist_ok=True)

def garden_report(name,value):
    (GOUT/name).write_text(json.dumps(value,ensure_ascii=False,indent=2),encoding='utf-8')

def garden_surface(o,x,y,start=20):
    key=(o.name,o.data.name)
    if key not in GARDEN_TREES:GARDEN_TREES[key]=BVHTree.FromPolygons([o.matrix_world@v.co for v in o.data.vertices],[tuple(f.vertices)for f in o.data.polygons])
    p,n,idx,dist=GARDEN_TREES[key].ray_cast(Vector((x,y,start)),Vector((0,0,-1)),100)
    return list(p) if p is not None else None

def inspect_garden():
    assert Path(bpy.data.filepath).name=='angora-rooms-open-doors.blend'
    bpy.context.view_layer.update()
    records=[]
    for o in SC.objects:
        if o.type!='MESH':continue
        lo,hi=bounds(o)
        if not any(c.name in ('garden','context','architecture')for c in o.users_collection):continue
        if hi[0]<-12 or lo[0]>28 or hi[1]<-12 or lo[1]>30:continue
        records.append({'name':o.name,'bounds':[lo,hi],'collections':[c.name for c in o.users_collection],'materials':[m.name if m else None for m in o.data.materials],'vertices':len(o.data.vertices),'faces':len(o.data.polygons),'hidden':[o.hide_render,o.hide_get(),o.hide_viewport]})
    garden_report('inventory-before.json',records)
    terrain=bpy.data.objects['R32 | Continuous local soil volume']
    rows=[]
    for name,x in [('west',-6.42),('east',8.12)]:
        stair=bpy.data.objects['R33 | Continuous side garden stair'+(''if name=='west'else'.001')]
        for y in np.arange(-3.3,8.61,.15):
            rows.append({'side':name,'y':round(float(y),4),'stair':garden_surface(stair,x,float(y)),'terrain':garden_surface(terrain,x,float(y)),'outer_terrain':garden_surface(terrain,x+(-1 if name=='west'else 1),float(y))})
    garden_report('stairs-and-grades-before.json',rows)
    garden_report('garden-scene-settings.json',{'lights':[{'name':o.name,'type':o.data.type,'energy':o.data.energy,'hidden':o.hide_render}for o in SC.objects if o.type=='LIGHT'],'world':SC.world.name if SC.world else None})
    print('GARDEN INSPECTED',len(records),len(rows))

def inspect_garden_details():
    inspect_garden()
    rows=[]
    for suffix in ('','.001'):
        o=bpy.data.objects['R33 | Continuous side garden stair'+suffix];data=[]
        for f in o.data.polygons:
            pts=[o.matrix_world@o.data.vertices[i].co for i in f.vertices]
            if max(p.z for p in pts)-min(p.z for p in pts)<.001 and f.area>.001:
                data.append([min(p.y for p in pts),max(p.y for p in pts),sum(p.z for p in pts)/len(pts)])
        rows.append({'name':o.name,'horizontal_faces':data})
    garden_report('stair-profile-before.json',rows)
    names=('Spruce trunk','Spruce foliage interior','Spruce branches','Spruce needle sprays','Tree trunk','Individual folded leaves','Hedge')
    garden_report('vegetation-before.json',[{'name':o.name,'bounds':bounds(o),'matrix':[list(r)for r in o.matrix_world]}for o in bpy.data.collections['garden'].objects if o.type=='MESH' and o.name.startswith(names)])

GARDEN_CAMERAS={
    'rear-overview':((-.5,27,9),(-.5,6,3.3),28),
    'west-stair':((-6.43,9.4,1.65),(-6.42,-1,2.0),22),
    'east-stair':((8.10,9.0,1.65),(8.12,-1,2.0),22),
    'pool-terrace':((-4.4,9.2,1.65),(.5,16.0,.35),24),
    'front-ground':((-.4,-15,8.2),(1,-3.5,2.5),25),
    'covered-terrace':((4.95,11.95,1.62),(1.4,8.3,1.35),23),
}

def render_garden(ids,suffix='before'):
    old=(SC.camera,SC.render.engine,SC.render.resolution_x,SC.render.resolution_y,SC.render.resolution_percentage,SC.render.filepath,SC.cycles.samples)
    data=bpy.data.cameras.get('Garden photo review')or bpy.data.cameras.new('Garden photo review')
    cam=bpy.data.objects.get('Garden photo review')
    if cam is None:cam=bpy.data.objects.new('Garden photo review',data);SC.collection.objects.link(cam)
    try:
        SC.camera=cam;SC.render.engine='CYCLES';SC.cycles.samples=16;SC.cycles.use_denoising=True
        SC.render.resolution_x=1200;SC.render.resolution_y=900;SC.render.resolution_percentage=100
        data.type='PERSP';data.clip_start=.05;data.clip_end=1000
        for key in ids:
            pos,target,lens=GARDEN_CAMERAS[key];cam.location=pos;cam.rotation_euler=(Vector(target)-cam.location).to_track_quat('-Z','Y').to_euler();data.lens=lens
            bpy.context.view_layer.update();SC.render.filepath=str(GOUT/(key+'-'+suffix+'.png'));bpy.ops.render.render(write_still=True)
            garden_report('render-progress.json',{'last':key,'suffix':suffix})
    finally:
        SC.camera,SC.render.engine,SC.render.resolution_x,SC.render.resolution_y,SC.render.resolution_percentage,SC.render.filepath,SC.cycles.samples=old
    print('GARDEN RENDERED',ids,suffix)

def garden_mesh(name,vs,fs,mat):
    o=make_mesh(name,vs,fs,mat,0)
    bpy.data.collections['garden'].objects.link(o);bpy.data.collections['level-0'].objects.unlink(o)
    o['garden_native_review']=True;o['reference']='kat_1_bahce photos and registered native levels';o['dimension_status']='photo fitted, not surveyed';return o

def garden_box(name,lo,hi,mat,bevel=0):
    o=solid_box(name,lo,hi,mat,0,bevel)
    bpy.data.collections['garden'].objects.link(o);bpy.data.collections['level-0'].objects.unlink(o)
    o['garden_native_review']=True;o['reference']='kat_1_bahce photos and registered native levels';o['dimension_status']='photo fitted, not surveyed';return o

def garden_materials():
    white=finish_material('Garden | Weathered blue white render',(.54,.59,.57),.95)
    stone=finish_material('Garden | Irregular local stone',(.34,.32,.28),.94)
    cap=finish_material('Garden | Limestone coping',(.40,.385,.35),.86)
    for mat in (white,cap):
        nt=mat.node_tree
        if nt.nodes.get('Garden weather grain'):continue
        n=nt.nodes.new('ShaderNodeTexNoise');n.name='Garden weather grain';n.inputs['Scale'].default_value=130;n.inputs['Detail'].default_value=3
        bump=nt.nodes.new('ShaderNodeBump');bump.inputs['Strength'].default_value=.22;bump.inputs['Distance'].default_value=.0014
        nt.links.new(n.outputs['Fac'],bump.inputs['Height']);nt.links.new(bump.outputs['Normal'],nt.nodes['Principled BSDF'].inputs['Normal'])
    if not stone.node_tree.nodes.get('Garden stone pattern'):
        nt=stone.node_tree;uv=nt.nodes.new('ShaderNodeTexCoord');vor=nt.nodes.new('ShaderNodeTexVoronoi');vor.name='Garden stone pattern';vor.feature='DISTANCE_TO_EDGE';vor.inputs['Scale'].default_value=4.3
        nt.links.new(uv.outputs['UV'],vor.inputs['Vector']);r=nt.nodes.new('ShaderNodeValToRGB');r.color_ramp.elements[0].position=.006;r.color_ramp.elements[0].color=(.12,.115,.10,1);r.color_ramp.elements[1].position=.025;r.color_ramp.elements[1].color=(.40,.36,.30,1)
        nt.links.new(vor.outputs['Distance'],r.inputs[0]);nt.links.new(r.outputs['Color'],nt.nodes['Principled BSDF'].inputs['Base Color'])
        bump=nt.nodes.new('ShaderNodeBump');bump.inputs['Strength'].default_value=.5;bump.inputs['Distance'].default_value=.018;nt.links.new(vor.outputs['Distance'],bump.inputs['Height']);nt.links.new(bump.outputs['Normal'],nt.nodes['Principled BSDF'].inputs['Normal'])
    return white,stone,cap

def clear_soil_below_stairs():
    if SC.get('garden_soil_stairs_corrected'):return
    soil=bpy.data.objects['R32 | Continuous local soil volume'];old=soil.data;old.use_fake_user=True;soil.data=old.copy()
    bm=bmesh.new();bm.from_mesh(soil.data);bmesh.ops.remove_doubles(bm,verts=list(bm.verts),dist=.00003);bmesh.ops.recalc_face_normals(bm,faces=list(bm.faces));bm.to_mesh(soil.data);bm.free()
    for x,suffix in [(-6.42,''),(8.12,'.001')]:
        cutter=garden_box('Garden soil clearance construction'+suffix,(x-.563,-3.162,-.382),(x+.563,8.252,4.0),bpy.data.materials['R32 | Soil body'])
        mod=soil.modifiers.new('Keep soil below solid garden stair','BOOLEAN');mod.operation='DIFFERENCE';mod.solver='EXACT';mod.object=cutter
        with bpy.context.temp_override(object=soil,active_object=soil,selected_objects=[soil],selected_editable_objects=[soil]):bpy.ops.object.modifier_apply(modifier=mod.name)
        archive_object(cutter)
    soil['garden_native_review']=True;soil['repair_note']='Soil cut below both native solid stair flights: removes earth above treads without changing exterior grades'
    SC['garden_soil_stairs_corrected']=True;GARDEN_TREES.clear();bpy.context.view_layer.update();bpy.ops.wm.save_mainfile()

def finish_side_terraces():
    if SC.get('garden_side_terraces_finished'):return
    white,stone,cap=garden_materials();archived=[]
    for o in list(bpy.data.collections['garden'].objects):
        if o.name.startswith('Stair flight white cheek'):archived.append(o.name);archive_object(o)
    walls=[]
    for side,x0,x1 in [('west',-9.038,-6.989),('east',8.689,10.518)]:
        for i,(y,lower,upper)in enumerate([(-1.3977,2.06594,2.79992),(2.10,1.03236,2.06594),(5.80,-.09964,1.03236)]):
            mat=white if side=='west' and i>0 else stone
            o=garden_box('Garden '+side+' | Photo terrace riser '+str(i+1),(x0,y-.025,lower-.03),(x1,y+.035,upper+.025),mat,.006);walls.append(o.name)
            o=garden_box('Garden '+side+' | Terrace coping '+str(i+1),(x0-.006,y-.12,upper+.025),(x1+.006,y+.085,upper+.065),cap,.005);walls.append(o.name)
        # Small stone skirting follows the retained stair risers, replacing the oversized cheek walls.
        stair=bpy.data.objects['R33 | Continuous side garden stair'+(''if side=='west'else'.001')]
        records=json.loads((GOUT/'stair-profile-before.json').read_text(encoding='utf-8'))[0]['horizontal_faces']
        runs={}
        for y0,y1,z in records:
            if z<0 or y1-y0<.02:continue
            key=round(z,2);a,b,zz=runs.get(key,(y0,y1,z));runs[key]=(min(a,y0),max(b,y1),max(zz,z))
        wallx=(-5.859,-5.805)if side=='west'else(7.505,7.559)
        for i,(y0,y1,z)in enumerate(sorted(runs.values())):
            garden_box('Garden '+side+' | Stair stone skirting '+str(i), (wallx[0],y0,z-.20),(wallx[1],y1,z+.085),cap,.002)
        # The narrow seam between soil and stair is closed by a visible stone retaining edge.
        outerx=(-7.142,-6.982)if side=='west'else(8.682,8.842)
        for i,(y0,y1,z)in enumerate(sorted(runs.values())):
            garden_box('Garden '+side+' | Stair side stone infill '+str(i),(outerx[0],y0,-.385),(outerx[1],y1,z-.006),stone)
        # Nosing lips use the same limestone as the source photograph, with a restrained 18 mm projection.
        lo,hi=bounds(stair)
        for i,(y0,y1,z)in enumerate(sorted(runs.values())):
            if y1-y0>1.5 or z<.03:continue
            garden_box('Garden '+side+' | Limestone stair nosing '+str(i),(lo[0],y1-.055,z-.035),(hi[0],y1+.012,z-.0007),cap,.002)
    SC['garden_side_terraces_finished']=True;garden_report('side-terrace-finishes.json',{'archived_oversized_cheeks':archived,'terrace_objects':walls,'grades_retained':[2.79992,2.06594,1.03236,-.09964],'note':'Native levels retained; riser render, stone and limestone copings follow photographed west/east treatments.'});bpy.context.view_layer.update();bpy.ops.wm.save_mainfile()

def fit_east_spruce_clearance():
    if SC.get('garden_east_spruce_fit'):return
    changed=[]
    # Photo stair (8): tall hedge to the left, no low conifer across the walking line.
    # Compress the existing crown toward its trunk; preserve the actual tree location.
    anchor=Vector((9.4,7.0,0));scale=Matrix.Diagonal((.31,.83,1,1))
    for prefix in ('Spruce branches','Spruce needle sprays','Spruce foliage interior'):
        o=bpy.data.objects[prefix+'.003'];o.matrix_world=Matrix.Translation(anchor)@scale@Matrix.Translation(-anchor)@o.matrix_world;o['garden_native_review']=True;o['repair_note']='Crown fitted outside the east stair circulation strip';changed.append(o.name)
    # Replace the broad opaque disc-shaped interior foliage by narrower needle masses.
    for o in list(bpy.data.collections['garden'].objects):
        if o.name.startswith('Spruce foliage interior'):
            o.use_fake_user=True;o['garden_disc_foliage_source']=True;archive_object(o)
    SC['garden_east_spruce_fit']=True;garden_report('east-spruce-clearance.json',changed);bpy.context.view_layer.update();bpy.ops.wm.save_mainfile()

def add_side_grasses():
    if SC.get('garden_side_grass_added'):return
    import random
    rng=random.Random(9217);soil=bpy.data.objects['R32 | Continuous local soil volume'];vs=[];fs=[];mids=[]
    for side,x0,x1 in [('west',-8.95,-7.20),('east',8.90,10.43)]:
        for k in range(8500):
            x=rng.uniform(x0,x1);y=rng.uniform(-3.0,7.72)
            if any(abs(y-b)<.14 for b in (-1.3977,2.10,5.80)):continue
            p=garden_surface(soil,x,y)
            if not p or p[2]<-.2 or p[2]>3.4:continue
            h=rng.uniform(.11,.34);a=rng.uniform(0,math.tau);w=rng.uniform(.004,.009);dx,dy=math.cos(a),math.sin(a);bend=rng.uniform(.04,.13);start=len(vs)
            for t,width in ((0,w),(.55,w*.65),(1,0)):
                cx=x+dx*bend*t*t;cy=y+dy*bend*t*t;z=p[2]-.003+h*t
                vs.extend([(cx-dy*width,cy+dx*width,z),(cx+dy*width,cy-dx*width,z)])
            fs.extend([(start,start+1,start+3,start+2),(start+2,start+3,start+4)]);mids.extend([rng.choice([0,0,0,1,1,2])]*2)
    mats=[bpy.data.materials[n]for n in ('R31 | R37 grass deep blade','R31 | R37 grass fresh blade','R31 | R37 grass dry blade')]
    o=garden_mesh('Garden | Photo side terrace grass',vs,fs,mats[0]);o.data.materials.append(mats[1]);o.data.materials.append(mats[2])
    for f,i in zip(o.data.polygons,mids):f.material_index=i
    o['walk_role']='vegetation_nonblocking';o['double_sided_foliage']=True
    SC['garden_side_grass_added']=True;bpy.ops.wm.save_mainfile();print('GARDEN SIDE GRASS',len(fs))

def garden_walk_qa():
    GARDEN_TREES.clear();bpy.context.view_layer.update();soil=bpy.data.objects['R32 | Continuous local soil volume'];rows=[];body=[]
    for side,x,suffix in [('west',-6.42,''),('east',8.12,'.001')]:
        stair=bpy.data.objects['R33 | Continuous side garden stair'+suffix]
        for y in np.arange(-3.10,8.23,.10):
            p=garden_surface(stair,x,float(y));q=garden_surface(soil,x,float(y))
            rows.append({'side':side,'y':float(y),'stair':p,'soil':q,'soil_above_stair':bool(p and q and q[2]>p[2]+.002)})
            if not p:continue
            for height in (.25,.95,1.65):
                for direction in ((1,0,0),(-1,0,0),(0,1,0),(0,-1,0)):
                    hit=ray_info((x,float(y),p[2]+height),direction,.31)
                    if hit:body.append({'side':side,'y':float(y),'height':height,'hit':hit})
    floors=[]
    for y in np.arange(8.5,18.5,.5):
        for x in np.arange(-5.75,6.1,.5):
            if -4.76<x<3.76 and 13.2<y<17.70:continue
            hit=ray_info((float(x),float(y),.35),(0,0,-1),.7)
            floors.append({'x':float(x),'y':float(y),'support':hit})
    geometry=[]
    for o in SC.objects:
        if o.type!='MESH' or not o.get('garden_native_review')or o.get('walk_role')=='vegetation_nonblocking':continue
        bm=bmesh.new();bm.from_mesh(o.data)
        if not o.get('closed_soil_cells'):bmesh.ops.remove_doubles(bm,verts=list(bm.verts),dist=.00001)
        geometry.append({'name':o.name,'nonmanifold_edges':sum(not e.is_manifold for e in bm.edges),'zero_faces':sum(f.calc_area()<1e-10 for f in bm.faces),'hidden':o.hide_render or o.hide_get()});bm.free()
    result={'stair_samples':len(rows),'missing_stair_samples':sum(r['stair']is None for r in rows),'soil_intrusions':sum(r['soil_above_stair']for r in rows),'body_ray_hits':body,'terrace_floor_samples':len(floors),'terrace_missing_floor':[r for r in floors if r['support']is None],'geometry':geometry,'stair_rows':rows,'terrace_floors':floors}
    garden_report('garden-walk-qa.json',result);print('GARDEN QA',len(rows),'soil intrusions',result['soil_intrusions'],'body hits',len(body),'missing terrace floor',len(result['terrace_missing_floor']))

def inspect_patio_details():
    rows=[]
    for o in SC.objects:
        if o.type!='MESH':continue
        lo,hi=bounds(o)
        if lo[0]>.1 and hi[0]<6.6 and lo[1]>7.8 and hi[1]<12.2 and hi[2]<3.6:
            rows.append({'name':o.name,'bounds':[lo,hi],'materials':[m.name for m in o.data.materials if m]})
    garden_report('patio-details-before.json',rows)

def add_patio_photo_details():
    if SC.get('garden_patio_photo_details'):return
    white,stone,cap=garden_materials();timber=finish_material('Garden | Dark stained canopy timber',(.038,.026,.018),.58)
    plaster=finish_material('Garden | White patio ceiling',(.76,.75,.69),.95)
    # The source canopy remains as the weather roof; add its photographed white soffit and real beams.
    garden_box('Garden | Photographed white canopy soffit',(.395,8.15,2.747),(6.20,11.45,2.790),plaster,.002)
    for o in SC.objects:
        if o.name.startswith('Canopy fascia'):
            o.data=o.data.copy();o.data.materials.clear();o.data.materials.append(timber)
    for x in (.35,6.25):
        garden_box('Garden | Canopy deep side beam',(x-.07,8.10,2.63),(x+.07,11.54,2.815),timber,.004)
    garden_box('Garden | Canopy front wood beam',(.28,11.43,2.63),(6.32,11.57,2.815),timber,.004)
    # Table under the small kitchen window: slatted timber top, two trestles and low stretcher.
    wood=finish_material('Garden | Weathered oak table',(.22,.115,.052),.8)
    x0,x1=3.85,5.52;y0,y1=8.58,9.42;z=.0203
    for i in range(22):
        x=x0+i*(x1-x0)/22
        garden_box('Garden | Patio table top slat',(x,y0,z+.735),(x+(x1-x0)/22-.004,y1,z+.77),wood,.002)
    for y in (y0+.055,y1-.055):garden_box('Garden | Patio tabletop edge',(x0-.02,y-.022,z+.704),(x1+.02,y+.022,z+.751),wood,.003)
    for x in (x0+.28,x1-.28):
        garden_box('Garden | Patio table trestle foot',(x-.055,y0-.055,z),(x+.055,y1+.055,z+.07),wood,.006)
        garden_box('Garden | Patio table trestle upright',(x-.043,(y0+y1)/2-.06,z+.07),(x+.043,(y0+y1)/2+.06,z+.725),wood,.004)
        garden_box('Garden | Patio table trestle top',(x-.05,y0+.045,z+.67),(x+.05,y1-.045,z+.725),wood,.004)
    garden_box('Garden | Patio table lower stretcher',(x0+.26,(y0+y1)/2-.035,z+.13),(x1-.26,(y0+y1)/2+.035,z+.21),wood,.003)
    bronze=finish_material('Garden | Patio bronze light trim',(.17,.095,.047),.44,.60)
    opal=finish_material('Garden | Patio opal glass',(.69,.68,.58),.36)
    for x,y in [(3.3,10.1)]:
        for name,prof,mat in [('mount',[(.19,2.726),(.20,2.734),(.20,2.747)],bronze),('opal bowl',[(.03,2.63),(.10,2.647),(.165,2.69),(.19,2.726)],opal)]:
            o=lathe_solid('Garden | Patio ceiling light '+name,(x,y),prof,mat,0);bpy.data.collections['garden'].objects.link(o);bpy.data.collections['level-0'].objects.unlink(o);o['garden_native_review']=True
    SC['garden_patio_photo_details']=True;bpy.context.view_layer.update();bpy.ops.wm.save_mainfile()

def soften_stone_and_fill_conifers():
    if SC.get('garden_fine_conifer_needles'):return
    import random
    stone=bpy.data.materials['Garden | Irregular local stone'];nt=stone.node_tree
    ramp=next(n for n in nt.nodes if n.type=='VALTORGB');ramp.color_ramp.elements[0].color=(.28,.265,.24,1);ramp.color_ramp.elements[1].color=(.37,.335,.28,1)
    needle=finish_material('Garden | Dense cedar dark needles',(.024,.061,.016),.9)
    fresh=finish_material('Garden | Dense cedar fresh tips',(.065,.112,.029),.88)
    rng=random.Random(4821);vs=[];fs=[];mids=[];cluster_count=0
    for o in bpy.data.objects:
        if not o.get('garden_disc_foliage_source'):continue
        # Each preserved foliage island supplies a measured branch cluster envelope.
        bm=bmesh.new();bm.from_mesh(o.data);bmesh.ops.remove_doubles(bm,verts=list(bm.verts),dist=.00004);bm.verts.ensure_lookup_table();bm.verts.index_update();seen=set()
        for v in bm.verts:
            if v.index in seen:continue
            stack=[v];seen.add(v.index);pts=[]
            while stack:
                q=stack.pop();pts.append(o.matrix_world@q.co)
                for e in q.link_edges:
                    w=e.other_vert(q)
                    if w.index not in seen:seen.add(w.index);stack.append(w)
            if len(pts)<4:continue
            lo=Vector(tuple(min(p[i]for p in pts)for i in range(3)));hi=Vector(tuple(max(p[i]for p in pts)for i in range(3)));centre=(lo+hi)/2;ext=(hi-lo)/2
            if max(ext)<.015:continue
            cluster_count+=1
            for k in range(95):
                a=rng.uniform(0,math.tau);rad=math.sqrt(rng.random());p=centre+Vector((math.cos(a)*ext.x*rad,math.sin(a)*ext.y*rad,rng.uniform(-1,1)*max(.04,ext.z)))
                length=rng.uniform(.09,.19);direction=Vector((math.cos(a),math.sin(a),rng.uniform(-.18,.45))).normalized();across=Vector((-direction.y,direction.x,0))*.008
                for twist in (0,1):
                    width=across if not twist else Vector((0,0,.008));start=len(vs);vs.extend([p-width,p+width,p+direction*length]);fs.append((start,start+1,start+2));mids.append(rng.choice([0,0,0,1]))
        bm.free()
    o=garden_mesh('Garden | Fine conifer branch needle masses',vs,fs,needle);o.data.materials.append(fresh)
    for f,i in zip(o.data.polygons,mids):f.material_index=i
    o['walk_role']='vegetation_nonblocking';o['double_sided_foliage']=True
    SC['garden_fine_conifer_needles']=True;garden_report('conifer-needle-detail.json',{'source_branch_clusters':cluster_count,'triangles':len(fs),'note':'Needle cards rebuilt inside preserved source foliage envelopes; broad disc geometry archived'});bpy.ops.wm.save_mainfile()

def inspect_garden_remaining_contacts():
    o=bpy.data.objects['F1 | PENCERE_KAPI$SHUTTER'];bm=bmesh.new();bm.from_mesh(o.data);bmesh.ops.remove_doubles(bm,verts=list(bm.verts),dist=.0001);bm.verts.index_update();seen=set();rows=[]
    for v in bm.verts:
        if v.index in seen:continue
        stack=[v];seen.add(v.index);ps=[]
        while stack:
            q=stack.pop();ps.append(o.matrix_world@q.co)
            for e in q.link_edges:
                w=e.other_vert(q)
                if w.index not in seen:seen.add(w.index);stack.append(w)
        lo=[min(p[i]for p in ps)for i in range(3)];hi=[max(p[i]for p in ps)for i in range(3)]
        if lo[0]<-5.75 and hi[1]>-3.4 and lo[1]<-.4:rows.append({'bounds':[lo,hi],'vertices':len(ps)})
    bm.free();garden_report('west-shutter-contact-parts.json',rows)
    soil=bpy.data.objects['R32 | Continuous local soil volume'];trials=[]
    for dist in (.00003,.0003,.001,.002):
        bm=bmesh.new();bm.from_mesh(soil.data);bmesh.ops.remove_doubles(bm,verts=list(bm.verts),dist=dist);bmesh.ops.dissolve_degenerate(bm,edges=list(bm.edges),dist=.000001)
        trials.append({'merge_distance':dist,'nonmanifold':sum(not e.is_manifold for e in bm.edges),'boundary':sum(e.is_boundary for e in bm.edges),'wire':sum(e.is_wire for e in bm.edges),'faces':len(bm.faces)})
        bm.free()
    garden_report('soil-topology-trials.json',trials)
    garden_report('world-settings.json',{'color':list(SC.world.color),'nodes':[{'name':n.name,'type':n.type,'inputs':{s.name:list(s.default_value)if hasattr(s.default_value,'__len__')else s.default_value for s in n.inputs if hasattr(s,'default_value')and isinstance(s.default_value,(int,float,bpy.types.bpy_prop_array))}}for n in SC.world.node_tree.nodes]})
    print('GARDEN REMAINING CONTACTS INSPECTED')

def fit_west_crown():
    if SC.get('garden_west_spruce_fit'):return
    anchor=Vector((-7.75,-2,0));matrix=Matrix.Translation(anchor)@Matrix.Diagonal((.52,1,1,1))@Matrix.Translation(-anchor)
    for name in ('Spruce branches','Spruce needle sprays'):
        o=bpy.data.objects[name];o.matrix_world=matrix@o.matrix_world;o['garden_native_review']=True
    o=bpy.data.objects['Garden | Fine conifer branch needle masses'];old=o.data;old.use_fake_user=True;o.data=old.copy();inv=o.matrix_world.inverted()
    for v in o.data.vertices:
        p=o.matrix_world@v.co
        if p.x< -5 and p.y<0 and p.z>2.5:v.co=inv@matrix@p
    SC['garden_west_spruce_fit']=True;bpy.context.view_layer.update();bpy.ops.wm.save_mainfile()

def fold_west_stair_shutters():
    if SC.get('garden_stair_shutters_folded'):return
    o=bpy.data.objects['F1 | PENCERE_KAPI$SHUTTER'];old=o.data;old.use_fake_user=True;o.data=old.copy();bm=bmesh.new();bm.from_mesh(o.data);bmesh.ops.remove_doubles(bm,verts=list(bm.verts),dist=.00004);bm.verts.index_update();seen=set();changed=0;inv=o.matrix_world.inverted()
    for v in bm.verts:
        if v.index in seen:continue
        stack=[v];seen.add(v.index);component=[]
        while stack:
            q=stack.pop();component.append(q)
            for e in q.link_edges:
                w=e.other_vert(q)
                if w.index not in seen:seen.add(w.index);stack.append(w)
        ps=[o.matrix_world@q.co for q in component]
        if not(min(p.x for p in ps)<-5.87 and min(p.y for p in ps)>-3.05 and max(p.y for p in ps)<-.60 and min(p.z for p in ps)>4.20):continue
        lower=sum(p.y for p in ps)/len(ps)<-1.8;hinge=Vector((-5.897,-2.435 if lower else -1.220,0));rot=Matrix.Rotation(math.radians(24.5 if lower else -24.5),4,'Z')
        for q,p in zip(component,ps):q.co=inv@(hinge+rot@(p-hinge));changed+=1
    bmesh.ops.recalc_face_normals(bm,faces=list(bm.faces));bm.to_mesh(o.data);bm.free();o['garden_native_review']=True;o['repair_note']='Both west stair window shutters folded back toward facade; glazing remains open'
    SC['garden_stair_shutters_folded']=True;garden_report('west-stair-shutters-folded.json',{'changed_vertices':changed,'additional_fold_degrees':24.5});bpy.context.view_layer.update();bpy.ops.wm.save_mainfile()

def inspect_soil_boundaries():
    o=bpy.data.objects['R32 | Continuous local soil volume'];bm=bmesh.new();bm.from_mesh(o.data);bm.transform(o.matrix_world);bmesh.ops.remove_doubles(bm,verts=list(bm.verts),dist=.004);bmesh.ops.dissolve_degenerate(bm,edges=list(bm.edges),dist=.00001);bm.verts.index_update();seen=set();rows=[]
    for e in bm.edges:
        if not e.is_boundary or e in seen:continue
        stack=[e];seen.add(e);es=[]
        while stack:
            q=stack.pop();es.append(q)
            for v in q.verts:
                for ee in v.link_edges:
                    if ee.is_boundary and ee not in seen:seen.add(ee);stack.append(ee)
        pts=[v.co for q in es for v in q.verts];rows.append({'edges':len(es),'bounds':[[min(p[i]for p in pts)for i in range(3)],[max(p[i]for p in pts)for i in range(3)]],'perimeter':sum(q.calc_length()for q in es)})
    garden_report('soil-boundary-components.json',{'nonmanifold':sum(not e.is_manifold for e in bm.edges),'boundary':sum(e.is_boundary for e in bm.edges),'components':rows});bm.free()

def rebuild_closed_soil_cells():
    if SC.get('garden_soil_closed_cells'):return
    o=bpy.data.objects['R32 | Continuous local soil volume'];old=o.data;old.use_fake_user=True
    old.calc_loop_triangles();vs=[];fs=[];mids=[];cells=0;top_area=0
    for tri in old.loop_triangles:
        ps=[o.matrix_world@old.vertices[i].co for i in tri.vertices];normal=(ps[1]-ps[0]).cross(ps[2]-ps[0])
        if normal.z<.000001 or min(p.z for p in ps)<-5.9:continue
        # Registered upper surface only. Closed cells keep each existing top triangle exactly,
        # avoid unstitched export seams, and never project soil above that visible surface.
        area=normal.z*.5;top_area+=area;start=len(vs);vs.extend([tuple(p)for p in ps]);vs.extend([(p.x,p.y,-6.0)for p in ps])
        fs.extend([(start,start+1,start+2),(start+5,start+4,start+3),(start,start+3,start+4,start+1),(start+1,start+4,start+5,start+2),(start+2,start+5,start+3,start)])
        mids.extend([old.polygons[tri.polygon_index].material_index,2,1,1,1]);cells+=1
    me=bpy.data.meshes.new('Garden soil closed columns from retained registered surface');inv=o.matrix_world.inverted();me.from_pydata([inv@Vector(p)for p in vs],[],fs);me.update()
    for mat in old.materials:me.materials.append(mat)
    for f,mi in zip(me.polygons,mids):f.material_index=mi
    uv=me.uv_layers.new(name='Physical soil surface coordinates')
    for f in me.polygons:
        for li in f.loop_indices:
            p=Vector(vs[me.loops[li].vertex_index]);uv.data[li].uv=(p.x,p.y)if abs(f.normal.z)>.5 else(p.x+p.y,p.z)
    o.data=me;o['closed_soil_cells']=True;o['garden_native_review']=True;o['repair_note']='Closed terrain cells reproduce the retained upper surface exactly; shared buried boundaries are intentional, no top surface added over stairs or rooms'
    for x in (-6.42,8.12):garden_box('Garden | Buried soil below stair',(x-.563,-3.162,-6.0),(x+.563,8.252,-.383),old.materials[2])
    bm=bmesh.new();bm.from_mesh(me);bad=sum(not e.is_manifold for e in bm.edges);bm.free();assert bad==0,bad
    SC['garden_soil_closed_cells']=True;GARDEN_TREES.clear();garden_report('soil-closed-volume.json',{'closed_cells':cells,'retained_projected_top_area_m2':top_area,'faces':len(fs),'nonmanifold_edges':bad,'buried_internal_cell_faces':'Intentional common boundaries below ground; do not weld independent soil columns during glTF export'});bpy.context.view_layer.update();bpy.ops.wm.save_mainfile()

def restore_reversed_soil_surfaces():
    if SC.get('garden_reversed_soil_restored'):return
    o=bpy.data.objects['R32 | Continuous local soil volume'];src=bpy.data.meshes['R39 closed soil with preserved shell connectivity.001'];src.calc_loop_triangles();old=o.data;old.use_fake_user=True
    vs=[tuple(o.matrix_world@v.co)for v in old.vertices];fs=[tuple(f.vertices)for f in old.polygons];mids=[f.material_index for f in old.polygons];count=0;area=0
    for tri in src.loop_triangles:
        ps=[o.matrix_world@src.vertices[i].co for i in tri.vertices];normal=(ps[1]-ps[0]).cross(ps[2]-ps[0]);mi=src.polygons[tri.polygon_index].material_index
        if normal.z>=-.000001 or mi!=0 or min(p.z for p in ps)<-5.9:continue
        ps.reverse();start=len(vs);vs.extend([tuple(p)for p in ps]);vs.extend([(p.x,p.y,-6.0)for p in ps]);fs.extend([(start,start+1,start+2),(start+5,start+4,start+3),(start,start+3,start+4,start+1),(start+1,start+4,start+5,start+2),(start+2,start+5,start+3,start)]);mids.extend([0,2,1,1,1]);count+=1;area-=normal.z/2
    me=bpy.data.meshes.new('Garden soil closed surface with corrected legacy winding');inv=o.matrix_world.inverted();me.from_pydata([inv@Vector(p)for p in vs],[],fs);me.update()
    for mat in old.materials:me.materials.append(mat)
    for f,i in zip(me.polygons,mids):f.material_index=i
    uv=me.uv_layers.new(name='Physical soil coordinates')
    for f in me.polygons:
        for li in f.loop_indices:
            p=vs[me.loops[li].vertex_index];uv.data[li].uv=(p[0],p[1])if abs(f.normal.z)>.5 else(p[0]+p[1],p[2])
    o.data=me;SC['garden_reversed_soil_restored']=True;GARDEN_TREES.clear();garden_report('soil-reversed-surfaces-restored.json',{'retained_source_mesh':src.name,'reoriented_top_triangles':count,'projected_area_m2':area});bpy.context.view_layer.update();bpy.ops.wm.save_mainfile()

def patio_rainwater_and_pool_edge():
    if SC.get('garden_rainwater_pool_detail'):return
    white,stone,cap=garden_materials();timber=bpy.data.materials['Garden | Dark stained canopy timber']
    for name,x in [('Canopy post',.35),('Canopy post.001',6.25)]:
        o=bpy.data.objects[name];archive_object(o);garden_box('Garden | Photo square timber canopy post',(x-.08,11.42,.0203),(x+.08,11.58,2.78),timber,.003)
    pvc=finish_material('Garden | Aged ivory rainwater pipe',(.64,.67,.63),.56)
    for x in (.48,6.12):
        path=[(x,11.59,2.82),(x,11.59,2.60),(x,11.38,2.36),(x,11.38,.14),(x,11.43,.07)]
        vs=[];fs=[];n=12;r=.038
        for i,p in enumerate(path):
            tangent=Vector(path[min(i+1,len(path)-1)])-Vector(path[max(0,i-1)]);tangent.normalize();u=Vector((1,0,0));v=tangent.cross(u).normalized()
            for k in range(n):vs.append(Vector(p)+r*(u*math.cos(k*math.tau/n)+v*math.sin(k*math.tau/n)))
        for i in range(len(path)-1):
            for k in range(n):fs.append((i*n+k,i*n+(k+1)%n,(i+1)*n+(k+1)%n,(i+1)*n+k))
        fs.extend([tuple(range(n-1,-1,-1)),tuple((len(path)-1)*n+k for k in range(n))]);garden_mesh('Garden | Canopy downpipe with offset bends',vs,fs,pvc)
    garden_box('Garden | Canopy ivory gutter front',(.25,11.55,2.80),(6.35,11.66,2.87),pvc,.016)
    # Narrow grooved beige coping, dark blue waterline band and circular fittings visible in photo (9).
    blue=finish_material('Garden | Pool dark blue waterline mosaic',(.018,.044,.081),.29)
    for lo,hi in [((-4.499,13.455,-.10),(3.499,13.464,-.010)),((-4.499,17.426,-.10),(3.499,17.435,-.010)),((-4.499,13.464,-.10),(-4.490,17.426,-.010)),((3.490,13.464,-.10),(3.499,17.426,-.010))]:garden_box('Garden | Pool blue upper tile band',lo,hi,blue)
    grooved=finish_material('Garden | Pool beige grooved coping',(.42,.365,.265),.82)
    nt=grooved.node_tree;tex=nt.nodes.new('ShaderNodeTexWave');tex.wave_type='BANDS';tex.bands_direction='X';tex.inputs['Scale'].default_value=190
    bump=nt.nodes.new('ShaderNodeBump');bump.inputs['Strength'].default_value=.2;bump.inputs['Distance'].default_value=.0007;nt.links.new(tex.outputs['Color'],bump.inputs['Height']);nt.links.new(bump.outputs['Normal'],nt.nodes['Principled BSDF'].inputs['Normal'])
    for o in SC.objects:
        if o.name.startswith('Pool coping'):o.data=o.data.copy();o.data.materials.clear();o.data.materials.append(grooved)
    rim=finish_material('Garden | Pool inlet ivory rim',(.55,.57,.49),.43,.18)
    for x in (-2.5,1.5):
        for z,r in [(-.64,.115),(-.36,.032)]:
            o=lathe_solid('Garden | Pool circular wall fitting',(0,0),[(r*.7,0),(r,.007),(r,.017),(r*.82,.022)],rim,0);bpy.data.collections['garden'].objects.link(o);bpy.data.collections['level-0'].objects.unlink(o);o.matrix_world=Matrix.Translation((x,17.43,z))@Matrix.Rotation(math.pi/2,4,'X');o['garden_native_review']=True
    SC['garden_rainwater_pool_detail']=True;bpy.context.view_layer.update();bpy.ops.wm.save_mainfile()

def finish_patio_recess():
    if SC.get('garden_patio_recess_finished'):return
    edge=ray_info((4.5,7.5,.4),(-1,0,0),2)['point'][0]
    step=ray_info((4.5,6.8,.4),(1,0,0),2)['point'][0]
    mat=bpy.data.objects['R33 | Continuous pool terrace'].data.materials[0]
    for x0,x1,y0 in [(edge,step,6.60176),(step,6.35,7.00242)]:
        garden_box('Garden | Kitchen recess continuous terrace',(x0,y0,-.31),(x1,8.249752,.02031189),mat)
    for o in SC.objects:
        if o.name.startswith('Garden | Patio table'):o.location.y-=1.15
    iron=finish_material('Garden | Black wall lantern metal',(.018,.021,.019),.43,.65)
    glass=finish_material('Garden | Lantern clear glass',(.55,.58,.53),.13)
    glass.node_tree.nodes['Principled BSDF'].inputs['Transmission Weight'].default_value=.93
    bulb=finish_material('Garden | Lantern ivory bulb',(.75,.71,.57),.36)
    def link(o):
        bpy.data.collections['garden'].objects.link(o);bpy.data.collections['level-0'].objects.unlink(o);o['garden_native_review']=True;return o
    for x in (2.9,-.9):
        y=8.2773
        garden_box('Garden | Lantern wall plate',(x-.035,y-.005,2.17),(x+.035,y+.024,2.37),iron,.012)
        link(rod_mesh('Garden | Lantern curved arm base',(x,y+.02,2.2),(x,y+.21,2.18),.014,iron,0))
        link(rod_mesh('Garden | Lantern curved arm rise',(x,y+.21,2.18),(x,y+.28,2.27),.014,iron,0))
        cy=y+.28
        for label,profile,m in [('foot',[(.025,2.235),(.065,2.265),(.087,2.28)],iron),('glass',[(.059,2.28),(.091,2.46)],glass),('roof',[(.11,2.46),(.065,2.52),(.022,2.57)],iron),('finial',[(.018,2.565),(.024,2.59),(.004,2.64)],iron),('bulb',[(.018,2.29),(.027,2.36),(.012,2.39)],bulb)]:link(lathe_solid('Garden | Photo wall lantern '+label,(x,cy),profile,m,0,sides=6 if label in ('glass','roof')else 16))
        for k in range(6):
            a=k*math.tau/6
            link(rod_mesh('Garden | Lantern glazing frame',(x+.061*math.cos(a),cy+.061*math.sin(a),2.278),(x+.094*math.cos(a),cy+.094*math.sin(a),2.465),.005,iron,0,sides=8))
    SC['garden_patio_recess_finished']=True;GARDEN_TREES.clear();bpy.context.view_layer.update()
    garden_report('patio-recess-finished.json',{'native_left_wall_x':edge,'native_wall_step_x':step,'floor_top':.02031189,'table_shift_y':-1.15,'source':'kat_1_bahce photo (3)'})
    bpy.ops.wm.save_mainfile()

def garden_access_qa():
    bpy.context.view_layer.update();rows=[];body=[]
    for name,x,y0,y1 in [('entry',1.08,-9.95,-5.2),('drive',5.2,-9.95,-1.55),('patio',4.7,8.85,12.5)]:
        obj=bpy.data.objects['R33 | Connected coursed entry path' if name=='entry'else 'R33 | Connected garage driveway' if name=='drive'else 'R33 | Continuous pool terrace']
        for y in np.arange(y0,y1,.15):
            p=garden_surface(obj,x,float(y),6 if name!='patio'else 1)
            rows.append({'route':name,'xy':[x,float(y)],'floor':p})
            if not p:continue
            for h in (.3,1,1.65):
                for d in ((1,0,0),(-1,0,0),(0,1,0),(0,-1,0)):
                    hit=ray_info((x,float(y),p[2]+h),d,.3)
                    if hit:body.append({'route':name,'y':float(y),'height':h,'hit':hit})
    recess=[{'xy':[x,y],'support':ray_info((x,y,.1),(0,0,-1),.2)}for x in (3.6,4.5,5.2,5.8,6.2)for y in (7.1,7.5,8.0,8.2)]
    garden_report('garden-access-qa.json',{'route_samples':len(rows),'missing_floor':[r for r in rows if r['floor']is None],'body_hits':body,'recess_floor_samples':recess,'missing_recess_floor':[r for r in recess if r['support']is None]})
    print('GARDEN ACCESS',len(rows),'body hits',len(body),'missing floor',sum(r['floor']is None for r in rows))
