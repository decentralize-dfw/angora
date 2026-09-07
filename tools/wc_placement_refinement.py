"""Place the two small WCs in their actual CAD rooms, clear of the lift core."""
import bpy,math,json
from pathlib import Path
from mathutils import Matrix,Vector
from photo_refinement import Local
from blender_utils import metadata,camera
ROOT=Path(__file__).resolve().parents[1]
REV='13-wc-cad-placement'

def refine_wc_placement():
    changes=[];garden=bpy.data.collections.get('Garden WC');entry=bpy.data.collections.get('Entrance WC')
    white=bpy.data.materials.get('ceramic');wood=bpy.data.materials.get('wood_honey');black=bpy.data.materials.get('metal');chrome=bpy.data.materials.get('chrome')
    if garden and garden.library is None and garden.get('wc_review_revision')!=REV:
        for o in list(garden.all_objects):bpy.data.objects.remove(o,do_unlink=True)
        c=Local(garden,(-.585,1.51,0),90)
        navy=bpy.data.materials.get('Garden charcoal furniture') or black
        c.box('B0 WC navy vanity',(0,0,.385),(.52,.43,.75),navy,.016)
        c.box('B0 WC timber counter',(0,0,.79),(.56,.47,.032),wood,.009)
        for x in [-.127,.127]:
            c.box('B0 WC cabinet door',(x,-.22,.385),(.246,.018,.70),navy,.003)
            c.path('B0 WC cabinet pull',[[(x,-.245,.54),(x,-.245,.67)]],.008,black)
        basin=c.lathe('B0 WC oval open basin',(0,0,.806),[(0,0),(.12,0),(.185,.035),(.215,.082),(.217,.095),(.201,.099),(.194,.075),(.163,.038),(.10,.024),(0,.024)],white,64)
        basin.scale=(1.12,.84,1)
        c.path('B0 WC curved tap',[[(0,.19,.82),(0,.19,1.04),(0,.12,1.10),(0,.035,1.07),(0,.035,1.025)]],.012,chrome)
        pts=[(.225*math.cos(a),.232,1.48+.345*math.sin(a)) for a in [i*math.tau/64 for i in range(65)]]
        c.path('B0 WC oval black mirror frame',[pts],.021,black)
        vv=[(0,.234,1.48)]+[(.212*math.cos(i*math.tau/64),.234,1.48+.331*math.sin(i*math.tau/64)) for i in range(64)]
        mirror=c.mesh('B0 WC oval mirror',vv,[(0,i+1,(i+1)%64+1) for i in range(64)],bpy.data.materials.get('Lift mirror') or chrome)
        t=Local(garden,(.40,1.47,0),180)
        bowl=t.lathe('B0 WC open ceramic bowl',(0,0,0),[(0,.06),(.08,.06),(.11,.17),(.175,.34),(.19,.44),(.164,.455),(.145,.416),(.075,.32),(0,.30)],white,64)
        bowl.scale=(.94,1.43,1)
        seat=t.lathe('B0 WC black seat',(0,0,.47),[(.148,0),(.194,0),(.194,.025),(.148,.025),(.148,0)],black,64)
        seat.scale=(.94,1.45,1)
        t.box('B0 WC cistern',(0,.30,.68),(.37,.17,.39),white,.03)
        t.sphere('B0 WC flush button',(0,.30,.881),(.025,.018,.006),chrome,2)
        for z in [1.17,1.64]:t.box('B0 WC black shelf',(0,.33,z),(.44,.13,.022),black,.004)
        for o in garden.all_objects:
            metadata(o,'CAD_B03_room_photo_interpreted_fixtures','ANGORA-.dwg; kat_1_bodrum_wc',floor_index=0,dimension_label_allowed=False)
            o['review_revision']=REV
        garden['wc_review_revision']=REV;changes.append('Garden WC moved into CAD B03 and rebuilt from five photographs')
    if entry and entry.library is None and entry.get('wc_review_revision')!=REV:
        old=Vector((-2.45,1.2,3.0996));new=Vector((3.65,-.95,3.0996))
        transform=Matrix.Translation(new)@Matrix.Rotation(-math.pi/2,4,'Z')@Matrix.Translation(-old)
        for o in entry.all_objects:
            o.matrix_world=transform@o.matrix_world
            o['source_reference']='ANGORA-.dwg / WC Z03; kat_2_giris_wc';o['review_revision']=REV
            o['dimension_label_allowed']=False
        entry['wc_review_revision']=REV;changes.append('Entrance WC moved into CAD Z03 east of entrance hall')
    # Move their original room lights out of the elevator shaft as well.
    for o in bpy.data.objects:
        if o.library is not None:continue
        if not o.name.startswith(('Flush ceiling rim','Opal ceiling diffuser','Photographed opal fixture')):continue
        p=o.location
        for old,new in [((-1.6,1.0),(-.04,1.52)),((-2.45,1.2),(3.55,-1.42))]:
            if abs(p.x-old[0])<.04 and abs(p.y-old[1])<.04:
                o.location.x+=new[0]-old[0];o.location.y+=new[1]-old[1]
    cams=bpy.data.collections.get('90_CAMERAS')
    if cams and cams.library is None and not bpy.data.objects.get('18_garden_wc'):
        camera('18_garden_wc',(-.30,2.78,1.58),(-.05,1.42,1.13),20,cams)
    return changes
