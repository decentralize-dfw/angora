"""Photo-led entrance kitchen joinery; preserve CAD walls and openings.

Fixtures are interpreted from the supplied room photos. Their small fabrication
dimensions are not surveyed and must not appear as verified measurement labels.
"""
import bpy,math,sys,json,hashlib
from pathlib import Path
from mathutils import Vector
ROOT=Path(__file__).resolve().parents[1];sys.path.insert(0,str(ROOT/'tools'))
from photo_refinement import Local
from blender_utils import metadata,mesh
from apply_photo_review_patch import physical_uv
REV='15-entrance-kitchen-joinery';PREFIX='Kitchen review 15 | '
REF='kat_2_ust_mutfak/WhatsApp Image 2026-08-26 at 11.53.33.jpeg'
VREF='kat_2_ust_mutfak/WhatsApp Image 2026-08-26 at 11.53.33 (2).jpeg'

def apply():
    col=bpy.data.collections.get('Photo kitchen — entrance')
    if not col or col.library:return []
    for o in list(col.objects):
        if o.name.startswith(PREFIX):bpy.data.objects.remove(o,do_unlink=True)
    original=list(col.objects);wood=bpy.data.materials['wood_honey'];metal=bpy.data.materials['chrome']
    dark=bpy.data.materials['wood_dark'];ivory=bpy.data.materials['Ivory kitchen countertop']
    glass=bpy.data.materials['cabinet_glass'];green=bpy.data.materials['Frosted green cabinet inset']
    base=3.0996;created=[]
    def add(ctx,name,p,size,mat=wood,bevel=.003):
        o=ctx.box(PREFIX+name,p,size,mat,bevel);created.append(o);return o
    # Raised-panel profiles follow the existing CAD-aligned cabinet fronts.
    for door in original:
        if not door.name.startswith('Kitchen door inset'):continue
        ctx=Local(col,door.location,math.degrees(door.rotation_euler.z));w=door.dimensions.x;h=door.dimensions.z
        # The photographed sink run has five unequal modules. Replace the
        # four equal provisional fronts so the dishwasher clears the bowl.
        if abs(door.rotation_euler.z-math.pi/2)<.05 or abs(door.rotation_euler.z)<.05:
            door.hide_render=True;door.hide_viewport=True;door['replaced_by_review_revision']=REV
            for hnd in original:
                near=(hnd.location.xy-door.location.xy).length<.48
                if hnd.name.startswith(('Kitchen handle','Kitchen base carcass')) and near:
                    hnd.hide_render=True;hnd.hide_viewport=True;hnd['replaced_by_review_revision']=REV
            continue
        for x in [-w/2+.035,w/2-.035]:add(ctx,'door stile',(x,-.019,0),(.054,.021,h),wood,.003)
        for z in [-h/2+.035,h/2-.035]:add(ctx,'door rail',(0,-.020,z),(w-.055,.022,.064),wood,.003)
        add(ctx,'raised center field',(0,-.026,0),(w-.16,.018,h-.18),wood,.005)
    # Small rounded crown and base mouldings around existing glazed cupboards.
    for pane in original:
        if not pane.name.startswith('Upper cupboard inset'):continue
        ctx=Local(col,pane.location,math.degrees(pane.rotation_euler.z));w=pane.dimensions.x
        for z,depth,height in [(.420,.43,.044),(.447,.46,.026),(-.408,.42,.035)]:
            add(ctx,'cupboard moulding',(0,.10,z),(w+.115,depth,height),wood,.010)
        # Two internal shelf heights and narrow timber glazing beads.
        for x in [-w/2+.012,w/2-.012]:add(ctx,'glazing bead',(x,-.012,0),(.018,.018,.69),wood,.002)
    west=Local(col,(-5.24,-1.86,base),90)
    north=Local(col,(-3.75,-.235,base));edge=-1.40
    for module,w in enumerate([.51,.51,.52,.58,.68]):
        x=edge+w/2;edge+=w
        if module==3:continue # existing oven occupies this opening
        for xx in [x-w/2+.014,x+w/2-.014]:add(north,'hob run carcass side',(xx,0,.43),(.026,.59,.84),wood)
        add(north,'hob run plinth',(x,-.24,.075),(w-.02,.065,.15),wood)
        add(north,'hob run door',(x,-.314,.465),(w-.014,.024,.74),wood,.004)
        for xx in [x-w/2+.028,x+w/2-.028]:add(north,'hob run stile',(xx,-.332,.465),(.050,.020,.74),wood)
        for z in [.125,.805]:add(north,'hob run rail',(x,-.333,z),(w-.034,.020,.057),wood)
        add(north,'hob run top stretcher',(x,-.282,.856),(w-.02,.055,.034),wood)
        add(north,'hob run pull',(x+w/2-.066,-.365,.675),(.020,.032,.16),metal,.006)
    edge=-1.32
    for module,w in enumerate([.36,.58,.76,.50,.44]):
        x=edge+w/2;edge+=w
        if module==1:
            add(west,'dishwasher brushed door',(x,-.325,.435),(w-.012,.035,.69),metal,.008)
            add(west,'dishwasher control strip',(x,-.350,.815),(w-.012,.020,.070),metal)
            add(west,'dishwasher recessed pull',(x,-.363,.807),(.22,.010,.023),dark,.004)
            for i in range(5):add(west,'dishwasher program button',(x+.10+i*.022,-.363,.829),(.01,.006,.008),dark,.001)
            continue
        for xx in [x-w/2+.014,x+w/2-.014]:add(west,'sink run carcass side',(xx,0,.43),(.026,.59,.84),wood)
        add(west,'sink run plinth',(x,-.24,.075),(w-.02,.065,.15),wood)
        add(west,'sink run top stretcher',(x,-.282,.856),(w-.02,.055,.034),wood)
        panels=[(.24,.27),(.505,.23),(.743,.20)] if module==3 else [(.465,.74)]
        halves=2 if module==2 else 1
        for half in range(halves):
            px=x+(half-(halves-1)/2)*w/halves;pw=w/halves-.012
            for z,h in panels:
                add(west,'sink run panel',(px,-.311,z),(pw,.024,h),wood,.004)
                for xx in [px-pw/2+.025,px+pw/2-.025]:add(west,'sink run stile',(xx,-.330,z),(.047,.02,h),wood)
                for zz in [z-h/2+.025,z+h/2-.025]:add(west,'sink run rail',(px,-.331,zz),(pw-.035,.02,.048),wood)
                if module==3:add(west,'drawer pull',(px,-.363,z+h/2-.055),(.19,.032,.018),metal,.006)
                else:add(west,'sink run pull',(px+(-1 if half else 1)*(pw/2-.052),-.362,.675),(.02,.033,.155),metal,.006)
    add(west,'sink draining board',(-.575,-.005,.927),(.51,.46,.013),metal,.006)
    for i in range(12):add(west,'draining channel',(-.80+i*.039,-.01,.935),(.014,.36,.004),metal,.002)
    # Tile relief with real joints; omit the CAD window opening.
    def tile_panel(ctx,lo,hi,window=False):
        step=.082;rows=9;cols=round((hi-lo)/step);dx=(hi-lo)/cols;vv=[];ff=[]
        for i in range(cols):
            for j in range(rows):
                x0=lo+i*dx+.0014;x1=lo+(i+1)*dx-.0014;z0=.929+j*.081+.0014;z1=.929+(j+1)*.081-.0014
                if window and -.86<(x0+x1)/2<.86 and z1>1.10:continue
                depth=.288 if window else .20
                k=len(vv);vv.extend([ctx.point(p) for p in [(x0,depth,z0),(x1,depth,z0),(x1,depth,z1),(x0,depth,z1)]]);ff.append((k,k+1,k+2,k+3))
        o=mesh(PREFIX+('west' if window else 'north')+' square tile faces',vv,ff,ivory,col);created.append(o)
    tile_panel(west,-1.34,1.33,True);tile_panel(Local(col,(-3.75,-.235,base)), -1.42,1.40)
    # Vitrine on the wall opposite the sink. Offset and joinery sizes are
    # photo/plan interpretation; keep the entrance and terrace opening clear.
    # Native F1 wall rays at y=-3.5..-2.0 locate its finished face at x=1.038.
    # The cabinet back finishes at x=1.017, leaving a 21 mm fitting gap.
    c=Local(col,(.85,-2.65,base),-90)
    add(c,'vitrine recessed back',(0,.155,1.22),(2.08,.024,2.40),dark)
    for x in [-1.04,-.64,.38,1.04]:add(c,'vitrine upright',(x,.02,1.21),(.038,.34,2.40),wood)
    add(c,'vitrine plinth',(0,.015,.065),(2.12,.38,.13),wood)
    # Full-height pantry to the photographed left of the display doors.
    for z,h in [(.70,1.15),(1.88,1.12)]:
        add(c,'vitrine pantry door',(-.845,-.17,z),(.36,.04,h),wood,.006)
        add(c,'vitrine pantry handle',(-.715,-.202,z+.21),(.020,.030,.16),metal,.006)
    for x in [-.39,.12]:
        add(c,'vitrine glass lower door',(x,-.166,.76),(.46,.012,1.21),glass,.001)
        for xx in [x-.23,x+.23]:add(c,'vitrine glazed stile',(xx,-.18,.76),(.045,.035,1.29),wood)
        for z in [.12,1.40]:add(c,'vitrine glazed rail',(x,-.18,z),(.50,.035,.054),wood)
        add(c,'vitrine pull',(x+(.17 if x<0 else -.17),-.214,1.23),(.020,.030,.17),metal,.006)
    for z in [.37,.69,1.03,1.35]:add(c,'vitrine shelf',(-.135,.0,z),(.985,.31,.024),wood)
    add(c,'vitrine display counter',(-.135,-.017,1.44),(1.06,.41,.036),ivory,.006)
    add(c,'vitrine low side cabinet',(.71,.0,.43),(.61,.34,.82),wood)
    for x in [.56,.86]:
        add(c,'vitrine lower side door',(x,-.183,.45),(.28,.030,.70),wood)
        add(c,'vitrine side handle',(x+(.08 if x<.7 else -.08),-.213,.65),(.018,.026,.13),metal,.004)
    add(c,'vitrine low counter',(.71,-.017,.875),(.66,.42,.035),ivory,.006)
    # Three shallow bridge cupboards above the open display niche.
    for x in [-.35,.17,.71]:
        add(c,'vitrine upper glass',(x,-.176,2.17),(.45,.012,.37),glass,.001)
        for xx in [x-.24,x+.24]:add(c,'vitrine bridge stile',(xx,-.18,2.17),(.040,.034,.44),wood)
        for z in [1.95,2.39]:add(c,'vitrine bridge rail',(x,-.18,z),(.52,.034,.052),wood)
        add(c,'vitrine bridge pull',(x,-.212,2.01),(.17,.025,.018),metal,.006)
    add(c,'vitrine crown',(0,.02,2.435),(2.18,.42,.060),wood,.012)
    for o in created:
        metadata(o,'photo_plan_interpreted',VREF if 'vitrine' in o.name else REF,
                 floor_index=1,dimension_label_allowed=False,review_revision=REV,photo_match_approved=False)
        if o.type=='MESH':physical_uv(o)
    return [o.name for o in created]

if __name__=='__main__':
    path=Path(bpy.data.filepath)
    if path.parent.name=='layers':
        nested={child for c in bpy.data.collections for child in c.children}
        for c in list(bpy.data.collections):
            if c.library is None and c not in nested and c.name not in bpy.context.scene.collection.children:
                bpy.context.scene.collection.children.link(c)
    bpy.context.view_layer.update();changes=apply();bpy.context.view_layer.update()
    if changes or path.name=='angora21-working.blend':
        bpy.context.scene['review_revision']=REV
        if path.name=='angora21-working.blend':bpy.context.scene['monolithic_source_sha256']=hashlib.sha256((ROOT/'build/intermediate/angora21-monolithic.blend').read_bytes()).hexdigest()
        bpy.ops.wm.save_as_mainfile(filepath=str(path),compress=True,relative_remap=False)
    report={'file':str(path),'added_objects':len(changes),'mesh_vertices':sum(len(o.data.vertices) for o in bpy.context.scene.objects if o.type=='MESH'),
            'geometry_and_empty_objects':sum(o.type not in ['LIGHT','CAMERA'] for o in bpy.context.scene.objects)}
    if path.name=='angora21-monolithic.blend':(ROOT/'build/intermediate/kitchen-review-source.json').write_text(json.dumps(report,indent=2))
    print('ENTRANCE_KITCHEN_REVIEW',json.dumps(report),flush=True)
