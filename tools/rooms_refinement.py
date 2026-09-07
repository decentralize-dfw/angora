"""Room corrections checked against the CAD floor sections and room photographs."""
import bpy,math
from mathutils import Vector
from blender_utils import collection,metadata,area_light,camera
from blender_materials import material,linear

def refine_rooms(m,cols):
    from photo_refinement import Local,clear_room,reset_collection,leather_seating,chandelier
    f0=bpy.data.collections['F0_Furniture'];fixed0=bpy.data.collections['F0_Fittings'];fixed1=bpy.data.collections['F1_Fittings']
    m['garden_fabric']=material('Garden grey upholstery','A4A7A0',.94)
    m['garden_table']=material('Garden charcoal furniture','394950',.64)
    m['countertop']=material('Ivory kitchen countertop','E6E1CC',.30)
    m['cabinet_frosted']=material('Frosted green cabinet inset','789A8A',.42)

    def run(ctx,length,panel,upper=True,sink=False,cooker=False,green=False):
        n=max(2,round(length/.6));w=length/n
        for i in range(n):
            x=(i-(n-1)/2)*w
            ctx.box('Kitchen base carcass',(x,0,.43),(w-.008,.59,.84),m['wood_honey'])
            ctx.box('Kitchen door inset',(x,-.307,.44),(w-.10,.022,.63),panel,.005)
            ctx.box('Kitchen handle',(x+w*.31,-.343,.65),(.015,.029,.17),m['chrome'],.004)
            if upper and (not sink or abs(x)>.60) and (not cooker or abs(x-length*.15)>.48):
                ctx.box('Upper cupboard back',(x,.280,1.97),(w-.01,.025,.82),m['wood_honey'])
                for xx in [x-w/2+.016,x+w/2-.016]:ctx.box('Upper cupboard side',(xx,.105,1.97),(.028,.37,.82),m['wood_honey'])
                for z in [1.573,2.367]:ctx.box('Upper cupboard horizontal',(x,.105,z),(w-.01,.37,.026),m['wood_honey'])
                for xx in [x-w/2+.028,x+w/2-.028]:ctx.box('Upper cupboard door stile',(xx,-.10,1.97),(.05,.034,.81),m['wood_honey'])
                for z in [1.602,2.338]:ctx.box('Upper cupboard door rail',(x,-.10,z),(w-.01,.034,.065),m['wood_honey'])
                # Model a cabinet opening behind the glass, rather than laying
                # a pane directly over the opaque front of a solid box.
                ctx.box('Upper cupboard inner recess',(x,.257,1.97),(w-.11,.012,.69),m['wood_dark'],.004)
                ctx.box('Upper cupboard inset',(x,-.102,1.97),(w-.085,.010,.70),m['cabinet_frosted'] if green else m['cabinet_glass'],.004)
                if not green:
                    for z in [1.73,1.99,2.25]:ctx.box('Upper cupboard visible shelf',(x,.08,z),(w-.07,.32,.018),m['wood_honey'])
                ctx.box('Upper cupboard handle',(x+w*.31,-.119,1.69),(.015,.025,.16),m['chrome'],.003)
        if sink:
            for a,b in [(-length/2,-.295),(.295,length/2)]:ctx.box('Countertop',( (a+b)/2,-.02,.895),(b-a,.65,.045),m['countertop'])
            for y,d in [(-.3025,.085),(.263,.085)]:ctx.box('Countertop sink border',(0,y,.895),(.59,d,.045),m['countertop'])
            # Open bowl below a cut countertop, with a separate metal rim.
            vv=[(-.295,-.235,.923),(.295,-.235,.923),(.295,.225,.923),(-.295,.225,.923),(-.215,-.17,.70),(.215,-.17,.70),(.215,.16,.70),(-.215,.16,.70)]
            ctx.mesh('Stainless sink bowl',vv,[(0,1,5,4),(1,2,6,5),(2,3,7,6),(3,0,4,7),(4,5,6,7)],m['chrome'])
            ctx.path('Sink rolled rim',[[vv[i] for i in [0,1,2,3,0]]],.009,m['chrome'])
            tap=[(0,.22,.925),(0,.22,1.15),(0,.19,1.25),(0,.10,1.28),(0,.015,1.23),(0,.015,1.16)]
            ctx.path('Gooseneck kitchen tap',[tap],.014,m['chrome'])
        else:ctx.box('Countertop',(0,-.02,.895),(length+.035,.65,.045),m['countertop'])
        if cooker:
            x=length*.15
            ctx.box('Cooktop',(x,-.03,.931),(.58,.48,.028),m['black'])
            for xx in [-.15,.15]:
                for y in [-.14,.12]:ctx.path('Burner ring',[[(x+xx+.067*math.cos(a*math.tau/24),y+.067*math.sin(a*math.tau/24),.95) for a in range(25)]],.008,m['metal'])
            ctx.box('Oven glass',(x,-.32,.46),(.53,.025,.54),m['black'],.015)
            ctx.path('Oven handle',[[(x-.20,-.368,.68),(x+.20,-.368,.68)]],.015,m['chrome'])
            vv=[(x-.33,-.25,1.63),(x+.33,-.25,1.63),(x+.33,.29,1.63),(x-.33,.29,1.63),(x-.16,-.01,1.85),(x+.16,-.01,1.85),(x+.16,.29,1.85),(x-.16,.29,1.85)]
            ctx.mesh('Extractor canopy',vv,[(0,1,5,4),(1,2,6,5),(2,3,7,6),(3,0,4,7),(0,3,2,1)],m['chrome'])
            ctx.box('Extractor chimney',(x,.14,2.22),(.31,.29,.76),m['chrome'])

    clear_room('Main kitchen');main=reset_collection('Photo kitchen — entrance',fixed1)
    run(Local(main,(-5.24,-1.86,3.0996),90),2.64,m['wood_honey'],sink=True)
    run(Local(main,(-3.75,-.235,3.0996)),2.80,m['wood_honey'],cooker=True)
    c=Local(main)
    c.box('Main refrigerator',(-1.80,-.27,4.08),(.69,.64,1.96),m['chrome'],.025)
    c.box('Fridge door split',(-1.80,-.603,4.56),(.68,.009,.015),m['metal'])
    c.path('Fridge handles',[[(-1.56,-.631,z) for z in [3.60,4.00]],[(-1.56,-.631,z) for z in [4.69,4.95]]],.014,m['chrome'])
    # The basement photos show green glazed inserts and a peninsula toward the lounge.
    clear_room('Garden kitchen');garden_kitchen=reset_collection('Photo kitchen — garden',fixed0)
    run(Local(garden_kitchen,(-5.24,2.0,0),90),2.24,m['cabinet_frosted'],sink=True,green=True)
    run(Local(garden_kitchen,(-3.13,-.04,0),180),3.20,m['cabinet_frosted'],cooker=True,green=True)
    c=Local(garden_kitchen,(-3.18,2.60,0),180)
    run(c,2.68,m['cabinet_frosted'],upper=False)
    c.box('Breakfast bar surface',(0,.06,1.025),(2.82,.72,.055),m['countertop'])
    # Main garden room has a grey seating group and a dark dining set beside the fireplace.
    clear_room('Garden lounge');clear_room('Garden dining')
    garden=reset_collection('Photo furniture — garden lounge',f0)
    alternate=dict(m);alternate['leather_brown']=m['garden_fabric']
    leather_seating(Local(garden,(-4.53,5.55,0),90),alternate,2.55)
    c=Local(garden,(1.10,5.45,0),90)
    c.box('Garden dining table top',(0,0,.76),(1.64,.93,.06),m['garden_table'])
    for x in [-.68,.68]:
        for y in [-.35,.35]:c.box('Garden dining table leg',(x,y,.37),(.045,.045,.74),m['garden_table'])
    for x in [-.50,0,.50]:
        for y,sign in [(-.74,-1),(.74,1)]:
            c.box('Garden chair seat',(x,y,.46),(.41,.40,.07),m['garden_table'],.025)
            for xx in [-.15,-.075,0,.075,.15]:c.box('Garden chair back slat',(x+xx,y+sign*.16,.76),(.035,.03,.49),m['garden_table'],.012)
            for xx in [-.16,.16]:
                for yy in [-.15,.15]:c.box('Garden chair leg',(x+xx,y+yy,.23),(.03,.03,.46),m['garden_table'])
    fixed=reset_collection('Photo details — garden lounge',fixed0);c=Local(fixed,(3.0,6.35,0),-90)
    c.box('Fireplace opening',(0,0,.53),(1.18,.16,.88),m['black'])
    for x in [-.72,.72]:
        c.box('Fireplace pilaster',(x,-.15,.60),(.25,.31,1.15),m['white_trim'],.025)
        for z in [.16,1.02]:c.box('Fireplace pilaster moulding',(x,-.17,z),(.30,.35,.095),m['white_trim'])
    c.box('Fireplace mantel',(0,-.12,1.24),(1.80,.47,.14),m['white_trim'],.024)
    c.box('Fireplace plinth',(0,-.10,.08),(1.80,.43,.15),m['white_trim'],.018)
    c.box('Garden television',(0,-.07,1.87),(1.57,.07,.91),m['black'],.015)
    # White tile inlay seen in the garden room. Its placement remains photo-interpreted.
    c=Local(fixed,(-.30,4.02,0))
    for x in [-.88,.88]:c.box('Garden cream floor border',(x,0,.006),(.32,2.08,.008),m['white_trim'],0)
    for y in [-.88,.88]:c.box('Garden cream floor border',(0,y,.006),(1.44,.32,.008),m['white_trim'],0)
    for x in [-.33,0,.33]:
        for y in [-.33,0,.33]:c.box('Garden cream inlay tile',(x,y,.006),(.327,.327,.008),m['white_trim'],0)
    chandelier(Local(fixed,(1.10,5.45,2.60)),m,cols['lights'],3)
    # Replace the wooden placeholder bed frame in the photographed iron-bed room.
    bed=bpy.data.collections['Southwest bedroom'];c=Local(bed,(-3.90,-2.45,6.3714),90)
    for o in list(bed.all_objects):
        if o.name.startswith(('Headboard','Bed base')):bpy.data.objects.remove(o,do_unlink=True)
    lines=[]
    for y,top in [(1.04,1.01),(-1.04,.72)]:
        for x in [-.73,.73]:
            lines.append([(x,y,.06),(x,y,top)]);c.sphere('Iron bed finial',(x,y,top+.02),(.025,.025,.033),m['brass'],2)
        for z in [.30,top-.08]:lines.append([(-.73,y,z),(.73,y,z)])
        for x in [-.48,-.24,0,.24,.48]:lines.append([(x,y,.30),(x,y,top-.08)])
    for x in [-.73,.73]:lines.append([(x,-1.04,.31),(x,1.04,.31)])
    c.path('Iron bed rails',lines,.013,m['metal'])
    # Keep the source furniture assignment but match the attic's visible bed textiles.
    for name in ['Attic north bedroom','Attic single bedroom']:
        for o in bpy.data.collections[name].all_objects:
            if o.name.startswith('Coverlet'):
                o.data=o.data.copy();o.data.materials.clear();o.data.materials.append(m['pillow_grey'] if name.endswith('north bedroom') else m['blue_fabric'])
    for col,ref,floor in [(main,'kat_2_ust_mutfak',1),(garden_kitchen,'kat_1_bodrum_mutfak',0),(garden,'kat_1_bodrum_salon',0),(fixed,'kat_1_bodrum_salon',0)]:
        for o in col.all_objects:metadata(o,'photo_plan_interpreted',ref,floor_index=floor,dimension_label_allowed=False)
    for o in garden.all_objects:o['placeholder']=True
    camera('10_main_kitchen',(-3.75,-3.37,4.58),(-3.55,-.40,4.05),17,cols['cameras'])
    camera('11_southwest_bedroom',(-2.46,-.73,7.98),(-3.82,-2.45,7.20),18,cols['cameras'])
    camera('12_garden_lounge',(-.40,3.43,1.58),(0,6.70,1.15),14,cols['cameras'])
