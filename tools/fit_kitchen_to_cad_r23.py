"""Fit the photo-interpreted cabinetry to the unchanged native wall returns.

Run after refine_kitchen_joinery_r23.py. Adjust whole cabinet assemblies,
not the source architecture. Recess rear corners where a wall return crosses
the existing worktop. The subsequent evaluated-section QA covers every
visible entrance-kitchen part and all movable furniture.
"""
import bpy, bmesh, json, hashlib, sys
from pathlib import Path
from mathutils import Matrix, Vector

ROOT=Path(__file__).resolve().parents[1]
sys.path.insert(0,str(ROOT/'tools'))
from blender_utils import box

FILE=ROOT/'build/blender/layers/20-fixed-fittings.blend'
assert Path(bpy.data.filepath).resolve()==FILE
root=bpy.data.collections['20_FIXED_FITTINGS']
col=bpy.data.collections['Photo kitchen — entrance']
assert root.get('kitchen_photo_revision_23') and not root.get('kitchen_cad_fit_23')
before=hashlib.sha256(FILE.read_bytes()).hexdigest()
previous=json.loads((ROOT/'build/kitchen-photo-r23.json').read_text())
assert before==previous['source_fittings_sha256_after'],'R23 photo-joinery output changed before fitting'
backup=ROOT/'build/intermediate/fixed-fittings-before-r23-fit.blend'
backup.write_bytes(FILE.read_bytes())
wall_cache=ROOT/'build/intermediate/wall-triangles.json'
(ROOT/'build/intermediate/wall-triangles-before-r23-fit.json').write_bytes(wall_cache.read_bytes())
linked=root.name not in bpy.context.scene.collection.children
if linked:bpy.context.scene.collection.children.link(root)
bpy.context.view_layer.update()
changes=[]

def edit(o,reason):
    o['cad_clearance_review']='23-kitchen-wall-returns'
    o['cad_fit_reason']=reason
    o['photo_match_approved']=False
    o['dimension_label_allowed']=False
    changes.append({'object':o.name,'reason':reason})

def affine(objects,axis,scale,offset,reason):
    transform=Matrix.Identity(4);transform[axis][axis]=scale
    transform[axis][3]=offset
    for o in objects:
        o.matrix_world=transform@o.matrix_world
        edit(o,reason)
    bpy.context.view_layer.update()

def resize_local(o,axis,width,reason):
    o.data=o.data.copy()
    a=min(v.co[axis] for v in o.data.vertices);b=max(v.co[axis] for v in o.data.vertices)
    for v in o.data.vertices:v.co[axis]=(v.co[axis]-(a+b)/2)*width/(b-a)+(a+b)/2
    edit(o,reason)

def center(o,axis):
    values=[(o.matrix_world@Vector(p))[axis] for p in o.bound_box]
    return (min(values)+max(values))/2

# Rail/stile faces must meet at a seam, rather than overlap on the same plane.
# The panes overlap BEHIND the frames, so no daylight gaps remain at the rails.
for o in list(col.objects):
    if 'Kitchen R23 | sink glazed rail' in o.name:
        resize_local(o,0,.128,'Remove coplanar rail/stile overlap')
        resize_local(o,2,.052,'Close glazed-frame corner')
        o.location.z=5.0696+(.363 if o.location.z>5.0696 else -.363)
    elif 'Kitchen R23 | sink satin inset' in o.name:
        resize_local(o,0,.132,'Seat satin pane behind the timber rebate')
        resize_local(o,2,.690,'Seat satin pane behind the timber rebate')
    elif o.name.startswith('Upper cupboard door rail'):
        resize_local(o,0,.454,'Hob door rail meets the inner stile edges')
    elif o.name.startswith('Upper cupboard inset'):
        o.location.y+=.012;edit(o,'Recess solid timber insert behind the face frame')
    elif 'vitrine glazed stile' in o.name:
        resize_local(o,2,1.224,'Vitrine stile meets the full-width rails without coplanar faces')
        o.location.z=(3.2466+4.4726)/2
    elif 'vitrine bridge stile' in o.name:
        resize_local(o,2,.386,'Vitrine upper stile meets the full-width rails')
        o.location.z=(5.0756+5.4636)/2
bpy.context.view_layer.update()

# The left sink cupboard's rear and crown previously entered the SW return.
# Keep the edge beside the window fixed and fit the complete assembly inside
# the source return at Y=-3.123 m, with an 18 mm end clearance.
left=[o for o in col.objects if o.name.startswith('Kitchen R23 | ')
      and any(t in o.name for t in ['sink upper','sink satin','sink glazed','open bay','sink concealed'])
      and center(o,1)<-2.4]
assert len(left)==28,len(left)
scale=(-2.51-(-3.105))/(-2.51-(-3.19))
affine(left,1,scale,-2.51*(1-scale),'Fit complete left sink cupboard beside native SW wall return')

# Re-space the two solid upper doors between the source corner column and
# the existing extractor canopy. Neither the column nor the hood is moved.
upper=[o for o in col.objects if not o.hide_render and (o.name.startswith('Upper cupboard')
       or 'cupboard moulding' in o.name or 'glazing bead' in o.name)]
groups={c:[] for c in [-4.87,-4.31,-2.63]}
for o in upper:
    groups[min(groups,key=lambda c:abs(center(o,0)-c))].append(o)
for old,new in [(-4.87,-4.4925),(-4.31,-3.9495)]:
    group=groups[old]
    assert len(group)==20,(old,len(group))
    scale=.539/.590
    affine(group,0,scale,new-old*scale,'Fit complete hob upper cupboard between CAD column and extractor')

# The independent display cabinet must stay on the kitchen side of the
# source cross-wall at Y=-1.923 m. Fit its full width within the recess.
vitrine=[o for o in col.objects if 'vitrine' in o.name.lower()]
scale=(-1.948-(-4.002))/(-1.56-(-3.74))
affine(vitrine,1,scale,-4.002-(-3.74)*scale,'Fit full display cabinet within source kitchen recess')
affine(vitrine,0,1,-.032,'Keep display crown clear of the native back wall')

def notch(name,low,high):
    o=bpy.data.objects[name]
    cutter=box('R23 temporary wall-return cutter',[(a+b)/2 for a,b in zip(low,high)],
               [b-a for a,b in zip(low,high)],o.data.materials[0],col,0)
    bpy.context.view_layer.update()
    modifier=o.modifiers.new('Native wall return clearance','BOOLEAN')
    modifier.operation='DIFFERENCE';modifier.solver='EXACT';modifier.object=cutter
    o.modifiers.move(len(o.modifiers)-1,0)
    bpy.context.view_layer.objects.active=o
    bpy.ops.object.modifier_apply(modifier=modifier.name)
    bpy.data.objects.remove(cutter,do_unlink=True)
    edit(o,'Notch rear geometry around source wall return, leaving the front run intact')

for name in ['Countertop','Kitchen review 15 | sink run carcass side']:
    notch(name,(-6,-3.5,3.0),(-5.2216,-3.113,4.1))
for name in ['Countertop.002','Kitchen review 15 | hob run carcass side']:
    notch(name,(-5.5,-.3327,3.0),(-4.772,.3,4.1))
# The last portion of the native north wall has a shallower inner face.
notch('Countertop.002',(-5.5,.045,3.0),(-2,.3,4.1))

# The north tile field is a plane: trim its boundary at the column rather
# than creating a volume boolean or hiding the complete backsplash.
o=bpy.data.objects['Kitchen review 15 | north square tile faces']
o.data=o.data.copy();bm=bmesh.new();bm.from_mesh(o.data)
inv=o.matrix_world.inverted()
bmesh.ops.bisect_plane(bm,geom=list(bm.verts)+list(bm.edges)+list(bm.faces),
    plane_co=inv@Vector((-4.772,0,0)),plane_no=(inv.to_3x3()@Vector((1,0,0))).normalized(),
    dist=.000001,clear_inner=True,clear_outer=False)
bm.to_mesh(o.data);bm.free();o.data.update()
edit(o,'Stop north backsplash at source corner column')

root['kitchen_cad_fit_23']=True;bpy.context.view_layer.update()
if linked:root.use_fake_user=True;bpy.context.scene.collection.children.unlink(root)
bpy.ops.wm.save_as_mainfile(filepath=str(FILE),compress=True,relative_remap=False)
p=ROOT/'build/kitchen-photo-r23.json';report=json.loads(p.read_text())
report['source_fittings_sha256_after']=hashlib.sha256(FILE.read_bytes()).hexdigest()
report['cad_fit']={'before_sha256':before,'changes':changes,'architecture_modified':False,
                  'fabrication_dimensions_verified':False,'awaiting_evaluated_geometry_QA':True}
p.write_text(json.dumps(report,ensure_ascii=False,indent=2))
print('KITCHEN_R23_CAD_FIT',len(changes),report['source_fittings_sha256_after'],flush=True)
