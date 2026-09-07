"""Roof tiles, photographed garage panels, entry paving and garden vegetation."""
import bpy,math,random,collections
from mathutils import Vector,Matrix
from mathutils.bvhtree import BVHTree
from blender_utils import *
from blender_materials import material

REF='WhatsApp Image 2026-08-27 at 20.32.54.jpeg'

def roof_details(m,parent,objects=None,label='Roof tiles — source roof projection',status='cad_roof_photo_profile'):
    col=collection(label,parent)
    vv=[];ff=[]
    if objects is None:objects=[o for o in bpy.data.collections['10_ARCHITECTURE'].all_objects if o.get('source_layer')=='ÇATII' and o.type=='MESH']
    for obj in objects:
        start=len(vv);vv.extend([obj.matrix_world@v.co for v in obj.data.vertices])
        ff.extend([tuple(start+i for i in p.vertices) for p in obj.data.polygons])
    bvh=BVHTree.FromPolygons(vv,ff,all_triangles=False)
    top=max(p.z for p in vv)+1;x0=min(p.x for p in vv);x1=max(p.x for p in vv)
    y0=min(p.y for p in vv);y1=max(p.y for p in vv)
    if not ff:return
    colors=['B6602E','B96330','BB6634','BC6936','AD5D2D','B86734','B36130']
    mats=[bpy.data.materials.get('Clay tile '+str(i)) or material('Clay tile '+str(i),color,.71,0) for i,color in enumerate(colors)]
    positions=[];rotations=[];indices=[];rng=random.Random(109);tiles=0
    for axis in [0,1]:
        sx,sy=(.287,.205) if axis==0 else (.205,.287)
        for ix in range(math.ceil((x1-x0)/sx)):
            for iy in range(math.ceil((y1-y0)/sy)):
                x=x0+(ix+.5)*sx;y=y0+(iy+.5)*sy
                hit,n,_,_=bvh.ray_cast(Vector((x,y,top)),Vector((0,0,-1)))
                if hit is None or not .6<abs(n.z)<.96:continue
                if (0 if abs(n.x)>abs(n.y) else 1)!=axis:continue
                if n.z<0:n=-n
                u=Vector((0,1,0)) if axis==0 else Vector((1,0,0))
                down=n.cross(u).normalized()
                if down.z>0:down=-down;u=-u
                valid=True
                for a,b in [(-.103,-.176),(.103,-.176),(.103,.176),(-.103,.176)]:
                    p=hit+u*a+down*b;q,nn,_,_=bvh.ray_cast(Vector((p.x,p.y,top)),Vector((0,0,-1)))
                    if q is None or abs(q.z-p.z)>.065:valid=False;break
                if not valid:continue
                tiles+=1;positions.append(tuple(hit));indices.append(rng.randrange(len(mats)))
                rotations.append(tuple(Matrix((u,down,n)).transposed().to_euler()))
    prototype=bpy.data.objects.get('SOURCE | Reusable clay tile profile')
    if prototype is None:
        verts=[];faces=[]
        for j in range(3):
            t=j/2
            for i in range(9):
                s=i/8;h=.010+.052*(.5+.5*math.cos(s*math.tau))+.009*(1-t)
                verts.append(((s-.5)*.211,(t-.5)*.354,h))
        for j in range(2):
            for i in range(8):a=j*9+i;faces.append((a,a+1,a+10,a+9))
        prototype=mesh('SOURCE | Reusable clay tile profile',verts,faces,mats[0],bpy.data.collections['00_SOURCE_REFERENCE'])
        for mat in mats[1:]:prototype.data.materials.append(mat)
        for p in prototype.data.polygons:p.use_smooth=True
    o=mesh('Projected clay tile shells',positions,[],None,col)
    attr=o.data.attributes.new('tile_rotation','FLOAT_VECTOR','POINT')
    attr.data.foreach_set('vector',[v for row in rotations for v in row])
    attr=o.data.attributes.new('tile_material','INT','POINT');attr.data.foreach_set('value',indices)
    group=bpy.data.node_groups.new(label,'GeometryNodeTree')
    group.interface.new_socket(name='Geometry',in_out='INPUT',socket_type='NodeSocketGeometry')
    group.interface.new_socket(name='Geometry',in_out='OUTPUT',socket_type='NodeSocketGeometry')
    nodes=group.nodes;links=group.links
    inp=nodes.new('NodeGroupInput');out=nodes.new('NodeGroupOutput')
    info=nodes.new('GeometryNodeObjectInfo');info.inputs['Object'].default_value=prototype;info.inputs['As Instance'].default_value=True
    rotation=nodes.new('GeometryNodeInputNamedAttribute');rotation.data_type='FLOAT_VECTOR';rotation.inputs['Name'].default_value='tile_rotation'
    index=nodes.new('GeometryNodeInputNamedAttribute');index.data_type='INT';index.inputs['Name'].default_value='tile_material'
    instances=nodes.new('GeometryNodeInstanceOnPoints');realize=nodes.new('GeometryNodeRealizeInstances');set_index=nodes.new('GeometryNodeSetMaterialIndex')
    links.new(inp.outputs['Geometry'],instances.inputs['Points']);links.new(info.outputs['Geometry'],instances.inputs['Instance'])
    links.new(rotation.outputs['Attribute'],instances.inputs['Rotation']);links.new(instances.outputs['Instances'],realize.inputs['Geometry'])
    links.new(realize.outputs['Geometry'],set_index.inputs['Geometry']);links.new(index.outputs['Attribute'],set_index.inputs['Material Index'])
    links.new(set_index.outputs['Geometry'],out.inputs['Geometry'])
    o.modifiers.new('Repeated tile profile','NODES').node_group=group
    metadata(o,status,REF,tile_profile_status='photo_interpreted',tile_count=tiles,dimension_label_allowed=False)
    print('DETAIL_ROOF_TILES',tiles,flush=True)

def leaf_cloud(name,centers,m,col,seed=18):
    rng=random.Random(seed);vv=[];ff=[];mi=[]
    for center,radii,count in centers:
        center=Vector(center)
        for i in range(count):
            n=Vector((rng.gauss(0,1),rng.gauss(0,1),rng.gauss(0,1))).normalized()
            rr=rng.uniform(.76,1.04);p=center+Vector((n.x*radii[0],n.y*radii[1],n.z*radii[2]))*rr
            u=n.cross(Vector((0,0,1)))
            if u.length<.01:u=n.cross(Vector((0,1,0)))
            u.normalize();v=n.cross(u).normalized();length=rng.uniform(.12,.22);width=length*rng.uniform(.38,.58)
            a=len(vv);vv.extend([tuple(p-v*length/2),tuple(p+u*width/2+n*.008),tuple(p+v*length/2),tuple(p-u*width/2+n*.008)])
            ff.extend([(a,a+1,a+2),(a,a+2,a+3)]);idx=rng.choices([0,1,2],[.55,.35,.1])[0];mi.extend([idx,idx])
    o=mesh(name,vv,ff,m['hedge'],col)
    o.data.materials.append(m['foliage_light']);o.data.materials.append(m['leaf_yellow'])
    for p,idx in zip(o.data.polygons,mi):p.material_index=idx
    metadata(o,'photo_interpreted_planting',REF,plant_species='unverified',dimension_label_allowed=False)
    return o

def foliage_core(name,centers,m,col,seed=200,lobes=4):
    # Occluding inner foliage, with separate fine leaves around the silhouette.
    import bmesh
    bm=bmesh.new();bmesh.ops.create_icosphere(bm,subdivisions=2,radius=1);bm.verts.ensure_lookup_table()
    for i,v in enumerate(bm.verts):v.index=i
    template=[v.co.copy() for v in bm.verts];polys=[tuple(v.index for v in p.verts) for p in bm.faces];bm.free()
    rng=random.Random(seed);vv=[];ff=[];indices=[]
    for center,radii in centers:
        center=Vector(center)
        for part in range(lobes):
            shift=Vector((rng.uniform(-.20,.20)*radii[0],rng.uniform(-.20,.20)*radii[1],rng.uniform(-.16,.16)*radii[2]))
            start=len(vv)
            for p in template:
                r=rng.uniform(.84,1.09)
                vv.append(tuple(center+shift+Vector((p.x*radii[0]*.74,p.y*radii[1]*.74,p.z*radii[2]*.74))*r))
            ff.extend([tuple(start+i for i in face) for face in polys]);indices.extend([rng.randrange(2)]*len(polys))
    o=mesh(name,vv,ff,m['needle_dark'],col);o.data.materials.append(m['hedge'])
    for p,idx in zip(o.data.polygons,indices):p.material_index=idx;p.use_smooth=True
    metadata(o,'photo_interpreted_vegetation_volume',REF,dimension_label_allowed=False)

def spruce(base,height,m,col,seed):
    rng=random.Random(seed);base=Vector(base)
    cylinder('Spruce trunk',base,base+Vector((0,0,height*.94)),.095,m['bark'],col,16)
    verts=[];faces=[];indices=[];branches=[];cores=[]
    for level in range(18):
        frac=.12+.049*level;z=height*frac;radius=height*.30*(1-frac)**.78
        for branch in range(7):
            a=math.tau*branch/7+level*1.13+rng.uniform(-.16,.16)
            direction=Vector((math.cos(a),math.sin(a),0));side=Vector((-math.sin(a),math.cos(a),0))
            length=radius*rng.uniform(.8,1.14);start=base+Vector((0,0,z))
            end=start+direction*length+Vector((0,0,-height*.065*(1-frac)))
            branches.append([start,(start+end)/2+Vector((0,0,-.10)),end+Vector((0,0,.10))])
            for t in [.43,.73]:
                cores.append((tuple(start.lerp(end,t)),(.17+radius*.045,.17+radius*.045,.08+radius*.015)))
            for twig in range(19):
                t=(twig+1)/20;center=start.lerp(end,t)+side*rng.uniform(-.21,.21)*length
                axis=(direction+side*rng.uniform(-1.4,1.4)+Vector((0,0,.35))).normalized()
                across=axis.cross(Vector((0,0,1))).normalized()
                for k in range(15):
                    p=center+axis*((k/14-.5)*.45);reach=.080*math.sin(math.pi*(k+1)/16)+.018
                    for sign in [-1,1]:
                        tip=p+across*reach*sign+axis*.045+Vector((0,0,.011));a0=len(verts)
                        verts.extend([tuple(p-axis*.008),tuple(tip),tuple(p+axis*.008)])
                        faces.append((a0,a0+1,a0+2));indices.append(0 if rng.random()<.68 else 1)
    paths('Spruce branches',branches,.010,m['bark'],col)
    foliage_core('Spruce foliage interior',cores,m,col,seed+900,lobes=1)
    o=mesh('Spruce needle sprays',verts,faces,m['needle_dark'],col);o.data.materials.append(m['needle_light'])
    for p,idx in zip(o.data.polygons,indices):p.material_index=idx
    metadata(o,'photo_interpreted_vegetation',REF,plant_species='spruce_like_unverified',dimension_label_allowed=False)

def grass_patches(patches,m,col):
    rng=random.Random(456);vv=[];ff=[];mi=[]
    for x0,y0,x1,y1,z,density in patches:
        for i in range(round((x1-x0)*(y1-y0)*density)):
            p=Vector((rng.uniform(x0,x1),rng.uniform(y0,y1),z));a=rng.random()*math.tau
            u=Vector((math.cos(a),math.sin(a),0));h=rng.uniform(.07,.23);w=rng.uniform(.004,.009);bend=u*rng.uniform(.02,.065)
            start=len(vv)
            vv.extend([tuple(p-u*w),tuple(p+u*w),tuple(p+bend*.4+Vector((0,0,h*.6))-u*w*.6),tuple(p+bend*.4+Vector((0,0,h*.6))+u*w*.6),tuple(p+bend+Vector((0,0,h)))])
            ff.extend([(start,start+1,start+3,start+2),(start+2,start+3,start+4)]);mi.extend([rng.randrange(3)]*2)
    o=mesh('Garden grass blades',vv,ff,m['grass'],col)
    o.data.materials.append(m['foliage_light']);o.data.materials.append(m['leaf_yellow'])
    for p,idx in zip(o.data.polygons,mi):p.material_index=idx
    metadata(o,'photo_interpreted_planting','kat_1_bahce',dimension_label_allowed=False)

def refine_exterior(m,cols):
    ext=collection('Photo exterior details',cols['ext']);land=collection('Photo planting details',cols['land'])
    roof_details(m,ext)
    # The reference garage is a sectional panel door, not a roll-up shutter.
    for o in list(cols['ext'].all_objects):
        if o.name.startswith(('Garage roller slat','Chimney cap support','Chimney crown')):bpy.data.objects.remove(o,do_unlink=True)
    for row in range(5):
        z=3.10+(row+.5)*.483
        o=box('Garage sectional panel',(5.675,-1.44,z),(3.0,.065,.474),m['white_trim'],ext,.008)
        metadata(o,'photo_interpreted',REF)
        for i in range(4):
            x=4.55+i*.75
            box('Garage panel recess',(x,-1.477,z),(.63,.009,.30),m['interior'],ext,.018)
            for zz in [z-.153,z+.153]:box('Garage panel moulding',(x,-1.484,zz),(.65,.015,.018),m['white_trim'],ext,.004)
    # Ceiling tracks and motor are visible in the garage interior photographs.
    for x in [4.14,7.22]:
        paths('Garage door track',[[(x,-1.25,3.18),(x,-1.25,5.40),(x,-1.1,5.62),(x,1.45,5.62)]],.022,m['chrome'],ext)
    box('Garage door opener',(5.68,1.0,5.62),(.29,.43,.15),m['white_trim'],ext,.035)
    paths('Garage opener rail',[[(5.68,-1.15,5.67),(5.68,1.0,5.67)]],.018,m['metal'],ext)
    for x in [3.28,3.86]:
        for y in [5.12,5.98]:box('Chimney crown pier',(x,y,13.77),(.105,.105,.38),m['white_trim'],ext,.006)
    box('Chimney crown lintel',(3.57,5.55,13.985),(.80,1.2,.08),m['white_trim'],ext,.009)
    roof=mesh('Hipped chimney cap',[(3.07,4.84,14.03),(4.07,4.84,14.03),(4.07,6.26,14.03),(3.07,6.26,14.03),(3.57,5.55,14.42)],[(0,1,4),(1,2,4),(2,3,4),(3,0,4)],m['gravel'],ext)
    metadata(roof,'photo_interpreted',REF)
    box('Garage flat roof gravel',(5.45,2.54,5.99),(3.25,7.18,.035),m['gravel'],ext)
    # Front path and planted ground follow the photographed approach.
    for center,size in [((-3.65,-8.15,2.81),(8.15,5.3,.028)),((3.1,-10.65,2.81),(1.0,3.1,.028))]:box('Front lawn',center,size,m['grass'],land)
    box('Entrance path',(1.28,-9.65,2.835),(1.38,9.0,.055),m['stone_tile'],land,.007)
    # Replace polygonal shrub proxies with actual leaves and branch silhouettes.
    centers=[]
    for o in list(cols['land'].all_objects):
        if o.name.startswith(('Hedge','Rear hedge')):
            centers.append((tuple(o.location),tuple(o.scale),500));bpy.data.objects.remove(o,do_unlink=True)
        elif o.name.startswith(('Evergreen crown','Conifer trunk')):bpy.data.objects.remove(o,do_unlink=True)
    for x in [-7,-5.5,-4,-2.5,-1]:centers.append(((x,-10.45,3.46),(.95,.75,.64),650))
    leaf_cloud('Individual hedge leaves',centers,m,land)
    foliage_core('Hedge foliage interior',[(center,radii) for center,radii,count in centers],m,land)
    for i,(x,y,h) in enumerate([(-9,3,7),(-9,12,6),(-9,20,7),(9,8,6),(9,18,7),(5,22,5),(-4,22,6)]):spruce((x,y,0),h,m,land,100+i)
    grass_patches([(-7.7,-10.75,.30,-5.60,2.83,160),(-9.0,11,-7.0,21,.02,130),(7.0,11,9.0,21,.02,130),(-6.5,20.6,5.5,22.8,.02,120)],m,land)
    # Context detail uses the registered footprint, with unverified facades kept tagged.
    near_roofs=[];context=collection('Near-neighbor finish details',cols['neighbors'])
    for o in list(cols['neighbors'].all_objects):
        if o.type!='MESH':continue
        if o.name.startswith('Neighbor roof'):
            center=sum((v.co for v in o.data.vertices),Vector())/len(o.data.vertices)
            if math.hypot(center.x,center.y)<48:near_roofs.append(o)
        if o.name.startswith('Neighbor window') and math.hypot(o.location.x,o.location.y)<55:
            a=o.rotation_euler.z;u=Vector((math.cos(a),math.sin(a),0))
            for offset in [-.607,.607]:box('Context window jamb',o.location+u*offset,(.065,.075,1.43),m['white_trim'],context,.005,a)
            for z in [-.69,.69]:box('Context window lintel',o.location+Vector((0,0,z)),(1.28,.075,.065),m['white_trim'],context,.005,a)
    if near_roofs:roof_details(m,context,near_roofs,'Near-neighbor roof tile detail','inferred_neighbor_roof_photo_profile')
    for o in context.all_objects:
        if 'source_reference' not in o:metadata(o,'inferred_neighbor_facade',REF)
    for o in ext.all_objects:
        if 'source_reference' not in o:metadata(o,'photo_interpreted',REF)
    for o in land.all_objects:
        if 'source_reference' not in o:metadata(o,'photo_interpreted',REF)
