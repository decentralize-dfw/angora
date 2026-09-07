"""Masterplan-based neighborhood and photo-inferred villa landscaping."""
import bpy,math,random
from mathutils import Vector
from mathutils.geometry import tessellate_polygon
from blender_utils import *

def build_landscape(m,cols,site):
    land=cols['land'];hood=cols['neighbors'];ext=cols['ext']
    pool=collection('Pool — photo inferred',land)
    planting=collection('Planting — photo inferred',land)
    approach=collection('Entrance and side gardens',land)
    buildings=[b for b in site['buildings'] if b['number']!=21]
    samples=[]
    for b in site['buildings']:
        p=b['footprint'][:-1];samples.append((sum(v[0] for v in p)/len(p),sum(v[1] for v in p)/len(p),b['base_z']-2.8))
    def height(x,y):
        weights=[1/max(16,(x-a)**2+(y-b)**2) for a,b,z in samples]
        return sum(w*s[2] for w,s in zip(weights,samples))/sum(weights)
    def solid_poly(name,xy,base,top,mat,col):
        if (Vector(xy[0])-Vector(xy[-1])).length<.001:xy=xy[:-1]
        n=len(xy);vv=[(x,y,base) for x,y in xy]+[(x,y,top) for x,y in xy]
        face=[tuple(range(n-1,-1,-1)),tuple(range(n,2*n))]
        face += [(i,(i+1)%n,(i+1)%n+n,i+n) for i in range(n)]
        return mesh(name,vv,face,mat,col)
    allp=[p for b in site['buildings'] for p in b['footprint']]
    xmin=min(p[0] for p in allp)-22;xmax=max(p[0] for p in allp)+22
    ymin=min(p[1] for p in allp)-22;ymax=max(p[1] for p in allp)+22
    n=36;v=[];f=[]
    cx,cy=site['pool']['center_xy'];w,d=site['pool']['inner_size_xy'];depth=site['pool']['depth']
    for j in range(n+1):
        for i in range(n+1):
            x=xmin+(xmax-xmin)*i/n;y=ymin+(ymax-ymin)*j/n
            z=height(x,y)-.55
            if -14<x<14 and -20<y<25:z=-.6
            v.append((x,y,z))
    for j in range(n):
        for i in range(n):
            a=j*(n+1)+i;face=(a,a+1,a+n+2,a+n+1)
            xx=[v[k][0] for k in face];yy=[v[k][1] for k in face]
            # Remove coarse terrain cells beneath the basin. Otherwise water
            # reveals a grass plane at -0.6 m instead of the inferred pool floor.
            overlaps_pool=(min(xx)<cx+w/2+.2 and max(xx)>cx-w/2-.2
                           and min(yy)<cy+d/2+.2 and max(yy)>cy-d/2-.2)
            if not overlaps_pool:f.append(face)
    terrain=mesh('Neighborhood terrain',v,f,m['grass'],hood)
    metadata(terrain,'interpolated_from_masterplan_sbk','ANGORA-.dwg')
    curb=[]
    for line in site['site_lines']:
        if line['layer']=='2D$PYOLBORDUR':
            pp=[(x,y,height(x,y)-.22) for x,y in line['points']]
            curb.append(pp)
    o=paths('Masterplan curb alignment',curb,.09,m['stone_tile'],hood)
    metadata(o,'cad_xy_interpolated_z','ANGORA-.dwg')
    # Interpreted centerlines between the source curbs. Original curb coordinates
    # remain separate; roadway widths are review values, never dimension labels.
    routes=[
        (5.5,[(83,121),(85,85),(88,49),(91,13),(94,-22),(100,-32)]),
        (5.3,[(88,23),(64,46),(39,51),(12,56)]),
        (5.5,[(-64,-16),(-32,-16),(4,-16),(18,-17),(31,-29),(44,-60),(45,-77),(29,-105),(13,-150)]),
        (5.3,[(-85,-49),(-48,-49),(-13,-49),(13,-43),(35,-39)]),
        (5.3,[(-109,-76),(-66,-76),(-26,-76),(17,-73),(44,-65)]),
        (8.0,[(146,135),(146,99),(150,51),(155,-9),(164,-18)]),
        (8.0,[(164,-26),(128,-35),(96,-48),(63,-64),(42,-105),(16,-155)])]
    for ri,(width,route) in enumerate(routes):
        pp=[]
        for a,b in zip(route,route[1:]):
            length=math.hypot(b[0]-a[0],b[1]-a[1]);count=max(2,int(length/3))
            for i in range(count):
                t=i/count;pp.append((a[0]*(1-t)+b[0]*t,a[1]*(1-t)+b[1]*t))
        pp.append(route[-1]);vv=[];ff=[]
        for i,(x,y) in enumerate(pp):
            a=pp[max(0,i-1)];b=pp[min(len(pp)-1,i+1)];dx=b[0]-a[0];dy=b[1]-a[1];ll=math.hypot(dx,dy)
            nx=-dy/ll*width/2;ny=dx/ll*width/2
            vv.extend([(x+nx,y+ny,height(x+nx,y+ny)-.40),(x-nx,y-ny,height(x-nx,y-ny)-.40)])
            if i:ff.append((2*i-2,2*i-1,2*i+1,2*i))
        road=mesh('Roadway '+str(ri+1),vv,ff,m['asphalt'],hood)
        metadata(road,'masterplan_interpreted_centerline','build/reference/masterplan-registration.png',width_status='inferred',width_m=width)
    # Neighbor footprints are CAD registered; all heights and unseen elevations remain inferred.
    for b in buildings:
        col=collection('Building '+str(b['number']),hood)
        xy=b['footprint'];base=b['base_z']-2.8;top=base+8.8
        o=solid_poly('Neighbor '+str(b['number'])+' shell',xy,base,top,m['neighbor_wall'],col)
        metadata(o,'cad_footprint_inferred_height','ANGORA-.dwg',source_handle=b['source_handle'],building_number=b['number'],height_status='inferred')
        xs=[p[0] for p in xy];ys=[p[1] for p in xy];x0=min(xs)-.35;x1=max(xs)+.35;y0=min(ys)-.35;y1=max(ys)+.35
        xm=(x0+x1)/2;rise=2.5
        roof=mesh('Neighbor roof',[(x0,y0,top),(x1,y0,top),(x1,y1,top),(x0,y1,top),(xm,y0+1.5,top+rise),(xm,y1-1.5,top+rise)],
                  [(0,1,4),(1,2,5,4),(2,3,5),(3,0,4,5)],m['neighbor_roof'],col)
        metadata(roof,'inferred','Exterior drone photos',building_number=b['number'])
        # Sparse window rhythm on long CAD edges; separate removable detail objects.
        for a,c in zip(xy,xy[1:]):
            dx=c[0]-a[0];dy=c[1]-a[1];length=math.hypot(dx,dy)
            if length<3.1:continue
            count=max(1,int(length/3.4));ang=math.atan2(dy,dx)
            for level in range(3):
                for i in range(count):
                    t=(i+1)/(count+1);x=a[0]+dx*t;y=a[1]+dy*t
                    box('Neighbor window',(x,y,base+level*2.9+1.55),(1.15,.035,1.30),m['wood_dark'],col,rotation=ang)
        # Vegetation group beside each plot, kept clear of the villa inspection area.
        cx=sum(xs)/len(xs);cy=sum(ys)/len(ys)
        if math.hypot(cx,cy)>30:
            sphere('Neighbor tree',(cx+7,cy+4,base+2),(1.7,1.7,2.5),m['foliage'],col,2)
    # Villa garden. Pool dimensions are photo estimates, deliberately not labelable.
    cx,cy=site['pool']['center_xy'];w,d=site['pool']['inner_size_xy'];depth=site['pool']['depth']
    # Leave a real hole under the pool water instead of covering it with terrain.
    for loc,size in [((-.5,8.5,-.28),(23,9,.5)),((-.5,21.3,-.28),(23,7.2,.5)),((-8.55,15.45,-.28),(6.3,4.6,.5)),((7.55,15.45,-.28),(6.3,4.6,.5))]:
        box('Rear garden soil',loc,size,m['soil'],land)
    # Butt adjoining strips to the coping bounds, with no unintended soil gaps.
    left,right=cx-w/2-.24,cx+w/2+.24
    near,far=cy-d/2-.24,cy+d/2+.24
    terraces=[((-.5,(8.25+near)/2,-.04),(19,near-8.25,.12)),
              ((-.5,(far+20.5)/2,-.04),(13.7,20.5-far,.12)),
              (((-7.35+left)/2,cy,-.04),(left+7.35,far-near,.12)),
              (((right+6.35)/2,cy,-.04),(6.35-right,far-near,.12))]
    for loc,size in terraces:
        box('Pool terrace',loc,size,m['stone_tile'],pool,.018)
    box('Pool basin floor',(cx,cy,-depth-.10),(w,d,.16),m['pool_tile'],pool)
    for loc,size in [((cx-w/2-.09,cy,-depth/2),(.18,d+.36,depth)),((cx+w/2+.09,cy,-depth/2),(.18,d+.36,depth)),((cx,cy-d/2-.09,-depth/2),(w,.18,depth)),((cx,cy+d/2+.09,-depth/2),(w,.18,depth))]:
        box('Pool lining',loc,size,m['pool_tile'],pool,.012)
    for loc,size in [((cx-w/2-.12,cy,.035),(.24,d+.48,.09)),((cx+w/2+.12,cy,.035),(.24,d+.48,.09)),((cx,cy-d/2-.12,.035),(w,.24,.09)),((cx,cy+d/2+.12,.035),(w,.24,.09))]:
        box('Pool coping',loc,size,m['white_trim'],pool,.015)
    water=box('Pool water',(cx,cy,-.17),(w-.035,d-.035,.022),m['water'],pool)
    for o in pool.all_objects:metadata(o,'photo_inferred','kat_1_bahce; asdf.jpeg',dimension_label_allowed=False)
    # Pool ladder with polished rails.
    for xx in [cx+w/2-.85,cx+w/2-.38]:
        pts=[(xx,cy+d/2+.4,.02),(xx,cy+d/2+.4,.65),(xx,cy+d/2+.16,.85),(xx,cy+d/2-.2,.75),(xx,cy+d/2-.32,-.8)]
        paths('Pool ladder rail',[pts],.022,m['chrome'],pool)
    for z in [-.25,-.5,-.75]:cylinder('Pool ladder step',(cx+w/2-.85,cy+d/2-.32,z),(cx+w/2-.38,cy+d/2-.32,z),.025,m['chrome'],pool)
    # Drone reference shows a green hipped canopy on the east side of the rear bay.
    for x in [.35,6.25]:cylinder('Canopy post',(x,11.5,0),(x,11.5,2.78),.045,m['wood_dark'],ext)
    canopy=mesh('Green rear canopy',[(.35,8.1,2.82),(6.25,8.1,2.82),(6.25,11.5,2.82),(.35,11.5,2.82),(1.7,9.8,3.42),(4.9,9.8,3.42)],[(0,1,5,4),(1,2,5),(2,3,4,5),(3,0,4)],m['canopy'],ext)
    metadata(canopy,'photo_inferred','kat_1_bahce')
    for a,b in [((.35,8.1,2.8),(6.25,8.1,2.8)),((.35,11.5,2.8),(6.25,11.5,2.8)),((.35,8.1,2.8),(.35,11.5,2.8)),((6.25,8.1,2.8),(6.25,11.5,2.8))]:cylinder('Canopy fascia',a,b,.05,m['metal'],ext)
    # Front entry and garage driveway connect to the source front-ground block.
    o=box('Front grade restored from CAD bounds',(-.3267,-6.1459,1.1271),(17.0128,9.4963,3.345),m['soil'],approach)
    metadata(o,'cad_bounds_reconstruction','ANGORA-.dwg / DORBAK',qa_status='ground profile needs photo review')
    box('Entry forecourt',(-.5,-13.1,2.74),(18,4.5,.12),m['stone_tile'],approach,.02)
    ramp=mesh('Garage approach',[(4.03,-8,2.82),(7.32,-8,2.82),(7.32,-1.42,3.1),(4.03,-1.42,3.1)],[(0,1,2,3)],m['stone_tile'],approach)
    metadata(ramp,'photo_plan_interpreted','kat_2_garaj')
    # Existing garage opening: source has the shell; slatted rolling door is photo-derived.
    for i in range(21):box('Garage roller slat',(5.675,-1.43,3.10+(i+.5)*.115),(3.,.06,.107),m['white_trim'],ext,.008)
    for x in [4.10,7.25]:box('Garage door side trim',(x,-1.45,4.30),(.10,.10,2.55),m['white_trim'],ext,.01)
    box('Garage door head trim',(5.675,-1.45,5.575),(3.25,.10,.10),m['white_trim'],ext,.01)
    for side in [-1,1]:
        x=side*8.85
        for i in range(16):
            y=7.5-i*.44;z=(i+1)*.175
            box('Side garden stair',(x,y,z-.08),(1.18,.45,.16),m['stone_tile'],approach,.008)
        for y in [-8,-4,0,4,8,12,16,20]:
            base=max(0,min(2.8,(7.5-y)*.25))
            box('Garden boundary wall',(side*11.1,y,base+.32),(.20,3.95,.64),m['white_trim'],land,.015)
    box('Front boundary wall',(-.2,-15.1,3.05),(19,.24,.56),m['stone_tile'],approach,.02)
    for x in [i*.32-9.5 for i in range(60)]:cylinder('Front iron fence',(x,-15.1,3.33),(x,-15.1,4.1),.015,m['metal'],approach)
    for z in [3.42,3.98]:cylinder('Fence rail',(-9.5,-15.1,z),(9.5,-15.1,z),.016,m['metal'],approach)
    # Landscape masses follow the photos; species and exact positions remain to be surveyed.
    def conifer(x,y,z,h=5):
        cylinder('Conifer trunk',(x,y,z),(x,y,z+h*.75),.10,m['wood_dark'],planting)
        for i in range(6):
            zz=z+h*(.25+i*.12);r=h*(.20-i*.025)
            cone('Evergreen crown',(x,y,zz),max(.12,r),h*.42,m['foliage'] if i%2 else m['foliage_light'],planting)
    for x,y,h in [(-9,3,7),(-9,12,6),(-9,20,7),(9,8,6),(9,18,7),(5,22,5),(-4,22,6)]:conifer(x,y,0,h)
    from vegetation import broadleaf_tree
    broadleaf_tree((-7.25,9.8,0),6.8,2.3,m,planting)
    for side in [-1,1]:
        for i in range(22):
            y=-11+i*1.5;z=max(0,min(2.8,(7.5-y)*.25))
            sphere('Hedge',(side*10.65,y,z+.85),(.75,.95,1.05),m['hedge'],planting,2)
    for i in range(13):sphere('Rear hedge',(-9.8+i*1.6,23.3,.8),(1.05,.85,1.1),m['hedge'],planting,2)
    for side in [-1,1]:
        box('Side lawn',(side*7.9,16,-.045),(2.1,10,.11),m['grass'],land)
        for i in range(16):
            x=side*(7.7+random.uniform(-.6,.6));y=10+random.random()*12
            sphere('Flower bed foliage',(x,y,.14),(.20,.20,.22),m['foliage_light'],planting)
            for j in range(3):sphere('Flower head',(x+random.uniform(-.12,.12),y+random.uniform(-.12,.12),.35+random.random()*.13),(.06,.06,.05),m['flower'],planting)
    # Photographic chimney crown, absent from source wire geometry.
    box('Chimney cap',(3.57,5.55,13.53),(.75,1.18,.14),m['white_trim'],ext,.02)
    for x in [3.30,3.84]:box('Chimney cap support',(x,5.55,13.77),(.09,.82,.4),m['white_trim'],ext,.015)
    box('Chimney crown',(3.57,5.55,14.02),(.88,1.3,.13),m['white_trim'],ext,.025)
