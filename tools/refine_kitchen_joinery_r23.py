"""Photo comparison R23, applied directly to the fixed-fittings library.

Preserves native CAD and the independent movable-furniture layer. Cabinet
fabrication sizes and blind details are photo interpretations, not dimensions
to be displayed as measured facts.
"""
import bpy,json,math,sys,hashlib,zipfile
from pathlib import Path
from mathutils import Vector
ROOT=Path(__file__).resolve().parents[1];sys.path.insert(0,str(ROOT/'tools'))
from photo_refinement import Local
from blender_utils import metadata,mesh
from apply_photo_review_patch import physical_uv
from repair_pbr_color_encoding import linear_to_srgb
FILE=ROOT/'build/blender/layers/20-fixed-fittings.blend';REV='23-kitchen-photo-joinery'
assert Path(bpy.data.filepath).resolve()==FILE
root=bpy.data.collections['20_FIXED_FITTINGS'];col=bpy.data.collections['Photo kitchen — entrance']
assert root.library is None and col.library is None and not root.get('kitchen_photo_revision_23')
before_sha=hashlib.sha256(FILE.read_bytes()).hexdigest()
linked=root.name not in bpy.context.scene.collection.children
if linked:bpy.context.scene.collection.children.link(root)
bpy.context.view_layer.update()
REF='kat_2_ust_mutfak/WhatsApp Image 2026-08-26 at 11.53.33.jpeg'
HOB='kat_2_ust_mutfak/WhatsApp Image 2026-08-26 at 11.53.33 (1).jpeg'
VITRINE='kat_2_ust_mutfak/WhatsApp Image 2026-08-26 at 11.53.33 (2).jpeg'
m={n:bpy.data.materials[n] for n in ['wood_honey','wood_dark','chrome','Ivory kitchen countertop']}
created=[];removed=[];changed=[];grain=[]

# A separate satin glass response leaves the clear display glass elsewhere
# in the house unchanged. All five data/color maps are packed and archived.
name='Kitchen satin glazing';slug='kitchen-satin-glazing-'+hashlib.sha1(name.encode()).hexdigest()[:6]
assert name not in bpy.data.materials
glass=bpy.data.materials.new(name);glass.use_nodes=True
bs=glass.node_tree.nodes['Principled BSDF'];bs.inputs['Transmission Weight'].default_value=1.;bs.inputs['IOR'].default_value=1.45
bs.inputs['Coat Weight'].default_value=.02;bs.inputs['Coat Roughness'].default_value=.3
maps={};images={}
for channel,value in [('basecolor',(.74,.78,.75,1)),('normal',(.5,.5,1,1)),
                      ('roughness',(.36,.36,.36,1)),('metallic',(0,0,0,1)),('orm',(1,.36,0,1))]:
    image=bpy.data.images.new(slug+'-'+channel,4,4,alpha=True)
    image.colorspace_settings.name='sRGB' if channel=='basecolor' else 'Non-Color'
    rgba=list(value)
    if channel=='basecolor':rgba[:3]=[linear_to_srgb(v) for v in rgba[:3]]
    image.pixels=rgba*16;path=ROOT/'assets/pbr'/(slug+'-'+channel+'.png')
    image.filepath_raw=str(path);image.file_format='PNG';image.save();image.pack()
    image.filepath='//../../../'+str(path.relative_to(ROOT));maps[channel]=str(path.relative_to(ROOT));images[channel]=image
nt=glass.node_tree
color=nt.nodes.new('ShaderNodeTexImage');color.image=images['basecolor'];nt.links.new(color.outputs['Color'],bs.inputs['Base Color'])
packed=nt.nodes.new('ShaderNodeTexImage');packed.image=images['orm']
channels=nt.nodes.new('ShaderNodeSeparateColor');nt.links.new(packed.outputs['Color'],channels.inputs['Color'])
nt.links.new(channels.outputs['Green'],bs.inputs['Roughness']);nt.links.new(channels.outputs['Blue'],bs.inputs['Metallic'])
normal_tex=nt.nodes.new('ShaderNodeTexImage');normal_tex.image=images['normal'];normal=nt.nodes.new('ShaderNodeNormalMap')
nt.links.new(normal_tex.outputs['Color'],normal.inputs['Color']);nt.links.new(normal.outputs['Normal'],bs.inputs['Normal'])
glass['pbr_maps_json']=json.dumps(maps);glass['pbr_repeat_m']=(1.,1.);glass['pbr_photo_uv']=False
glass['source_reference']=REF;glass['reference_status']='photo_interpreted_not_photometrically_calibrated'
glass['web_texture_bake_required']=False

def add(ctx,label,p,size,mat=None,bevel=.003):
    o=ctx.box('Kitchen R23 | '+label,p,size,mat or m['wood_honey'],bevel)
    created.append(o);return o
def pull(ctx,label,x,y,z,length=.155,horizontal=False):
    # Rounded section and shallow bow, including the two mounting ends.
    points=[]
    for i in range(21):
        t=i/20;offset=-.018*math.sin(math.pi*t)
        points.append((x+(t-.5)*length if horizontal else x,y+offset,z if horizontal else z+(t-.5)*length))
    o=ctx.path('Kitchen R23 | '+label,[points],.007,m['chrome']);o.data.bevel_resolution=3
    created.append(o);return o
def remove(o):removed.append(o.name);bpy.data.objects.remove(o,do_unlink=True)

original=[o.name for o in col.objects]
sink_centers=[(-2.85,-1),(-.87,1)]
for cy,outside in sink_centers:
    # Replace only the two provisional sink-side upper cabinets, including
    # their oversized crowns. Existing source window/ceiling surfaces remain.
    for original_name in original:
        o=bpy.data.objects.get(original_name)
        if o is None:continue
        candidate=o.name.startswith('Upper cupboard') or any(t in o.name for t in ['cupboard moulding','glazing bead'])
        if candidate and o.location.x<-5 and abs(o.location.y-cy)<.37:remove(o)
    ctx=Local(col,(-5.138,cy,5.0696),90)
    add(ctx,'sink upper back',(0,.383,0),(.65,.020,.82))
    for x in [-.312,.312]:add(ctx,'sink upper outer side',(x,.20,0),(.025,.37,.82))
    for z in [-.398,.398]:add(ctx,'sink upper horizontal',(0,.20,z),(.65,.39,.025))
    for z,thick,w,d in [(.43,.042,.68,.418),(.456,.014,.67,.410),(-.424,.032,.673,.407)]:
        add(ctx,'sink upper crown',(0,.19,z),(w,d,thick),bevel=.008)
    partition=outside*.180
    add(ctx,'open bay divider',(partition,.185,0),(.023,.35,.79))
    bay=outside*.260
    for z in [-.29,-.09,.12,.25,.33]:add(ctx,'open bay shelf',(bay,.185,z),(.115,.35,.016),bevel=.002)
    center=-outside*.064
    for d in [-1,1]:
        x=center+d*.121;w=.236
        # Tall narrow glass, broad timber stiles and small top/bottom rails.
        pane=add(ctx,'sink satin inset',(x,-.009,0),(.124,.008,.660),glass,.001)
        for xx in [x-w/2+.027,x+w/2-.027]:add(ctx,'sink glazed stile',(xx,-.016,0),(.054,.028,.778))
        for z in [-.366,.366]:add(ctx,'sink glazed rail',(x,-.016,z),(w,.028,.050))
        pull(ctx,'sink upper bowed pull',x-d*.075,-.039,-.222,.160)
    # Two interior shelf levels are softened by the frosted panes.
    for z in [-.16,.14]:add(ctx,'sink concealed shelf',(center,.19,z),(.48,.34,.018))

# The photographed hob run is solid wood. Retain the original cabinet opening
# and panel proportions; change only the inserts and their narrow framing.
for o in list(col.objects):
    if o.name.startswith('Upper cupboard inset'):
        assert abs(o.rotation_euler.z)<.01
        o.data=o.data.copy();o.data.materials.clear();o.data.materials.append(m['wood_honey'])
        for v in o.data.vertices:v.co.y*=2.2
        o.location.y-=.004;changed.append(o.name)
    if 'vitrine glass lower door' in o.name or ('vitrine upper glass' in o.name and not o.name.endswith('.002')):
        o.data=o.data.copy();o.data.materials.clear();o.data.materials.append(glass);changed.append(o.name)

# The window shade is fitted in the clear gap between the existing cupboards.
# Its raised position is photo interpreted; it is not an opening dimension.
ctx=Local(col,(-5.50,-1.86,0),90)
add(ctx,'blind headrail',(0,0,5.635),(1.35,.047,.035),m['wood_dark'],.004)
for i in range(36):
    o=add(ctx,'timber blind slat',(0,-.008,5.595-i*.018),(1.28,.025,.0018),bevel=0)
    o.rotation_euler.rotate_axis('X',math.radians(28))
add(ctx,'blind bottom rail',(0,-.009,4.957),(1.28,.027,.010),bevel=.002)
for x in [-.48,.48]:
    cord=ctx.path('Kitchen R23 | blind ladder cord',[[(x,-.020,4.955),(x,-.020,5.615)]],.0017,m['wood_dark'])
    cord.data.bevel_resolution=2;created.append(cord)

# Tile faces now end at the actual source window surround, instead of the
# wider provisional gap. Split boundary tiles rather than stair-stepping it.
old=next(o for o in col.objects if o.name=='Kitchen review 15 | west square tile faces');remove(old)
vertices=[];faces=[]
hole=(-2.532,-1.124,4.136,5.264)
def quad(a,b,c,d):
    if b-a<.0001 or d-c<.0001:return
    k=len(vertices);vertices.extend([(-5.528,a,c),(-5.528,b,c),(-5.528,b,d),(-5.528,a,d)]);faces.append((k,k+1,k+2,k+3))
for i in range(33):
    for j in range(9):
        a=-3.20+i*2.67/33+.0014;b=-3.20+(i+1)*2.67/33-.0014
        c=4.0286+j*.081+.0014;d=4.0286+(j+1)*.081-.0014
        l,r,bottom,top=hole
        if b<=l or a>=r or d<=bottom or c>=top:quad(a,b,c,d);continue
        quad(a,min(b,l),c,d);quad(max(a,r),b,c,d)
        quad(max(a,l),min(b,r),c,min(d,bottom));quad(max(a,l),min(b,r),max(c,top),d)
tile=mesh('Kitchen R23 | window registered tile faces',vertices,faces,m['Ivory kitchen countertop'],col);created.append(tile)

# Correct each board's material coordinates rather than rotating a shared
# texture, which would also rotate every other timber surface in the villa.
def wood_uv(o):
    if o.type!='MESH' or o.hide_render:return
    if not any(mat and mat.name=='wood_honey' for mat in o.data.materials):return
    o.data=o.data.copy();uv=o.data.uv_layers.active or o.data.uv_layers.new(name='UVMap')
    label=o.name.lower();ext=[max(v.co[i] for v in o.data.vertices)-min(v.co[i] for v in o.data.vertices) for i in range(3)]
    horizontal=any(s in label for s in ['rail','shelf','horizontal','crown','moulding','plinth','stretcher','blind slat'])
    axis=0 if horizontal or (('panel' in label or 'door' in label) and ext[2]<.36) else 2
    phase=int(hashlib.sha1(o.name.encode()).hexdigest()[:8],16)/2**32
    for face in o.data.polygons:
        if o.data.materials[face.material_index].name!='wood_honey':continue
        normal=max(range(3),key=lambda i:abs(face.normal[i]));axes=[i for i in range(3) if i!=normal]
        along=axis if axis in axes else axes[0];across=next(a for a in axes if a!=along)
        for li in face.loop_indices:
            p=o.data.vertices[o.data.loops[li].vertex_index].co
            uv.data[li].uv=(p[along]+phase,p[across]/.8+phase*.73)
    o['preserve_authored_uv']=True;o['grain_long_axis_local']='XYZ'[axis];grain.append(o.name)
for o in created:
    metadata(o,'photo_plan_interpreted',REF,floor_index=1,review_revision=REV,photo_match_approved=False)
    if o.type=='MESH':physical_uv(o)
for o in list(col.objects):wood_uv(o)
for o in created:
    if o.type=='MESH':
        for modifier in o.modifiers:
            if modifier.type=='BEVEL':modifier.segments=3
for name in changed:
    o=bpy.data.objects[name];o['review_revision']=REV;o['photo_match_approved']=False
    o['source_reference']=VITRINE if 'vitrine' in name else HOB
root['kitchen_photo_revision_23']=True;bpy.context.view_layer.update()
if linked:root.use_fake_user=True;bpy.context.scene.collection.children.unlink(root)
bpy.ops.wm.save_as_mainfile(filepath=str(FILE),compress=True,relative_remap=False)

p=ROOT/'assets/pbr/manifest.json';manifest=json.loads(p.read_text())
manifest['materials'].append({'material':glass.name,'repeat_m':[1.,1.],'photo_uv_preserved':False,'maps':maps,
 'source_status':'photo_interpreted_not_photometrically_calibrated','native_library':'build/blender/layers/20-fixed-fittings.blend'})
manifest['material_revision']='23-kitchen-satin-glazing';manifest['all_materials_mapped']=True
for path in maps.values():manifest['file_sha256'][Path(path).name]=hashlib.sha256((ROOT/path).read_bytes()).hexdigest()
p.write_text(json.dumps(manifest,ensure_ascii=False,indent=2))
readme=ROOT/'assets/pbr/README.md'
if 'Revision 23 adds' not in readme.read_text():
    readme.write_text(readme.read_text()+'\nRevision 23 adds a separate satin glass response for the photographed kitchen\n'
        'doors. There are 78 materials and 390 PNG maps. The new glass uses neutral\n'
        'normal and metalness maps, roughness 0.36 and transmission 1. Its optical values\n'
        'are photo interpretation, not a measured glazing specification. Timber grain\n'
        'corrections are local UV edits; the shared wood maps remain unchanged.\n')
archive_path=ROOT/'assets/pbr/pbr-maps.zip';temporary=archive_path.with_suffix('.zip.tmp')
with zipfile.ZipFile(archive_path) as old,zipfile.ZipFile(temporary,'w',compression=zipfile.ZIP_DEFLATED) as archive:
    for entry in old.infolist():
        if entry.filename not in ['manifest.json','README.md']:archive.writestr(entry,old.read(entry))
    for path in maps.values():
        target=Path(path).name;assert target not in archive.namelist();archive.write(ROOT/path,target)
    archive.write(p,'manifest.json');archive.write(readme,'README.md')
temporary.replace(archive_path)
report={'revision':23,'source_fittings_sha256_before':before_sha,'source_fittings_sha256_after':hashlib.sha256(FILE.read_bytes()).hexdigest(),
 'source_photos':[{'file':r,'sha256':hashlib.sha256((ROOT/r).read_bytes()).hexdigest()} for r in [REF,HOB,VITRINE]],
 'removed_provisional_parts':removed,'new_parts':[o.name for o in created],'changed_panels':changed,'wood_uv_parts':grain,
 'new_material':{'name':glass.name,'roughness':.36,'metallic':0,'transmission':1,'maps':maps},
 'native_CAD_modified':False,'movable_furniture_modified':False,'fabrication_dimensions_verified':False,'photo_match_approved':False,
 'remaining':['Countertop and tile photo pattern/color matching','Window shutter pose and frame/photo comparison','Vitrine display contents, ceiling profile and room lighting']}
(ROOT/'build/kitchen-photo-r23.json').write_text(json.dumps(report,ensure_ascii=False,indent=2))
print('KITCHEN_R23',len(created),len(removed),len(changed),len(grain),flush=True)
