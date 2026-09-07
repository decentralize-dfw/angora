"""Assign exterior paint to exposed CAD wall faces, including gable cladding."""
import bpy,json,math
from pathlib import Path
from mathutils import Vector
from mathutils.bvhtree import BVHTree
from blender_utils import metadata

ROOT=Path(__file__).resolve().parents[1]
def refine_facade(m,cols):
    objects=[o for o in cols['arch'].all_objects if o.type=='MESH' and 'DUVAR' in o.get('source_layer','').upper()]
    vv=[];ff=[]
    for o in objects:
        start=len(vv);vv.extend([o.matrix_world@v.co for v in o.data.vertices])
        ff.extend([tuple(start+i for i in p.vertices) for p in o.data.polygons])
    bvh=BVHTree.FromPolygons(vv,ff,all_triangles=False);counts=[]
    for o in objects:
        index=next((i for i,mat in enumerate(o.data.materials) if mat==m['stucco']),None)
        if index is None:index=len(o.data.materials);o.data.materials.append(m['stucco'])
        changed=0
        for p in o.data.polygons:
            # Test the outward half-space. Interior faces meet another CAD wall
            # skin immediately; exposed gables and recesses have a clear ray.
            n=(o.matrix_world.to_3x3()@p.normal).normalized()
            if abs(n.z)>.5:continue
            c=o.matrix_world@p.center
            visible=False
            for direction in [n,-n]:
                start=c+direction*.003
                hit,_,_,dist=bvh.ray_cast(start,direction,45)
                if hit is None:visible=True;break
            if visible and (c.x<-2.05 or c.x>3.05 or c.y<-3.9 or c.y>7.75):
                if p.material_index!=index:changed+=1
                p.material_index=index
        counts.append({'object':o.name,'painted_faces':changed})
        o['facade_assignment']='exposed_CAD_wall_skins_including_gable_cladding'
    (ROOT/'build/facade-material-report.json').write_text(json.dumps({'method':'CAD wall exposure rays',
        'source_reference':'WhatsApp Image 2026-08-27 at 20.32.54.jpeg',
        'color_status':'photo_interpreted_not_color_calibrated','objects':counts},indent=2))
    print('FACADE_EXPOSED_FACES',sum(c['painted_faces'] for c in counts),flush=True)
