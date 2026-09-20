"""Offline static outdoor visibility, sampled on the delivered terrain.

Run with Blender --background --factory-startup --python this_file.
No source Blender or GLB is modified. Runtime uses one 512px packed map.
"""
import bpy, json, math, time, sys, struct, hashlib
from pathlib import Path
from mathutils import Vector
from mathutils.bvhtree import BVHTree

ROOT=Path(__file__).resolve().parents[2]
DEST=ROOT/'build/web/batched/lighting'
DEST.mkdir(exist_ok=True)
bpy.ops.object.select_all(action='SELECT');bpy.ops.object.delete(use_global=False)
occluders=[];receivers=[]
interior='--interior' in sys.argv
parts=['architecture','interior'] if interior else ['architecture','context-buildings','context-ground','garden']
source_hashes={}
for part in parts:
    raw=(ROOT/'build/web/batched/desktop'/(part+'.glb')).read_bytes()
    source_hashes[part]=hashlib.sha256(raw).hexdigest()
    data=json.loads(raw[20:20+struct.unpack_from('<I',raw,12)[0]])
    transparent_names={m.get('name') for m in data['materials'] if m.get('alphaMode')=='BLEND'}
    before=set(bpy.data.objects)
    bpy.ops.import_scene.gltf(filepath=str(ROOT/'build/web/batched/desktop'/(part+'.glb')))
    for obj in set(bpy.data.objects)-before:
        if obj.type!='MESH':continue
        names=' '.join(m.name for m in obj.data.materials)
        transparent=any(m.diffuse_color[3]<.99 or any(n.type=='BSDF_PRINCIPLED' and n.inputs['Alpha'].default_value<.99 for n in m.node_tree.nodes) for m in obj.data.materials if m.use_nodes)
        if transparent or any(m.name in transparent_names for m in obj.data.materials):continue
        deps=bpy.context.evaluated_depsgraph_get()
        # Importer has applied the glTF -> Blender coordinate conversion.
        mesh=obj.to_mesh();matrix=obj.matrix_world
        verts=[matrix@v.co for v in mesh.vertices];faces=[list(p.vertices) for p in mesh.polygons]
        tree=BVHTree.FromPolygons(verts,faces,all_triangles=True);obj.to_mesh_clear()
        occluders.append(tree)
        if (interior and (part=='architecture' or 'interior-wood-13' in names)) or part=='context-ground' or (part=='garden' and not any(s in names for s in ['metal','wood','glass'])):receivers.append(tree)

size=512;bounds=[-105,-125,110,110]
if interior:bounds=[-15,-18,15,15]
floors=[0,3.0996,6.3714,9.4705]
# NOAA direction for the viewer's default local 12:30, day 172; glTF Y-up.
g=2*math.pi/365*(172-1+(12.5-12)/24)
eq=229.18*(.000075+.001868*math.cos(g)-.032077*math.sin(g)-.014615*math.cos(2*g)-.040849*math.sin(2*g))
dec=.006918-.399912*math.cos(g)+.070257*math.sin(g)-.006758*math.cos(2*g)+.000907*math.sin(2*g)-.002697*math.cos(3*g)+.00148*math.sin(3*g)
ha=(12.5*60+eq+4*32.73-180)/4*math.pi/180-math.pi;lat=39.88*math.pi/180
east=-math.cos(dec)*math.sin(ha);north=math.cos(lat)*math.sin(dec)-math.sin(lat)*math.cos(dec)*math.cos(ha);up=math.sin(lat)*math.sin(dec)+math.cos(lat)*math.cos(dec)*math.cos(ha)
sun=Vector((east,north,up)).normalized()
directions=[(sun+Vector((x,y,0))).normalized() for x,y in [(0,0),(.014,0),(-.014,0),(0,.014),(0,-.014)]]
ambient=[Vector((x,y,1)).normalized() for x,y in [(1,0),(-1,0),(0,1),(0,-1)]]
pixels=[1.0]*(size*size*4);hits=0;start=time.time()
for row in range(size):
    tile_size=256 if interior else size
    z=bounds[1]+((row%tile_size)+.5)/tile_size*(bounds[3]-bounds[1])
    for col in range(size):
        floor=(row//256)*2+col//256 if interior else 0
        x=bounds[0]+((col%tile_size)+.5)/tile_size*(bounds[2]-bounds[0]);origin=Vector((x,-z,floors[floor]+.4 if interior else 100))
        candidates=[t.ray_cast(origin,Vector((0,0,-1)),200) for t in receivers]
        candidates=[r for r in candidates if r[0] is not None]
        if not candidates:continue
        hit=min(candidates,key=lambda r:r[3]);point,normal=hit[:2]
        if interior and abs(point.z-floors[floor])>.35:continue
        if normal.z<.35:continue
        point=point+normal*.065;hits+=1
        visible=sum(not any(t.ray_cast(point,d,180)[0] is not None for t in occluders) for d in directions)/len(directions)
        ao=sum(not any(t.ray_cast(point,d,1.1 if interior else 2.5)[0] is not None for t in occluders) for d in ambient)/len(ambient)
        i=(row*size+col)*4;pixels[i]=visible;pixels[i+1]=ao
    if row%64==0:print('GROUND_LIGHT',row,round(time.time()-start,1),flush=True)
image=bpy.data.images.new('Outdoor visibility',width=size,height=size,alpha=True)
image.colorspace_settings.name='Non-Color';image.pixels.foreach_set(pixels)
stem='floor-light' if interior else 'ground-light'
image.filepath_raw=str(DEST/(stem+'.png'));image.file_format='PNG';image.save()
(DEST/(stem+'.json')).write_text(json.dumps({'size':size,'boundsXZ':bounds,'floorDatums':floors if interior else None,'sunDirection':[east,up,-north],'hour':12.5,'day':172,'channels':{'r':'direct sun visibility','g':'local ambient visibility'},'sourceGeometryHashes':source_hashes,'receiverPixels':hits,'seconds':round(time.time()-start,2),'source':'delivered desktop geometry; horizontal floor receivers' if interior else 'delivered desktop geometry; static outdoor receivers only'},indent=2))
print('GROUND_LIGHT_DONE',hits,round(time.time()-start,1),flush=True)
