"""Photo-directed bathroom fittings; positions remain explicitly interpreted."""
import bpy,math
from mathutils import Vector
from blender_utils import camera,metadata,area_light
from blender_materials import material,linear,tiles,noise_bump

def refine_bathrooms(m,cols):
    from photo_refinement import Local,clear_room
    m['bath_cream']=material('Bathroom cream marble','E4DDC9',.30)
    noise_bump(m['bath_cream'],37,.06,.002)
    m['bath_red']=material('Bathroom lower terracotta','95513D',.36)
    m['bath_wood']=material('Bathroom dark walnut','57351F',.34)
    m['bath_mirror']=material('Bathroom silver mirror','ECECEC',.012,1)
    checker=material('Shared bathroom diagonal red ivory tiles','C59A7A',.34)
    nt=checker.node_tree;co=nt.nodes.new('ShaderNodeTexCoord');mp=nt.nodes.new('ShaderNodeMapping')
    mp.inputs['Rotation'].default_value.z=math.pi/4
    nt.links.new(co.outputs['Object'],mp.inputs['Vector'])
    ch=nt.nodes.new('ShaderNodeTexChecker');ch.inputs['Scale'].default_value=1/.29
    ch.inputs['Color1'].default_value=linear('A66049');ch.inputs['Color2'].default_value=linear('ECE2C5')
    nt.links.new(mp.outputs['Vector'],ch.inputs['Vector']);nt.links.new(ch.outputs['Color'],nt.nodes.get('Principled BSDF').inputs['Base Color'])
    checker['web_texture_bake_required']=True
    creamfloor=material('Master bathroom cream tile','E8E1CD',.30)
    tiles(creamfloor,'E8E1CD','DDD5C1',(.33,.33),'B9B09C',.0015,math.pi/4)

    def shower(c,r=1.05,hydro=False):
        # A corner quarter-circle enclosure: the origin sits at the two rear walls.
        n=48;arc=[(r*math.cos(math.pi*i/(2*n)),r*math.sin(math.pi*i/(2*n))) for i in range(n+1)]
        vv=[(0,0,.16)]+[(x,y,.16) for x,y in arc]
        ff=[(0,i+1,i+2) for i in range(n)]
        for x,y in arc:vv.append((x,y,.035))
        for i in range(n):ff.append((1+i,2+i,n+3+i,n+2+i))
        c.mesh('Curved shower tray',vv,ff,m['ceramic'],True)
        inner=.84*r
        c.path('Shower tray lip',[[(*p,.175) for p in arc]],.032,m['ceramic'])
        for z in [.20,2.13]:c.path('Curved shower rail',[[(*p,z) for p in arc]],.019,m['chrome'])
        for a in [0,.40,.78,1.17,math.pi/2]:
            x,y=r*math.cos(a),r*math.sin(a)
            c.path('Shower upright',[[(x,y,.20),(x,y,2.13)]],.012,m['chrome'])
        vv=[];ff=[]
        for x,y in arc:vv.extend([(x,y,.22),(x,y,2.11)])
        for i in range(n):ff.append((2*i,2*i+2,2*i+3,2*i+1))
        o=c.mesh('Curved shower glazing',vv,ff,m['glass'],True)
        for a in [.73,.84]:
            x,y=(r+.035)*math.cos(a),(r+.035)*math.sin(a)
            c.path('Shower door handle',[[(x,y,.92),(x,y,1.12)]],.012,m['chrome'])
        # Mixer and hose are visible inside the enclosure in both photo groups.
        c.box('Shower control panel',(.18,.18,1.17),(.21,.12,1.52),m['white_trim'],.035)
        for z in ([.70,.95,1.20,1.45] if hydro else [1.0]):c.sphere('Shower control jet',(.18,.255,z),(.032,.016,.032),m['chrome'],2)
        c.path('Shower hose',[[ (.18,.28,1.25),(.35,.28,.90),(.46,.28,1.05),(.35,.28,1.74)]],.009,m['chrome'])
        c.sphere('Hand shower rose',(.35,.29,1.78),(.07,.024,.09),m['chrome'],2)
        c.box('Shower drain',(.52,.52,.165),(.095,.095,.008),m['chrome'],.02)

    def basin(c):
        n=48;vv=[];ff=[]
        for rx,ry,z in [(.29,.19,.92),(.25,.155,.905),(.14,.085,.785)]:
            for i in range(n):a=math.tau*i/n;vv.append((rx*math.cos(a),ry*math.sin(a)-.03,z))
        for j in range(2):
            for i in range(n):ff.append((j*n+i,j*n+(i+1)%n,(j+1)*n+(i+1)%n,(j+1)*n+i))
        ff.append(tuple(range(2*n,3*n)));c.mesh('Inset porcelain basin',vv,ff,m['ceramic'],True)
        c.path('Basin mixer',[[(0,.16,.925),(0,.16,1.11),(0,.075,1.13),(0,.025,1.09)]],.017,m['chrome'])

    def vanity(c,length=1.60,washer=False,oval=False):
        n=4;w=length/n
        for x in [-length/2+.013,length/2-.013]:c.box('Vanity cabinet side',(x,0,.45),(.026,.53,.82),m['bath_wood'])
        c.box('Vanity cabinet back',(0,.25,.43),(length-.04,.026,.78),m['bath_wood'])
        c.box('Vanity cabinet bottom',(0,0,.07),(length-.04,.52,.035),m['bath_wood'])
        for i in range(n):
            x=(i-1.5)*w
            if washer and x<-.25:continue
            # Hollow carcass: a solid cabinet proxy would fill the sink cavity.
            c.box('Walnut vanity door',(x,-.257,.45),(w-.008,.035,.82),m['bath_wood'])
            c.box('Vanity door inset',(x,-.278,.47),(w-.08,.021,.62),m['wood_honey'],.009)
            c.sphere('Vanity brass pull',(x+.10,-.30,.71),(.02,.02,.02),m['brass'],2)
        # One continuous countertop ring with an elliptical basin cutout. The
        # previous four strips left dark rectangular gaps beside the oval bowl.
        angles=sorted(set([math.tau*i/96 for i in range(96)]+[(math.atan2(y,x)%math.tau) for x in [-length/2,length/2] for y in [-.275,.315]]))
        vv=[];ff=[]
        for a in angles:
            dx,dy=math.cos(a),math.sin(a)
            r=min(length/2/max(abs(dx),1e-9),(.315 if dy>=0 else .275)/max(abs(dy),1e-9))
            vv.extend([(dx*r,dy*r-.03,.918),(.288*dx,.188*dy-.03,.918)])
        for i in range(len(angles)):
            j=(i+1)%len(angles);ff.append((2*i,2*j,2*j+1,2*i+1))
        counter=c.mesh('Continuous basin countertop',vv,ff,m['bath_cream'])
        counter.modifiers.new('Stone countertop thickness','SOLIDIFY').thickness=.045
        bevel=counter.modifiers.new('Polished countertop edge','BEVEL');bevel.width=.003;bevel.segments=2
        basin(c)
        if oval:
            vv=[(0,.25,1.60)]+[(.36*math.cos(math.tau*i/64),.25,1.60+.43*math.sin(math.tau*i/64)) for i in range(64)]
            c.mesh('Oval wall mirror',vv,[(0,i+1,(i+1)%64+1) for i in range(64)],m['bath_mirror'])
            c.path('Oval gilt mirror frame',[[(.38*math.cos(math.tau*i/64),.23,1.60+.45*math.sin(math.tau*i/64)) for i in range(65)]],.024,m['brass'])
        else:
            c.box('Bathroom mirror',(0,.255,1.57),(.67,.016,.80),m['bath_mirror'],0)
            for x in [-.365,.365]:c.box('Mirror walnut frame',(x,.23,1.57),(.052,.04,.89),m['bath_wood'])
            for z in [1.125,2.015]:c.box('Mirror walnut frame',(0,.23,z),(.78,.04,.055),m['bath_wood'])
        if washer:
            c.box('Undercounter washing machine',(-.51,-.015,.425),(.59,.54,.82),m['ceramic'],.025)
            c.box('Washing machine control strip',(-.51,-.30,.72),(.53,.025,.09),m['white_trim'])
            c.sphere('Washing machine porthole',(-.51,-.30,.40),(.215,.032,.215),m['chrome'],3)
            c.sphere('Washing machine dark glass',(-.51,-.329,.40),(.165,.018,.165),m['black'],3)
        # Wall sconces follow the reference rather than adding invisible fill geometry.
        for x in [-length*.37,length*.37]:
            c.sphere('Bathroom opal wall light',(x,.20,2.28),(.10,.075,.10),m['bulb_warm'],2)
            area_light('Bathroom mirror sconce',c.point((x,.10,2.28)),c.point((x,-.8,1.3)),15,.16,cols['lights'],(1,.94,.85))

    def toilet(c):
        c.sphere('WC pedestal',(0,0,.22),(.16,.22,.20),m['ceramic'],2)
        c.sphere('WC bowl',(0,-.12,.37),(.20,.31,.20),m['ceramic'],3)
        c.sphere('WC closed seat',(0,-.17,.54),(.195,.26,.025),m['ceramic'],3)
        c.box('WC cistern',(0,.18,.71),(.38,.18,.42),m['ceramic'],.045)
        c.sphere('WC flush',(0,.18,.935),(.034,.028,.007),m['chrome'],2)
    def radiator(c,n=9):
        for i in range(n):c.box('Bathroom radiator fin',((i-(n-1)/2)*.065,0,.57),(.044,.07,.70),m['ceramic'],.016)
        for z in [.23,.91]:c.path('Radiator manifold',[[(-n*.031,0,z),(n*.031,0,z)]],.014,m['ceramic'])

    master=clear_room('Master bathroom');shared=clear_room('Shared bathroom')
    z=6.3714
    vanity(Local(master,(.615,7.55,z),90),1.78)
    shower(Local(master,(3.01,8.93,z),180),1.10,True)
    toilet(Local(master,(2.75,6.74,z),-90))
    radiator(Local(master,(2.91,7.30,z),-90),8)
    c=Local(master)
    c.box('Tall bathroom cabinet',(.61,8.68,z+1.16),(.52,.48,2.30),m['bath_wood'],.018)
    c.box('Master bathroom cream floor',(1.719,7.595,z+.012),(2.788,2.88,.019),creamfloor,0)
    c.box('Master blue bathmat',(1.33,7.30,z+.029),(.64,1.25,.017),m['blue_fabric'],.025)
    vanity(Local(shared,(2.23,-2.68,z),90),1.72,True,True)
    shower(Local(shared,(3.84,-3.92,z),90),1.08)
    toilet(Local(shared,(3.60,-1.15,z),-90))
    radiator(Local(shared,(3.16,-.655,z)),8)
    c=Local(shared)
    c.box('Shared bathroom checker floor',(2.94,-2.30,z+.012),(1.98,3.44,.019),checker,0)
    c.box('Shared blue bathmat',(2.97,-2.44,z+.029),(.55,1.1,.017),m['blue_fabric'],.025)
    # Lower wall cladding, avoiding the northwest entry and above-counter window.
    for p,size in [((1.956,-2.85,z+.56),(.008,2.32,1.10)),((3.925,-2.30,z+.56),(.008,3.43,1.10)),((2.94,-4.015,z+.56),(1.97,.008,1.10))]:
        c.box('Shared terracotta wall dado',p,size,m['bath_red'],0)
        pp=list(p);pp[2]=z+1.125;ss=list(size);ss[2]=.034;c.box('Shared cream tile border',pp,ss,m['bath_cream'],0)
    for col,ref in [(master,'kat_3_master_bedroom'),(shared,'kat_3_banyok')]:
        for o in col.all_objects:metadata(o,'photo_plan_interpreted',ref,floor_index=2,dimension_label_allowed=False)
    camera('13_master_bathroom',(1.45,6.41,7.99),(1.62,8.32,7.53),14,cols['cameras'])
    camera('14_shared_bathroom',(2.30,-.94,7.99),(2.90,-3.2,7.43),14,cols['cameras'])
