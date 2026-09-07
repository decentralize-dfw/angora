"""Photo-positioned fixtures and a licensed, generic daylight environment.

Photographs identify fixture types; light power, color and sky orientation are
look-development choices, not measurements of installed electrical equipment.
"""
import bpy,math
from pathlib import Path
from blender_utils import area_light,metadata

def refine_lighting(m,cols):
    from photo_refinement import Local,reset_collection,chandelier
    groups={i:reset_collection('Photo room lighting F'+str(i),bpy.data.collections['F'+str(i)+'_Fittings']) for i in range(4)}
    def downlight(floor,p,power=30):
        c=Local(groups[floor],p)
        c.lathe('Recessed light bezel',(0,0,-.035),[(.045,0),(.078,0),(.080,.016),(.046,.018)],m['chrome'])
        c.sphere('Downlight diffuser',(0,0,-.018),(.044,.044,.010),m['bulb_warm'],2)
        area_light('Photographed ceiling downlight',c.point((0,0,-.045)),c.point((0,0,-2)),power,.09,cols['lights'],(1,.93,.84))
    def pendant(floor,p,power=65):
        c=Local(groups[floor],p)
        c.path('Pendant cord',[[(0,0,-.01),(0,0,-.51)]],.005,m['metal'])
        c.lathe('Fabric ceiling shade',(0,0,-.90),[(.23,0),(.235,.014),(.13,.40),(.128,.42)],m['lamp_shade'],48)
        c.sphere('Pendant bulb',(0,0,-.66),(.035,.035,.065),m['bulb_warm'],2)
        area_light('Photographed fabric pendant',c.point((0,0,-.91)),c.point((0,0,-2.5)),power,.39,cols['lights'],(1,.90,.77))
    def flush(floor,p,power=40):
        c=Local(groups[floor],p)
        c.lathe('Flush ceiling rim',(0,0,-.025),[(.14,0),(.14,.02),(.15,.03)],m['brass'],36)
        c.sphere('Opal ceiling diffuser',(0,0,-.037),(.133,.133,.063),m['bulb_warm'],2)
        area_light('Photographed opal fixture',c.point((0,0,-.11)),c.point((0,0,-2.4)),power,.24,cols['lights'],(1,.94,.86))
    # Two recessed lights illuminate the working L; a small chandelier hangs in
    # the adjoining breakfast bay in the kitchen photographs.
    for x,y in [(-4.1,-1.0),(-3.2,-2.85)]:downlight(1,(x,y,5.885),48)
    chandelier(Local(groups[1],(-.25,-3.05,5.885)),m,cols['lights'],3)
    # The southwest iron-bed room has bare candle bulbs; the south room a shade.
    chandelier(Local(groups[2],(-3.9,-2.0,8.975)),m,cols['lights'],3)
    pendant(2,(-.45,-3.0,8.975),62)
    for p,power in [((1.65,4.65,8.975),45),((1.65,7.55,8.975),65),((2.9,-2.3,8.975),60),((-.8,2.1,8.975),40)]:flush(2,p,power)
    for p in [(-3.5,.8,2.60),(-.9,2.5,2.60)]:flush(0,p,50)
    for p in [(5.7,.7,5.85),(5.7,4.7,5.85)]:flush(1,p,45)
    for i,p in enumerate([(-1.6,1.0,2.60),(-2.45,1.2,5.885)]):flush(i,p,30)
    # Existing nonphotographic fill lights are kept explicitly named as review aids.
    for floor,col in groups.items():
        for o in col.all_objects:metadata(o,'photo_interpreted_fixture','room photograph groups',floor_index=floor,dimension_label_allowed=False)
    for o in cols['lights'].all_objects:
        if o.type=='LIGHT':metadata(o,'render_lighting_assumption','room photographs; visual exposure matching',power_verified=False,dimension_label_allowed=False)
    scene=bpy.context.scene;nt=scene.world.node_tree
    env=nt.nodes.new('ShaderNodeTexEnvironment');env.name='CC0 partly cloudy daylight'
    path=Path(__file__).resolve().parents[1]/'assets/lighting/kloofendal_48d_partly_cloudy_puresky_1k.hdr'
    env.image=bpy.data.images.load(str(path),check_existing=True);env.image.pack()
    tex=nt.nodes.new('ShaderNodeTexCoord');mapping=nt.nodes.new('ShaderNodeMapping')
    mapping.inputs['Rotation'].default_value.z=math.radians(115)
    nt.links.new(tex.outputs['Generated'],mapping.inputs['Vector']);nt.links.new(mapping.outputs['Vector'],env.inputs['Vector'])
    bg=nt.nodes.get('Background');nt.links.new(env.outputs['Color'],bg.inputs['Color']);bg.inputs['Strength'].default_value=.55
    # The unclipped HDR already contains the sun; avoid a second sun direction.
    bpy.data.objects['Sun'].data.energy=0
    scene.view_settings.exposure=.65
    scene.world['source_reference']='https://polyhaven.com/a/kloofendal_48d_partly_cloudy_puresky'
    scene.world['license']='CC0';scene.world['site_sun_position_verified']=False
