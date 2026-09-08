"""Remove an accidental horizontal wall-finish cap across the CAD gallery.

Run on layers/10-architecture.blend. Floor slabs and stair meshes are untouched.
The two opening rectangles follow SOURCE | KAT 2$ZEMİN boundary vertices.
Only the spurious horizontal finish at Z 6.291 m is trimmed, preserving UVs.
"""
import bpy,json
from pathlib import Path
from mathutils import Vector
ROOT=Path(__file__).resolve().parents[1]
RECTS=[(.2184,-.3927,2.9684,.9273),(.8684,.9273,4.1184,3.1273)]

def area(poly):
    return abs(sum(a[0].x*b[0].y-b[0].x*a[0].y for a,b in zip(poly,poly[1:]+poly[:1]))/2) if len(poly)>2 else 0

def split(poly,axis,bound,sign):
    inside=[];outside=[]
    for a,b in zip(poly,poly[1:]+poly[:1]):
        da=(a[0][axis]-bound)*sign;db=(b[0][axis]-bound)*sign
        (inside if da>=0 else outside).append(a)
        if (da>=0)!=(db>=0):
            t=da/(da-db);v=(a[0].lerp(b[0],t),a[1].lerp(b[1],t))
            inside.append(v);outside.append(v)
    return inside,outside

def subtract(poly,rect):
    remainder=poly;result=[]
    for axis,bound,sign in [(0,rect[0],1),(0,rect[2],-1),(1,rect[1],1),(1,rect[3],-1)]:
        if len(remainder)<3:break
        remainder,part=split(remainder,axis,bound,sign)
        if area(part)>1e-10:result.append(part)
    return result

obj=bpy.data.objects['F2 | KAT 2$DUVAR KAPLAMA'];assert obj.library is None
old=obj.data;uv=old.uv_layers.active
vertices=[];faces=[];coords=[];matids=[];smooth=[];removed=0;changed=0
for face in old.polygons:
    poly=[(obj.matrix_world@old.vertices[old.loops[i].vertex_index].co,
           uv.data[i].uv.copy() if uv else Vector((0,0))) for i in face.loop_indices]
    parts=[poly]
    if all(abs(v[0].z-6.291)<.0006 for v in poly):
        for rect in RECTS:parts=[q for p in parts for q in subtract(p,rect)]
        delta=area(poly)-sum(area(p) for p in parts)
        if delta>1e-8:removed+=delta;changed+=1
        else:parts=[poly]
    for p in parts:
        base=len(vertices);vertices.extend([tuple(v[0]) for v in p]);coords.extend([tuple(v[1]) for v in p])
        faces.append(tuple(range(base,base+len(p))));matids.append(face.material_index);smooth.append(face.use_smooth)
new=bpy.data.meshes.new(old.name+' | gallery aperture restored');new.from_pydata(vertices,[],faces);new.update()
for m in old.materials:new.materials.append(m)
layer=new.uv_layers.new(name='UVMap');layer.data.foreach_set('uv',[x for p in coords for x in p])
for p,mat,s in zip(new.polygons,matids,smooth):p.material_index=mat;p.use_smooth=s
obj.data=new;obj.matrix_world.identity()
obj['gallery_finish_repair']='Removed horizontal cap only; source CAD floor/stairs unchanged'
obj['gallery_void_source']='SOURCE | KAT 2$ZEMİN; source-2d-floor-plans.png; kat_3_hol photos'
report={'revision':17,'scope':'horizontal wall-finish cap at 6.291 m only',
 'source_layer':'KAT 2$ZEMİN','opening_rectangles_xy_m':RECTS,'changed_faces':changed,
 'removed_cap_area_m2':removed,'stair_geometry_changed':False,'floor_slabs_changed':False,
 'native_file':'build/blender/layers/10-architecture.blend'}
if changed:
    assert 8<removed<12,removed
    (ROOT/'build/gallery-void-correction.json').write_text(json.dumps(report,indent=2))
    bpy.ops.wm.save_as_mainfile(filepath=bpy.data.filepath,compress=True,relative_remap=False)
else:assert (ROOT/'build/gallery-void-correction.json').exists(),'No repair made and no previous report'
print('GALLERY_VOID_CORRECTION',json.dumps(report),flush=True)
