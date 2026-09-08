"""R22: correct confirmed intersections and replace unsupported hall furniture.

Run on the editable furniture library. Positions and forms follow room photos;
the CAD walls/floors are not altered to accommodate furniture. Repeat runs are
idempotent. Every removable part retains an explicit assembly and floor.
"""
import bpy,json,math,sys,hashlib
from pathlib import Path
from mathutils import Vector,Matrix
ROOT=Path(__file__).resolve().parents[1];sys.path.insert(0,str(ROOT/'tools'))
from photo_refinement import Local
FILE=ROOT/'build/blender/layers/30-furniture-placeholders.blend'
assert Path(bpy.data.filepath).resolve()==FILE
root=bpy.data.collections['30_FURNITURE_PLACEHOLDERS']
assert not root.get('clearance_revision_22'),'R22 already applied; re-audit before another edit'
before_hash=hashlib.sha256(FILE.read_bytes()).hexdigest()
audit=json.loads((ROOT/'build/furniture-collision-before-r22.json').read_text())
assert audit['source_furniture_sha256']==before_hash,'Audit must match furniture being edited'
# Delivery libraries open with an empty Scene. Link the root temporarily so
# matrix_world is evaluated from the saved locations/rotations before editing.
linked_for_edit=root.name not in bpy.context.scene.collection.children
if linked_for_edit:bpy.context.scene.collection.children.link(root)
bpy.context.view_layer.update()
for record in audit['items']:
    o=bpy.data.objects[record['object']];o['assembly_id']=record['assembly']
changes=[]
def transform(objects,origin=(0,0,0),target=(0,0,0),angle=0,reason=''):
    matrix=Matrix.Translation(Vector(target))@Matrix.Rotation(math.radians(angle),4,'Z')@Matrix.Translation(-Vector(origin))
    for o in objects:o.matrix_world=matrix@o.matrix_world;o['review_revision']=22
    bpy.context.view_layer.update()
    changes.append({'objects':[o.name for o in objects],'origin':origin,'target':target,'rotation_degrees':angle,'reason':reason})
def move_collection(name,delta,reason):transform(list(bpy.data.collections[name].all_objects),target=delta,reason=reason)
move_collection('Master dressing furniture',(0,.12,0),'Dresser back was inside the bedroom partition')
move_collection('Southwest bedroom wardrobe',(.16,0,0),'Wardrobe intersected the return of the actual CAD doorway')
quilt=bpy.data.objects['Draped master quilt'];quilt.data=quilt.data.copy()
inv=quilt.matrix_world.inverted()
for v in quilt.data.vertices:
    p=quilt.matrix_world@v.co;p.y=6.35+(p.y-6.35)*.90;v.co=inv@p
changes.append({'objects':[quilt.name],'native_y_center':6.35,'native_y_scale':.90,'reason':'Clear both bedside cabinets while preserving the drape and photo UVs'})

# The attic photos show a bed, fan and leaning mirror; the two generated
# bedside cabinets and paired lamps were unsupported placeholders.
bed=bpy.data.collections['Attic north bedroom'];removed=[]
for o in list(bed.all_objects):
    if any(s in o.name.lower() for s in ['dresser','drawer','lamp']):removed.append(o.name);bpy.data.objects.remove(o,do_unlink=True)
changes.append({'removed':removed,'reason':'Unsupported attic bedside cabinets and lamps; one cabinet intersected the roof return',
                'reference':'kat_4/WhatsApp Image 2026-08-26 at 11.53.10 (6).jpeg'})

move=list(bpy.data.collections['Attic lounge'].all_objects)
transform(move,(-4.6,1.15,9.4705),(-3.85,3.025,9.4705),-90,'Blue sofa against the internal wall shown in the photographs')
table=bpy.data.collections['Attic lounge table'];old_tv=[]
for o in list(table.all_objects):
    if any(s in o.name.lower() for s in ['screen','tv','television']):old_tv.append(o.name);bpy.data.objects.remove(o,do_unlink=True)
transform(list(table.all_objects),(-3.2,1.15,9.4705),(-3.85,1.83,9.4705),0,'Coffee table centered in front of the photographed attic sofa')
hall=bpy.data.collections['Upper hall'];old_hall=[o.name for o in hall.all_objects]
for o in list(hall.all_objects):bpy.data.objects.remove(o,do_unlink=True)
changes.append({'removed':old_hall,'reason':'Photo shows two wing chairs and a dark table, not the intersecting generic sofa',
                'reference':'kat_3_hol/WhatsApp Image 2026-08-26 at 11.52.07 (9).jpeg'})
required=['fabric','wood_honey','antique_wood','Bathroom silver mirror','brass','wood_dark','black','metal','glass']
missing=[name for name in required if name not in bpy.data.materials]
if missing:
    with bpy.data.libraries.load(str(FILE.parent/'shared-materials.blend'),link=True,relative=True) as (source,destination):
        assert all(name in source.materials for name in missing);destination.materials=missing
m={mat.name:mat for mat in bpy.data.materials}
created=[]
def finish(objects,assembly,floor,reference):
    for o in objects:
        o['assembly_id']=assembly;o['floor_index']=floor;o['placeholder']=True;o['review_revision']=22
        o['evidence_status']='photo_interpreted';o['source_reference']=reference;o['dimension_label_allowed']=False;o['photo_match_approved']=False
        if o.type=='MESH':
            me=o.data;uv=me.uv_layers.active or me.uv_layers.new(name='UVMap')
            for poly in me.polygons:
                mat=me.materials[poly.material_index];repeat=mat.get('pbr_repeat_m',(1,1));axis=max(range(3),key=lambda i:abs(poly.normal[i]));axes=[i for i in range(3) if i!=axis]
                for li in poly.loop_indices:
                    p=me.vertices[me.loops[li].vertex_index].co;uv.data[li].uv=(p[axes[0]]/repeat[0],p[axes[1]]/repeat[1])
            for modifier in o.modifiers:
                if modifier.type=='BEVEL':modifier.segments=4
        created.append(o.name)
def wing_chair(origin,angle,index):
    before=set(hall.objects);c=Local(hall,origin,angle)
    c.box('Hall wing chair base',(0,0,.28),(.76,.77,.24),m['fabric'],.065)
    c.box('Hall wing chair seat',(0,-.075,.46),(.57,.61,.15),m['fabric'],.07)
    c.box('Hall wing chair high back',(0,.29,.91),(.60,.20,.94),m['fabric'],.09)
    for sign in [-1,1]:
        c.box('Hall wing chair wing',(sign*.32,.215,1.01),(.18,.31,.59),m['fabric'],.075)
        c.box('Hall wing chair rolled arm',(sign*.325,-.055,.67),(.19,.76,.22),m['fabric'],.088)
        for y in [-.28,.27]:c.box('Hall wing chair foot',(sign*.27,y,.095),(.072,.072,.19),m['antique_wood'],.018)
    seams=[[(-.27,-.34,.51),(.27,-.34,.51),(.27,.18,.51)]]
    c.path('Hall wing chair piping',seams,.003,m['fabric'])
    finish(set(hall.objects)-before,'Upper hall / wing chair '+str(index),2,'kat_3_hol/WhatsApp Image 2026-08-26 at 11.52.07 (9).jpeg')
wing_chair((-4.48,3.05,6.3714),35,1)
wing_chair((-2.75,3.02,6.3714),-35,2)
before=set(hall.objects);c=Local(hall,(-3.83,2.05,6.3714))
c.box('Hall photo coffee table top',(0,0,.43),(1.03,.64,.06),m['wood_dark'],.025)
for x in [-.42,.42]:
    for y in [-.23,.23]:c.box('Hall photo coffee table tapered foot',(x,y,.205),(.06,.06,.41),m['wood_dark'],.012)
finish(set(hall.objects)-before,'Upper hall / dark coffee table',2,'kat_3_hol/WhatsApp Image 2026-08-26 at 11.52.08.jpeg')
before=set(hall.objects);c=Local(hall,(-3.9,1.06,6.3714),180)
c.box('Hall cabinet carcass',(0,0,1.02),(1.53,.44,2.04),m['wood_honey'],.024)
c.box('Hall cabinet cornice',(0,0,2.05),(1.65,.52,.11),m['antique_wood'],.02)
for x in [-.61,.61]:c.box('Hall cabinet side panel',(x,-.235,1.31),(.27,.035,1.35),m['antique_wood'],.012)
c.box('Hall cabinet mirror',(0,-.244,1.31),(.75,.012,1.19),m['Bathroom silver mirror'],.005)
for x in [-.38,.38]:
    c.box('Hall cabinet drawer',(x,-.244,.29),(.70,.04,.32),m['antique_wood'],.01)
    c.box('Hall cabinet brass pull',(x,-.275,.29),(.13,.025,.013),m['brass'],.004)
finish(set(hall.objects)-before,'Upper hall / mirror cabinet',2,'kat_3_hol/WhatsApp Image 2026-08-26 at 11.52.08 (5).jpeg')

before=set(bed.objects);c=Local(bed,(-1.31,7.57,9.4705))
c.lathe('Attic floor fan base',(0,0,0),[(.16,.01),(.19,.035),(.16,.065),(.045,.085)],m['black'],40)
c.box('Attic floor fan stem',(0,0,.49),(.026,.026,.88),m['black'],.008)
loops=[]
for radius in [.06,.12,.19,.245]:loops.append([(radius*math.cos(math.tau*i/48),-.055,.99+radius*math.sin(math.tau*i/48)) for i in range(49)])
for i in range(24):
    a=math.tau*i/24;loops.append([(.025*math.cos(a),-.056,.99+.025*math.sin(a)),(.245*math.cos(a),-.056,.99+.245*math.sin(a))])
c.path('Attic floor fan metal guard',loops,.0025,m['metal'])
c.sphere('Attic floor fan motor',(0,.02,.99),(.067,.072,.067),m['black'],2)
for i in range(3):
    a=math.tau*i/3;c.sphere('Attic floor fan blade',(.10*math.cos(a),-.015,.99+.10*math.sin(a)),(.085,.012,.055),m['black'],2)
finish(set(bed.objects)-before,'Attic north bedroom / floor fan',3,'kat_4/WhatsApp Image 2026-08-26 at 11.53.10 (6).jpeg')
before=set(bed.objects);c=Local(bed,(-.81,7.40,9.4705),90)
c.box('Attic leaning mirror frame',(0,0,.81),(.49,.05,1.61),m['black'],.015)
c.box('Attic leaning mirror face',(0,-.028,.82),(.42,.009,1.46),m['Bathroom silver mirror'],.003)
finish(set(bed.objects)-before,'Attic north bedroom / leaning mirror',3,'kat_4/WhatsApp Image 2026-08-26 at 11.53.10 (6).jpeg')
before=set(table.objects);c=Local(table,(-4.05,.98,9.4705),180)
c.box('Attic television console',(0,0,.31),(1.15,.36,.58),m['wood_honey'],.024)
for x in [-.28,.28]:c.box('Attic television console drawer',(x,-.19,.32),(.50,.025,.31),m['wood_honey'],.01)
c.box('Attic television stand',(0,0,.6225),(.34,.19,.045),m['black'],.01)
c.box('Attic television stem',(0,.015,.7025),(.055,.035,.13),m['black'],.007)
c.box('Attic television bezel',(0,0,1.0025),(1.00,.055,.58),m['black'],.018)
c.box('Attic television screen',(0,-.03,1.0025),(.954,.008,.534),m['glass'],.008)
finish(set(table.objects)-before,'Attic lounge / television console',3,'kat_4/WhatsApp Image 2026-08-26 at 11.53.10.jpeg')

root['attic_tv_clearance_22']=True;root['clearance_revision_22']=True;root['hall_chair_clearance_22']=True;bpy.context.view_layer.update()
if linked_for_edit:
    root.use_fake_user=True;bpy.context.scene.collection.children.unlink(root)
bpy.ops.wm.save_as_mainfile(filepath=str(FILE),compress=True,relative_remap=False)
report={'revision':22,'source_furniture_sha256_before':before_hash,
        'source_furniture_sha256_after':hashlib.sha256(FILE.read_bytes()).hexdigest(),'changes':changes,'new_parts':created,
        'architecture_modified':False,'photo_match_approved':False,'collision_audit_required_after_save':True}
(ROOT/'build/furniture-refinement-r22.json').write_text(json.dumps(report,ensure_ascii=False,indent=2))
print('FURNITURE_REFINED',len(created),len(changes),flush=True)
