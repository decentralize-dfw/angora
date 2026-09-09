"""Verify the actual linked R26 repair, not only its proposed parameters."""
import bpy,json,gzip,hashlib
from pathlib import Path
from mathutils import Vector
from mathutils.bvhtree import BVHTree
ROOT=Path(__file__).resolve().parents[1]
architecture=[]
for o in bpy.data.collections['10_ARCHITECTURE'].all_objects:
    if o.type=='MESH' and not o.hide_render:
        architecture.append((o,BVHTree.FromPolygons([o.matrix_world@v.co for v in o.data.vertices],[list(p.vertices) for p in o.data.polygons])))
checks=[]
for x in [1.2,2.,3.]:
    for y in [1.4,2.6]:
        hits=[]
        for o,tree in architecture:
            loc,n,ix,d=tree.ray_cast(Vector((x,y,3.09)),Vector((0,0,-1)),5)
            if loc is not None:hits.append((d,o.name,float(loc.z)))
        assert hits,(x,y,'no surface below stair opening')
        hit=min(hits)
        assert hit[1]!='F1 | KAT 1$ZEMİN',(x,y,hit)
        checks.append({'xy_m':[x,y],'first_visible_surface':hit[1],'z_m':hit[2]})
terrain=next(o for o in bpy.context.scene.objects if o.name.startswith('Terrain'))
assert terrain.get('garden_terrace_revision')==26
tree=BVHTree.FromPolygons([terrain.matrix_world@v.co for v in terrain.data.vertices],[list(p.vertices) for p in terrain.data.polygons])
garden=[]
for x,y,z in [(-8,-5,2.7996),(-8,0,2.0664),(-8,4,1.0332),(-8,10,-.1)]:
    loc,n,ix,d=tree.ray_cast(Vector((x,y,12)),Vector((0,0,-1)),20)
    assert loc is not None and abs(loc.z-z)<.0001,(x,y,loc,z)
    garden.append({'xy_m':[x,y],'z_m':float(loc.z),'expected_z_m':z})
report={'revision':26,'status':'passed','stair_opening_sightlines':checks,'garden_terrace_probes':garden,
 'architecture_sha256':hashlib.sha256((ROOT/'build/blender/layers/10-architecture.blend').read_bytes()).hexdigest(),
 'terrain_sha256':hashlib.sha256((ROOT/'build/blender/layers/50-neighborhood-10.blend').read_bytes()).hexdigest(),
 'limitations':['Geometric checks do not certify survey accuracy or photo matching.']}
(ROOT/'build/r26-native-qa.json').write_text(json.dumps(report,ensure_ascii=False,indent=2))
print('R26_NATIVE_QA',json.dumps(report),flush=True)
