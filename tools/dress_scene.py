"""Photo-directed fittings, furniture placeholders and landscape. All inference is tagged."""
import bpy, math, random
from mathutils import Vector
from blender_utils import *

def dress(mats,cols,floors,site):
    random.seed(21)
    m=mats
    furniture_floors=[collection('F'+str(i)+'_Furniture',cols['furniture']) for i in range(4)]
    fixed_floors=[collection('F'+str(i)+'_Fittings',cols['fixed']) for i in range(4)]
    def room(name,origin,floor,angle=0,fixed=False):
        col=collection(name,fixed_floors[floor] if fixed else furniture_floors[floor])
        col['room']=name;col['floor_index']=floor;col['placeholder']=not fixed
        col['evidence_status']='photo_plan_interpretation'
        return col,Vector(origin),math.radians(angle)
    def place(ctx,name,p,size,mat='wood_honey',bevel=.012):
        col,origin,a=ctx;x,y,z=p
        loc=origin+Vector((math.cos(a)*x-math.sin(a)*y,math.sin(a)*x+math.cos(a)*y,z))
        o=box(name,loc,size,m[mat],col,bevel,a)
        o['placeholder']=col.get('placeholder',True);o['room']=col.get('room','');return o
    def rounded(ctx,name,p,size,mat='fabric'):
        return place(ctx,name,p,size,mat,min(.08,min(size)/4))
    def table(ctx,name,center=(0,0,0),size=(1.5,.85,.75),mat='wood_honey'):
        x,y,z=center;w,d,h=size
        place(ctx,name+' top',(x,y,z+h),(w,d,.07),mat,.025)
        for xx in [-w/2+.09,w/2-.09]:
            for yy in [-d/2+.09,d/2-.09]:place(ctx,name+' leg',(x+xx,y+yy,z+h/2),(.065,.065,h),mat,.009)
    def chair(ctx,center,rotation=0,mat='fabric'):
        x,y,z=center
        rounded(ctx,'Chair seat',(x,y,z+.47),(.48,.48,.11),mat)
        rounded(ctx,'Chair back',(x,y+.20,z+.77),(.46,.07,.55),mat)
        for xx in [-.18,.18]:
            for yy in [-.18,.18]:place(ctx,'Chair leg',(x+xx,y+yy,z+.23),(.04,.04,.46),'wood_dark',.005)
    def sofa(ctx,center=(0,0,0),width=2.15,mat='fabric'):
        x,y,z=center
        rounded(ctx,'Sofa base',(x,y,z+.30),(width,.88,.38),'wood_dark')
        rounded(ctx,'Sofa back',(x,y+.37,z+.71),(width,.20,.60),mat)
        for xx in [-width/2+.09,width/2-.09]:rounded(ctx,'Sofa arm',(x+xx,y,z+.56),(.18,.87,.43),mat)
        n=3 if width>1.7 else 2
        for i in range(n):
            xx=x+(i-(n-1)/2)*(width-.4)/n
            rounded(ctx,'Seat cushion',(xx,y-.08,z+.51),((width-.42)/n,.67,.15),mat)
            rounded(ctx,'Back cushion',(xx,y+.24,z+.76),((width-.42)/n,.17,.40),mat)
        for xx in [-width/2+.15,width/2-.15]:
            for yy in [-.3,.3]:place(ctx,'Sofa foot',(x+xx,y+yy,z+.09),(.08,.08,.18),'wood_dark',.01)
    def wardrobe(ctx,center,width=1.5,height=2.2,mat='wood_honey',depth=.60):
        x,y,z=center
        place(ctx,'Wardrobe carcass',(x,y,z+height/2),(width,depth,height),mat,.015)
        n=max(2,round(width/.5))
        for i in range(n):
            xx=x+(i-(n-1)/2)*width/n
            place(ctx,'Wardrobe door',(xx,y-depth/2-.012,z+height/2),(width/n-.012,.025,height-.06),mat,.006)
            place(ctx,'Wardrobe handle',(xx+width/n*.28,y-depth/2-.04,z+height*.48),(.014,.035,.15),'brass',.004)
    def dresser(ctx,center=(0,0,0),width=1.,height=.85,mirror=False):
        x,y,z=center
        place(ctx,'Dresser carcass',(x,y,z+height/2),(width,.47,height),'wood_honey',.018)
        for i in range(4):
            zz=z+.1+(i+.5)*(height-.16)/4
            place(ctx,'Drawer face',(x,y-.247,zz),(width-.05,.03,(height-.16)/4-.014),'wood_honey',.004)
            place(ctx,'Drawer pull',(x,y-.28,zz),(.14,.025,.012),'brass',.003)
        if mirror:
            place(ctx,'Mirror frame',(x,y+.10,z+height+.52),(width*.74,.065,1.0),'wood_honey',.03)
            place(ctx,'Mirror glass',(x,y+.06,z+height+.52),(width*.66,.014,.9),'chrome',.01)
    def lamp(ctx,p):
        x,y,z=p
        place(ctx,'Lamp base',(x,y,z+.035),(.19,.19,.07),'brass',.025)
        place(ctx,'Lamp stem',(x,y,z+.20),(.035,.035,.30),'brass',.01)
        place(ctx,'Lamp shade',(x,y,z+.4),(.31,.31,.27),'linen',.06)
    def bed(ctx,width=1.65):
        rounded(ctx,'Bed base',(0,0,.24),(width,2.03,.33),'wood_honey')
        rounded(ctx,'Mattress',(0,-.03,.49),(width-.03,1.97,.25),'linen')
        rounded(ctx,'Coverlet',(0,-.28,.64),(width+.02,1.43,.08),'linen')
        rounded(ctx,'Headboard',(0,.99,.73),(width+.14,.13,1.05),'wood_honey')
        for x in ([-width*.25,width*.25] if width>1.2 else [0]):rounded(ctx,'Pillow',(x,.58,.70),(width*.42,.48,.13),'linen')
        for x in [-width/2-.30,width/2+.30]:
            dresser(ctx,(x,.68,0),.46,.52);lamp(ctx,(x,.7,.55))
    def tv(ctx,p,width=.8):
        x,y,z=p;place(ctx,'Television',(x,y,z),(width,.055,width*.59),'black',.008)
        place(ctx,'TV stand',(x,y,z-width*.30-.05),(.3,.21,.025),'metal',.004)
    def rug(ctx,p,size):place(ctx,'Area rug',p,(*size,.012),'rug',.005)
    # Garden lounge and kitchen: terracotta floor, cream inlay, classical loose seating.
    c=room('Garden lounge',(-2.75,5.35,0),0)
    sofa(c,(-.3,1.38,0),2.25);sofa(c,(-.3,-1.4,0),1.45)
    table(c,'Coffee table',(-.3,0,0),(1.2,.7,.43));rug(c,(-.3,0,.02),(2.7,2.05))
    tv(c,(1.65,.4,1.0),.84)
    c=room('Garden dining',(-2.7,.05,0),0)
    table(c,'Dining table',(0,0,0),(1.55,.9,.74))
    for x in [-.5,.5]:chair(c,(x,.75,0));chair(c,(x,-.75,0))
    # Entry salon is a source split level, 30 cm below the entrance landing.
    c=room('Main lounge',(-3.5,6.25,2.7996),1)
    sofa(c,(0,.95,0),2.25);table(c,'Coffee table',(0,-.2,0),(1.15,.75,.44));rug(c,(0,-.2,.01),(2.7,2.1))
    c=room('Main lounge east',(.45,6.0,2.7996),1,90);sofa(c,(0,0,0),1.55)
    c=room('Main dining',(-2.5,3.85,2.7996),1)
    table(c,'Dining table',(0,0,0),(1.9,.92,.76),'wood_dark')
    for x in [-.64,0,.64]:chair(c,(x,.72,0));chair(c,(x,-.72,0))
    c=room('Display cabinet',(-5.03,5.25,2.7996),1,90)
    wardrobe(c,(0,0,0),1.5,2.05,'wood_dark',.38)
    # Master bed head faces the west wall as in the reference photos.
    c=room('Master bedroom',(-3.98,6.35,6.3714),2,90);bed(c)
    c=room('Master dressing furniture',(-3.5,4.19,6.3714),2,180);dresser(c,mirror=True)
    c=room('Master TV chest',(-2.33,7.78,6.3714),2);dresser(c,width=.66,height=1.08);tv(c,(0,0,1.39),.60)
    # Pleated sheer panels beside the master bedroom's north openings.
    c=room('Master curtains',(0,0,0),2,0,True)
    for x,w,zbottom,height in [(-3.1,.50,6.46,2.25),(-1.55,.45,6.46,2.25)]:
        vv=[];ff=[]
        for i in range(25):
            xx=x-w/2+i*w/24;y=7.91+.04*math.sin(i*math.pi/2)
            vv.extend([(xx,y,zbottom),(xx,y,zbottom+height)])
        for i in range(24):ff.append((2*i,2*i+2,2*i+3,2*i+1))
        o=mesh('Sheer curtain',vv,ff,m['linen'],c[0]);metadata(o,'photo_inferred','kat_3_master_bedroom')
    c=room('Walk-in closet',(2.74,4.65,6.3714),2,-90);wardrobe(c,(0,0,0),2.40,2.35)
    c=room('Southwest bedroom',(-3.90,-2.45,6.3714),2,90);bed(c,1.40)
    c=room('Southwest bedroom wardrobe',(-3.91,-.21,6.3714),2);wardrobe(c,(0,0,0),1.95,2.35,'linen',.55)
    c=room('South bedroom',(-.55,-3.65,6.3714),2,180);bed(c,1.50)
    c=room('South bedroom wardrobe',(1.43,-2.77,6.3714),2,-90);wardrobe(c,(0,0,0),2.14,2.35,'linen',.54)
    c=room('Upper hall',(-4.5,.45,6.3714),2);sofa(c,(0,0,0),1.4);table(c,'Hall table',(1.35,0,0),(.62,.62,.48))
    c=room('Attic lounge',(-4.6,1.15,9.4705),3,90);sofa(c,(0,0,0),1.95,'blue_fabric')
    c=room('Attic lounge table',(-3.2,1.15,9.4705),3);table(c,'Coffee table',(0,0,0),(.95,.55,.4));tv(c,(.7,.7,.88),.65)
    c=room('Attic north bedroom',(-2.02,6.5,9.4705),3,90);bed(c,1.40)
    c=room('Attic wardrobe',(-.5,6.25,9.4705),3,-90);wardrobe(c,(0,0,0),1.4,2.0,'linen',.55)
    c=room('Attic single bedroom',(.65,-2.7,9.4705),3,-90);bed(c,.95)
    c=room('Attic blue chest',(-2.6,-1.2,9.4705),3,90);place(c,'Blue chest',(0,0,.5),(.75,.46,1.0),'blue_fabric')
    # Kitchens and bathrooms are fixed objects, independent from removable furniture.
    def kitchen(name,origin,floor,length,angle=0,panel='wood_honey'):
        ctx=room(name,origin,floor,angle,True);n=round(length/.6);w=length/n
        for i in range(n):
            x=(i-(n-1)/2)*w
            place(ctx,'Base cabinet',(x,0,.43),(w-.012,.6,.84),panel,.012)
            place(ctx,'Door inset',(x,-.312,.46),(w-.085,.025,.61),panel,.005)
            place(ctx,'Cabinet handle',(x+w*.3,-.35,.72),(.013,.025,.13),'brass',.004)
            if i not in (n//2,n-1):
                place(ctx,'Upper cabinet',(x,.10,1.87),(w-.012,.36,.72),panel,.012)
                place(ctx,'Upper door inset',(x,-.09,1.87),(w-.085,.025,.62),panel,.005)
        place(ctx,'Stone countertop',(0,-.015,.885),(length+.04,.65,.045),'stone_tile',.012)
        place(ctx,'Tile backsplash',(0,.30,1.17),(length,.022,.52),'bath_tile',.004)
        place(ctx,'Stainless sink',(-length*.15,-.03,.915),(.53,.42,.045),'chrome',.05)
        place(ctx,'Tap stem',(-length*.15,.19,1.06),(.03,.03,.3),'chrome',.006)
        place(ctx,'Tap spout',(-length*.15,.12,1.20),(.03,.18,.03),'chrome',.006)
        place(ctx,'Cooktop',(length*.24,-.03,.917),(.57,.48,.025),'black',.012)
        place(ctx,'Oven',(length*.24,-.317,.46),(.56,.034,.56),'black',.02)
        place(ctx,'Extractor hood',(length*.24,.06,1.66),(.66,.48,.16),'chrome',.01)
        place(ctx,'Refrigerator',(-length/2-.40,.04,.98),(.70,.65,1.96),'chrome',.03)
    kitchen('Main kitchen',(-2.8,-4.63,3.0996),1,3.6,180)
    kitchen('Garden kitchen',(-5.15,1.25,0),0,2.4,90,'sage_panel')
    kitchen('Annex kitchenette',(6.95,5.3,0),0,1.8,-90)
    def bathroom(name,origin,floor,compact=False,shower=False,angle=0,shower_offset=(.5,-1.7)):
        ctx=room(name,origin,floor,angle,True)
        place(ctx,'Vanity',(0,0,.42),(.48 if compact else .82,.46,.80),'wood_honey',.025)
        rounded(ctx,'Basin',(0,-.02,.86),(.46 if compact else .76,.44,.13),'ceramic')
        place(ctx,'Basin tap',(0,.12,1.03),(.035,.035,.24),'chrome',.008)
        place(ctx,'Mirror',(0,.25,1.49),(.44 if compact else .7,.024,.75),'chrome',.02)
        x=.70 if compact else 1.0
        rounded(ctx,'WC bowl',(x,-.1,.31),(.36,.60,.35),'ceramic')
        rounded(ctx,'WC cistern',(x,.14,.65),(.37,.18,.46),'ceramic')
        rounded(ctx,'WC seat',(x,-.15,.51),(.37,.47,.04),'ceramic')
        if shower:
            x,y=shower_offset
            place(ctx,'Shower tray',(x,y,.08),(.9,.9,.16),'ceramic',.04)
            place(ctx,'Shower screen',(x,y-.42,1.10),(.87,.012,1.96),'glass',.002)
            place(ctx,'Shower side',(x+.42,y,1.10),(.012,.85,1.96),'glass',.002)
            place(ctx,'Shower rail',(x+.3,y+.39,1.38),(.025,.03,1.25),'chrome',.004)
            place(ctx,'Shower rose',(x+.3,y+.22,2.03),(.15,.21,.025),'chrome',.012)
    bathroom('Garden WC',(-1.6,1.0,0),0,True)
    bathroom('Entrance WC',(-2.45,1.2,3.0996),1,True)
    bathroom('Master bathroom',(.80,8.55,6.3714),2,False,True,shower_offset=(1.55,-.85))
    bathroom('Shared bathroom',(2.70,-.83,6.3714),2,False,True)
    bathroom('Attic bathroom',(.35,7.5,9.4705),3,False,True)
    # Lift shaft / mirrored cabin and landing doors. Final clearances require CAD review.
    c=room('Lift',(-.2,1.5,0),0,0,True)
    place(c,'Lift cabin floor',(0,0,.04),(1.18,1.1,.08),'metal')
    place(c,'Lift mirror',(0,.52,1.12),(1.15,.025,2.15),'chrome')
    for i,z in enumerate([0,3.0996,6.3714,9.4705]):
        c=room('Lift landing '+str(i),(-.2,1.03,z),i,0,True)
        place(c,'Lift door',(0,0,1.05),(.90,.04,2.10),'chrome',.003)
        place(c,'Call panel',(.55,-.035,1.13),(.11,.026,.24),'metal',.01)
    for floor,z in enumerate([0,3.0996,6.3714,9.4705]):
        area_light('Interior fill '+str(floor),(-1,3.7,z+2.35),(-1,4,z),75,2.5,cols['lights'])
    area_light('Main lounge chandelier',(-2.7,5.4,5.60),(-2.7,5.4,2.8),110,1.2,cols['lights'],(1,.91,.78))
    area_light('Master ceiling light',(-3.2,6.0,8.96),(-3.2,6.0,6.4),80,1.0,cols['lights'],(1,.94,.87))
    area_light('Attic ceiling light',(-3.1,1.4,11.65),(-3.1,1.4,9.5),70,.8,cols['lights'],(1,.94,.87))
    # Simple chandelier and radiator placeholders from the room references.
    for floor,x,y,z in [(1,-2.7,5.4,5.90),(2,-3.2,6.,9.0)]:
        col=fixed_floors[floor]
        cylinder('Pendant stem',(x,y,z),(x,y,z-.5),.012,m['brass'],col)
        for i in range(5):
            a=i*2*math.pi/5;xx=x+math.cos(a)*.30;yy=y+math.sin(a)*.30
            cylinder('Chandelier arm',(x,y,z-.5),(xx,yy,z-.43),.009,m['brass'],col)
            sphere('Chandelier shade',(xx,yy,z-.39),(.07,.07,.10),m['ceramic'],col,2)
    for floor,origin,w,angle in [(1,(-4.0,-4.73,3.18),.8,0),(2,(-3.8,7.88,6.45),.85,0),(3,(-3.2,7.83,9.55),.65,0)]:
        c=room('Radiator '+str(floor),origin,floor,angle,True)
        for i in range(max(5,round(w/.065))):place(c,'Radiator fin',(-w/2+i*.065,0,.31),(.05,.085,.61),'ceramic',.01)
    from landscape import build_landscape
    build_landscape(mats,cols,site)
    for c in furniture_floors:
        for obj in c.all_objects:obj['placeholder']=True;obj['dimension_label_allowed']=False
