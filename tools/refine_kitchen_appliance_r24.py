"""Photo-guided oven fascia and display-cabinet detail, after R23 wall fit.

Existing native walls, cabinet footprint and movable-furniture layer remain.
Fabrication proportions and appliance controls are interpreted, not surveyed.
"""
import bpy,json,math,hashlib,sys
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1];sys.path.insert(0,str(ROOT/'tools'))
from blender_utils import box,cylinder,paths,metadata
from apply_photo_review_patch import physical_uv
FILE=ROOT/'build/blender/layers/20-fixed-fittings.blend'
assert Path(bpy.data.filepath).resolve()==FILE
before=hashlib.sha256(FILE.read_bytes()).hexdigest()
assert before=='2cd9deedcf00f6ff6bf6267f4b8ab0bc246cbe07fbf17b725f23b417a460e1d5'
root=bpy.data.collections['20_FIXED_FITTINGS'];col=bpy.data.collections['Photo kitchen — entrance']
assert root.get('kitchen_cad_fit_23') and not root.get('kitchen_detail_24')
linked=root.name not in bpy.context.scene.collection.children
if linked:bpy.context.scene.collection.children.link(root)
bpy.context.view_layer.update()
cache=ROOT/'build/intermediate/wall-triangles.json'
(ROOT/'build/intermediate/wall-triangles-before-r24.json').write_bytes(cache.read_bytes())
created=[];changed=[];removed=[]
HOB='kat_2_ust_mutfak/WhatsApp Image 2026-08-26 at 11.53.33 (1).jpeg'
DISPLAY='kat_2_ust_mutfak/WhatsApp Image 2026-08-26 at 11.53.33 (2).jpeg'

def add(label,p,size,material,bevel=.003,grain=None):
    o=box('Kitchen R24 | '+label,p,size,bpy.data.materials[material],col,bevel)
    if grain is not None:o['grain_long_axis_local']='XYZ'[grain]
    created.append(o);return o

# The black glass door stops at 3.8296 m. The missing control strip belongs
# between that glass and the existing worktop underside at 3.9721 m.
add('oven control fascia',(-3.33,-.5525,3.9001),(.566,.030,.133),'metal',.004)
add('oven display',(-3.33,-.570,3.9001),(.134,.004,.049),'black',.003)
for x in [-3.514,-3.146]:
    o=cylinder('Kitchen R24 | oven selector',(x,-.570,3.9001),(x,-.589,3.9001),.021,bpy.data.materials['black'],col,40)
    for face in o.data.polygons:
        if len(face.vertices)==4:face.use_smooth=True
    created.append(o)
    add('oven selector index',(x,-.590,3.913),(.0025,.002,.008),'chrome',.0005)
# Close the narrow installation seam below the fascia, retaining a visible
# joint and the existing oven glass and handle. No control brand is invented.
add('oven fascia lower reveal',(-3.33,-.549,3.8311),(.556,.020,.005),'black',.001)

def door_interval(name,low,high):
    o=bpy.data.objects[name];o.data=o.data.copy()
    a=min(v.co.z for v in o.data.vertices);b=max(v.co.z for v in o.data.vertices)
    for v in o.data.vertices:v.co.z=(v.co.z-(a+b)/2)*(high-low)/(b-a)
    o.location.z=(low+high)/2;changed.append(name)
    o['review_revision']='24-kitchen-appliance-and-display';o['photo_match_approved']=False
    return o

# The photograph has an upper pantry door, a short drawer and a lower door.
# Align that division with the adjacent high counter instead of leaving a
# 45 mm black void between two generic slabs.
door_interval('Kitchen review 15 | vitrine pantry door',3.2246,4.456)
door_interval('Kitchen review 15 | vitrine pantry door.001',4.563,5.5396)
cy=(-2.3484-2.0092)/2;width=2.3484-2.0092
add('pantry drawer front',(.644,cy,4.5095),(.030,width,.091),'wood_honey',.003,1)
for low,high in [(3.2246,4.456),(4.563,5.5396)]:
    for y in [-2.3484+.018,-2.0092-.018]:
        add('pantry door stile',(.623,y,(low+high)/2),(.028,.036,high-low),'wood_honey',.002,2)
    for z in [low+.026,high-.026]:
        add('pantry door rail',(.623,cy,z),(.028,width-.072,.052),'wood_honey',.002,1)
old=bpy.data.objects['Kitchen review 15 | vitrine pantry handle'];removed.append(old.name);bpy.data.objects.remove(old,do_unlink=True)
upper=bpy.data.objects['Kitchen review 15 | vitrine pantry handle.001'];upper.location.z-=.52;changed.append(upper.name)
points=[]
for i in range(25):
    t=i/24;points.append((.617-.014*math.sin(math.pi*t),cy+(t-.5)*.15,4.5095))
o=paths('Kitchen R24 | pantry drawer pull',[points],.0065,bpy.data.materials['chrome'],col)
o.data.bevel_resolution=3;created.append(o)

# Painted back panels are visible in the photographed open middle bays.
# Each 2 mm facing sits in front of the structural cabinet back, away from
# the native wall, and behind the side uprights and counters.
for label,y0,y1,z0,z1 in [
    ('painted central display back',-3.3151,-2.3899,4.5576,5.0246),
    ('painted side display back',-3.9370,-3.3509,3.9921,5.0246)]:
    add(label,(.958,(y0+y1)/2,(z0+z1)/2),(.002,y1-y0,z1-z0),'interior',0)

for o in created:
    metadata(o,'photo_plan_interpreted',HOB if 'oven ' in o.name else DISPLAY,
             floor_index=1,review_revision='24-kitchen-appliance-and-display',photo_match_approved=False)
    if o.type!='MESH':continue
    physical_uv(o)
    if o.get('grain_long_axis_local'):
        axis='XYZ'.index(o['grain_long_axis_local']);uv=o.data.uv_layers.active
        phase=int(hashlib.sha1(o.name.encode()).hexdigest()[:8],16)/2**32
        for face in o.data.polygons:
            normal=max(range(3),key=lambda i:abs(face.normal[i]));axes=[i for i in range(3) if i!=normal]
            along=axis if axis in axes else axes[0];across=next(i for i in axes if i!=along)
            for li in face.loop_indices:
                p=o.data.vertices[o.data.loops[li].vertex_index].co
                uv.data[li].uv=(p[along]+phase,p[across]/.8+phase*.73)
        o['preserve_authored_uv']=True
    for modifier in o.modifiers:
        if modifier.type=='BEVEL':modifier.segments=3
root['kitchen_detail_24']=True;bpy.context.view_layer.update()
if linked:root.use_fake_user=True;bpy.context.scene.collection.children.unlink(root)
bpy.ops.wm.save_as_mainfile(filepath=str(FILE),compress=True,relative_remap=False)
report={'revision':24,'source_fittings_sha256_before':before,'source_fittings_sha256_after':hashlib.sha256(FILE.read_bytes()).hexdigest(),
        'source_photos':[{'file':p,'sha256':hashlib.sha256((ROOT/p).read_bytes()).hexdigest()} for p in [HOB,DISPLAY]],
        'new_parts':[o.name for o in created],'changed_panels':changed,'removed_parts':removed,
        'native_CAD_modified':False,'movable_furniture_modified':False,'photo_match_approved':False,
        'fabrication_dimensions_verified':False,'appliance_brand_or_model_identified':False}
(ROOT/'build/kitchen-photo-r24.json').write_text(json.dumps(report,ensure_ascii=False,indent=2))
print('KITCHEN_R24',len(created),len(changed),len(removed),report['source_fittings_sha256_after'],flush=True)
