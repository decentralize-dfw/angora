"""CAD-graded terrain and neighboring villas using the source architectural family.

Masterplan footprints and level text are evidence. Neighbor elevations, planting,
and interpolation between grade annotations remain explicitly interpreted.
"""
import bpy,json,math,random,gzip
import numpy as np
from pathlib import Path
from mathutils import Vector,Matrix
from blender_utils import *
from blender_materials import material,tiles

ROOT=Path(__file__).resolve().parents[1]

def refine_site(m,cols):
    report=json.loads((ROOT/'build/cad/site-elevations.json').read_text())
    site=json.loads((ROOT/'build/cad/site.json').read_text())
    buildings=report['buildings'];hood=cols['neighbors'];land=cols['land']
    for o in list(hood.all_objects):bpy.data.objects.remove(o,do_unlink=True)
    for c in list(hood.children):bpy.data.collections.remove(c)
    m['retaining_stone']=material('Retaining wall rough limestone','9A9281',.89)
    tiles(m['retaining_stone'],'948B78','B0A998',(.53,.22),'777162',.008)
    m['front_paving']=material('Entrance coursed limestone','BCB8AC',.8)
    tiles(m['front_paving'],'B4B1A6','C9C5B9',(.68,.23),'8C897F',.006)
    m['green_roof']=material('Neighbor 20 green tiles','596D56',.8)
    tiles(m['green_roof'],'516549','687760',(.24,.36),'424A3A',.004)
    m['context_glass']=material('Context glazing','293A3E',.17,.05)
    samples=[t for t in report['levels'] if t['kind'] in ['TK','ROAD']]
    points=np.array([t['annotation_xy'] for t in samples]);zs=np.array([t['relative_to_garden_m'] for t in samples])
    road_samples=[t for t in report['levels'] if t['kind']=='ROAD']
    road_points=np.array([t['annotation_xy'] for t in road_samples]);road_z=np.array([t['relative_to_garden_m'] for t in road_samples])
    def interp(p,road=False):
        p=np.asarray(p).reshape(-1,2);pp=road_points if road else points;zz=road_z if road else zs
        d=((p[:,None,:]-pp[None,:,:])**2).sum(2)
        k=min(5,len(pp));ix=np.argpartition(d,k-1,axis=1)[:,:k]
        dd=np.take_along_axis(d,ix,axis=1);weights=1/np.maximum(.3,dd)**1.5
        return (weights*zz[ix]).sum(1)/weights.sum(1)
    transforms=[]
    for b in buildings:
        tr=b['typology_transform'];Q=np.array(tr['matrix_xy']);t=np.array(tr['translation_xy'])
        transforms.append((b,Q,t))
    def ground(xy):
        p=np.asarray(xy).reshape(-1,2);z=interp(p)-.16;raw_z=z.copy()
        best=np.full(len(p),1e12)
        for b,Q,t in transforms:
            loc=(p-t)@Q;xx=loc[:,0];yy=loc[:,1]
            # Terraced plot pads, with a front threshold protected from fill.
            mask=(xx>-7.6)&(xx<9.0)&(yy>-9.5)&(yy<22.2)
            score=(xx-.4)**2+(yy-4)**2
            use=mask&(score<best)
            grade=np.interp(yy,[-10,-4,1,4,8,22.2],[3.12,2.99,2.04,1.0,-.1,-.1])
            blend=np.clip(np.minimum.reduce([xx+7.6,9.0-xx,yy+9.5,22.2-yy])/2.0,0,1)
            z[use]=raw_z[use]*(1-blend[use])+(b['grade']['garden_base_z']+grade[use])*blend[use]
            best[use]=score[use]
        # 21's surveyed wall alignments are asymmetric. Retain the eastern
        # widening beside the pool; leave the pool basin physically open.
        x=p[:,0];y=p[:,1];east=10.518+np.maximum(0,y-5.39)*.985
        own=(x>-9.038)&(x<east)&(y>-10.058)&(y<24.2)
        z[own]=np.interp(y[own],[-10.058,-4,1,4,8,24.2],[3.12,2.99,2.04,1.,-.1,-.35])
        # Match the roadway elevation, not the nearest house floor.
        onroad=(x>-66)&(x<13.45)&(y>-16.21)&(y<-11.058)
        z[onroad]=interp(p[onroad],True)-.055
        return z
    allp=np.array([p for b in buildings for p in b['footprint']]);lo=allp.min(0)-25;hi=allp.max(0)+25
    gx=np.unique(np.r_[np.arange(lo[0],hi[0]+5,5),np.arange(-48,53,1.25),-64,13.453])
    gy=np.unique(np.r_[np.arange(lo[1],hi[1]+5,5),np.arange(-23,56,1.25),-16.208,-11.058])
    clipped=json.load(gzip.open(ROOT/'build/cad/terrain-mesh.json.gz','rt'))
    xy=np.array(clipped['vertices']);z=np.concatenate([ground(xy[i:i+512]) for i in range(0,len(xy),512)])
    vv=np.c_[xy,z].tolist();ff=clipped['faces']
    terrain=mesh('Terrain — CAD TK and road levels with terraced pads',vv,ff,m['grass'],hood)
    metadata(terrain,'CAD_levels_interpolated_between_annotations','build/cad/site-elevations.json',
             datum_absolute_m=1026.4,annotation_xy_is_surveyed=False)
    # The actual front road is 5.15 m between the source outer curbs.
    front=collection('CAD road and sidewalks',hood)
    def strip(name,route,width,mat,offset=0):
        pts=[]
        for a,b in zip(route,route[1:]):
            a=np.array(a);b=np.array(b);n=max(1,int(np.linalg.norm(b-a)/1.5))
            pts.extend([(a*(1-i/n)+b*i/n).tolist() for i in range(n)])
        pts.append(route[-1]);v=[];f=[]
        for i,p in enumerate(pts):
            d=np.array(pts[min(len(pts)-1,i+1)])-np.array(pts[max(0,i-1)])
            n=np.array([-d[1],d[0]])/np.linalg.norm(d)*width/2
            for q in [np.array(p)+n,np.array(p)-n]:v.append([*q,float(interp([q],True)[0])+offset])
            if i:f.append((2*i-2,2*i-1,2*i+1,2*i))
        o=mesh(name,v,f,mat,front);metadata(o,'CAD_road_levels_interpolated','ANGORA-.dwg',width_status='interpreted_except_front_CAD_curb_spacing')
    strip('Front road between CAD curbs',[[-64,-13.633],[13.453,-13.633],[22,-16],[31,-29],[44,-60],[45,-77],[29,-105],[13,-150]],5.15,m['asphalt'])
    strip('Front pedestrian sidewalk',[[-39,-10.558],[13.453,-10.558]],1.0,m['front_paving'],.12)
    for route,w in [([(83,121),(85,85),(88,49),(91,13),(94,-22),(100,-32)],5.5),
                    ([(88,23),(64,46),(39,51),(12,56)],5.3),
                    ([(-85,-49),(-48,-49),(-13,-49),(13,-43),(35,-39)],5.3),
                    ([(-109,-76),(-66,-76),(-26,-76),(17,-73),(44,-65)],5.3),
                    ([(146,135),(146,99),(150,51),(155,-9),(164,-18)],8),
                    ([(164,-26),(128,-35),(96,-48),(63,-64),(42,-105),(16,-155)],8)]:
        strip('Context road — interpreted between masterplan curbs',route,w,m['asphalt'])
    curbs=[]
    for l in site['site_lines']:
        if l['layer']!='2D$PYOLBORDUR':continue
        p=np.array(l['points']);center=p.mean(0)
        if center[1]<-10.8 or np.linalg.norm(center)>55:
            zz=interp(p,True)+.055;curbs.append([(*q,float(h)) for q,h in zip(p,zz)])
    o=paths('CAD curb edges',curbs,.065,m['stone_tile'],front)
    metadata(o,'CAD_XY_road_Z_interpolated','ANGORA-.dwg')
    # Linked architectural meshes preserve the neighborhood's actual villa
    # family: gables, bay projections, balconies, garage wings and chimneys.
    source=list(cols['arch'].all_objects)
    context_data={};near=[];grade_checks=[]
    for b,Q,t in transforms:
        if b['number']==21:continue
        number=b['number'];col=collection('Building '+str(number)+' — CAD typology',hood)
        base=b['grade']['garden_base_z'];T=Matrix(((Q[0,0],Q[0,1],0,t[0]),(Q[1,0],Q[1,1],0,t[1]),(0,0,1,base),(0,0,0,1)))
        distance=float(np.linalg.norm(t));is_near=distance<53
        grade_checks.append({'number':number,'garden_base_z':base,'status':b['grade']['garden_base_status'],
                             'family_fit_error_m':b['typology_transform']['footprint_hausdorff_m']})
        for src in source:
            layer=src.get('source_layer','');upper=layer.upper()
            if src.type!='MESH' or layer=='DORBAK' or 'MERDİVEN' in upper or layer.startswith('KAPI İÇ'):continue
            if not is_near and ('SHUTTER AİM' in upper or 'ZEMİN KAPLAMA' in upper or 'TAVAN' in upper):continue
            key=(src.data.name,number==20)
            data=context_data.get(key)
            if data is None:
                data=src.data.copy();data.name='Context family | '+src.data.name+(' green' if number==20 else '')
                if 'DUVAR' in upper:
                    data.materials.clear();data.materials.append(m['neighbor_wall'])
                    for p in data.polygons:p.material_index=0
                elif 'CAM' in upper:
                    data.materials.clear();data.materials.append(m['context_glass'])
                    for p in data.polygons:p.material_index=0
                elif number==20 and layer=='ÇATII':
                    data.materials.clear();data.materials.append(m['green_roof'])
                    for p in data.polygons:p.material_index=0
                context_data[key]=data
            obj=bpy.data.objects.new('B'+str(number)+' | '+layer,data);col.objects.link(obj);obj.matrix_world=T@src.matrix_world
            metadata(obj,'common_CAD_typology_inferred_neighbor_facades','ANGORA-.dwg; asdf.jpeg',building_number=number,
                     source_footprint_handle=b['source_handle'],garden_base_z=base,
                     facade_accuracy='photo_typology_not_exact_survey',dimension_label_allowed=False)
            if layer=='ÇATII' and is_near and number!=20:near.append(obj)
        # Solid foundations are wholly below each registered garden floor.
        p=b['footprint'][:-1];n=len(p)
        v=[(x,y,z) for z in [base-1.2,base-.02] for x,y in p]
        f=[tuple(range(n-1,-1,-1)),tuple(range(n,2*n))]+[(i,(i+1)%n,(i+1)%n+n,i+n) for i in range(n)]
        mesh('B'+str(number)+' foundation below BK',v,f,m['retaining_stone'],col)
        if is_near:
            from photo_refinement import Local
            # Dormers in the green-roof house visible on the pool-side drone.
            if number==20:
                for x in [-3.6,.5]:
                    p=T@Vector((x,6.9,10.85));obj=box('B20 rear dormer',p,(1.15,1.35,1.1),m['neighbor_wall'],col,.015)
                    obj.rotation_euler.z=math.atan2(Q[1,0],Q[0,0])
                    q=T@Vector((x,7.6,10.9));box('B20 dormer glass',q,(.83,.04,.73),m['context_glass'],col,.004)
            # A few irregular trees per plot; retained separately from house.
            from vegetation import broadleaf_tree
            for k,(x,y,h) in enumerate([(-6.7,16,5.5),(7.8,18,6.3)]):
                pp=Q@np.array([x,y])+t
                if np.linalg.norm(pp)<13:continue
                broadleaf_tree((float(pp[0]),float(pp[1]),base-.1),h,1.9,m,col)
    # Remove only the former ground assumptions; native source wire stays intact.
    bad=('Front grade restored','Entry forecourt','Garage approach','Side garden stair','Garden boundary wall',
         'Front boundary wall','Front iron fence','Fence rail','Front lawn','Entrance path','Rear garden soil','Side lawn',
         'Garden grass blades')
    for o in list(land.all_objects):
        if o.name.startswith(bad):bpy.data.objects.remove(o,do_unlink=True)
    # The drone shows lawn around a narrow pool deck, not an all-stone yard.
    poolcol=bpy.data.collections.get('Pool — photo inferred')
    for o in list(poolcol.all_objects):
        if o.name.startswith('Pool terrace'):bpy.data.objects.remove(o,do_unlink=True)
    for loc,size in [((-.5,11.0,-.045),(13.7,5.5,.11)),
                     ((-.5,18.3,-.045),(10.1,1.25,.11)),
                     ((-5.38,15.45,-.045),(1.25,4.50,.11)),
                     ((4.38,15.45,-.045),(1.25,4.50,.11))]:
        box('Pool terrace',loc,size,m['stone_tile'],poolcol,.012)
    # Replace planting at its former flat datum with plant bases on the graded
    # garden. The existing rear broadleaf tree remains in its source position.
    old=bpy.data.collections.get('Photo planting details')
    if old:
        for o in list(old.all_objects):bpy.data.objects.remove(o,do_unlink=True)
        bpy.data.collections.remove(old)
    from exterior_refinement import leaf_cloud,foliage_core,spruce,grass_patches
    planting=collection('Photo planting on corrected grades',land)
    centers=[]
    for y in np.arange(-8.8,22.5,1.15):
        x=-8.55;z=float(ground([[x,y]])[0]);centers.append(((x,float(y),z+.85),(.58,.78,.91),750))
        x=9.85+max(0,y-5.39)*.75;z=float(ground([[x,y]])[0]);centers.append(((x,float(y),z+.82),(.72,.82,.95),750))
    for x in np.arange(-7.9,10.1,1.3):centers.append(((float(x),23.7,.70),(.85,.73,.98),700))
    for x in np.arange(-7.8,-.1,1.05):centers.append(((float(x),-8.95,3.82),(.72,.72,.79),800))
    leaf_cloud('Hedge leaves on CAD grades',centers,m,planting,41)
    foliage_core('Hedge foliage on CAD grades',[(c,r) for c,r,n in centers],m,planting,95)
    for i,(x,y,h) in enumerate([(-7.75,-2,8.0),(-8.0,14,6.3),(-7.9,21.5,6.4),(9.4,7,6.3),(11.4,17.5,6.7)]):
        z=float(ground([[x,y]])[0]);spruce((x,y,z),h,m,planting,150+i)
    broadleaf_tree((2.4,-7.55,3.08),3.7,1.05,m,planting,seed=310)
    grass_patches([(-7.7,-8.6,.25,-5.6,3.10,180),(-7.7,14,-6.12,22,-.06,180),
                   (5.05,13.9,7.5,22,-.06,190),(-6.0,19.0,5.0,22.8,-.1,180)],m,planting)
    for o in cols['arch'].all_objects:
        if o.get('source_layer')=='DORBAK':o.hide_render=True;o.hide_set(True);o['qa_status']='superseded_by_CAD_TK_grading'
    approach=collection('CAD grade entrance and garden stairs',land)
    def paved_quad(name,points,mat):
        o=mesh(name,points,[(0,1,2,3)],mat,approach)
        metadata(o,'photo_layout_CAD_levels_interpreted','ANGORA-.dwg; '+str('WhatsApp Image 2026-08-27 at 20.32.54.jpeg'))
        return o
    paved_quad('Coursed entry path',[(.35,-10.06,3.23),(1.8,-10.06,3.23),(1.8,-5.14,3.09),(.35,-5.14,3.09)],m['front_paving'])
    paved_quad('Garage drive coursed stone',[(3.09,-10.91,3.74),(6.97,-10.91,3.98),(7.18,-1.43,3.09),(4.16,-1.43,3.09)],m['front_paving'])
    # Side stair flights connect the three source grade terraces.
    for x in [-6.42,8.12]:
        for flight,(y,z,risers) in enumerate([(7.6,0,6),(3.85,1.03,6),(.1,2.06,6)]):
            for i in range(risers):
                zz=z+(i+1)*(3.0996/18);yy=y-i*.32
                box('Garden stair tread',(x,yy,zz-.07),(1.12,.335,.14),m['stone_tile'],approach,.008)
            ztop=z+risers*3.0996/18
            box('Garden stair landing',(x,y-2.56,ztop-.07),(1.12,1.40,.14),m['stone_tile'],approach,.008)
            # White low retaining returns are visible in the side-garden photos.
            for side in [-1,1]:box('Stair flight white cheek',(x+side*.65,y-.85,z+.37),(.16,2.1,.74),m['white_trim'],approach,.01)
    # Real source wall center alignments; west drops to B20, east rises to B22.
    def wall(name,a,b,top_a,top_b,bottom_a,bottom_b,width=.4):
        a=np.array(a);b=np.array(b);d=b-a;n=np.array([-d[1],d[0]])/np.linalg.norm(d)*width/2
        v=[(*p,z) for p,z in [(a-n,bottom_a),(a+n,bottom_a),(b+n,bottom_b),(b-n,bottom_b),
                              (a-n,top_a),(a+n,top_a),(b+n,top_b),(b-n,top_b)]]
        o=mesh(name,v,[(0,3,2,1),(4,5,6,7),(0,1,5,4),(1,2,6,5),(2,3,7,6),(3,0,4,7)],m['retaining_stone'],approach)
        metadata(o,'CAD_wall_XY_interpreted_between_TK_labels','ANGORA-.dwg')
        paths(name+' cap',[[(a[0],a[1],top_a+.04),(b[0],b[1],top_b+.04)]],.09,m['stone_tile'],approach)
    for y0,y1 in [(-10.06,-4),(-4,1),(1,5),(5,10),(10,18.63)]:
        za=float(ground([[-8.9,y0]])[0]);zb=float(ground([[-8.9,y1]])[0])
        wall('West CAD retaining wall',[-9.24,y0],[-9.24,y1],za+.45,zb+.45,za-3.3,zb-3.3)
    wall('East elevated neighbor retaining wall',[10.72,-10.06],[10.72,5.30],5.45,4.0,2.6,-.2)
    wall('East diagonal CAD retaining wall',[10.72,5.30],[22.44,17.2],4.0,2.85,-.2,-.5)
    wall('Rear CAD retaining wall',[-9.44,28.86],[26.5,21.34],-.5,.15,-4,-3.5)
    # Front fence leaves the pedestrian and vehicle gate openings accessible.
    for x0,x1 in [(-9.04,.35),(1.8,3.09),(6.97,10.52)]:
        z0=3.2;wall('Front boundary stone plinth',[x0,-10.06],[x1,-10.06],z0+.35,z0+.35,z0-.45,z0-.45,.30)
        for x in np.arange(x0+.1,x1,.18):
            cylinder('Front wrought-iron picket',(float(x),-10.06,z0+.35),(float(x),-10.06,z0+1.05),.011,m['metal'],approach,8)
        for zz in [z0+.42,z0+.96]:cylinder('Front fence rail',(x0,-10.06,zz),(x1,-10.06,zz),.016,m['metal'],approach)
    for name,x0,x1,z in [('Pedestrian gate',.35,1.8,3.23),('Vehicle gate',3.09,6.97,3.4)]:
        for x in np.arange(x0+.08,x1,.15):cylinder(name+' picket',(float(x),-10.06,z),(float(x),-10.06,z+1.07),.012,m['metal'],approach,8)
        for zz in [z+.10,z+.96]:cylinder(name+' frame',(x0,-10.06,zz),(x1,-10.06,zz),.022,m['metal'],approach)
    for o in approach.all_objects:
        if 'source_reference' not in o:metadata(o,'photo_interpreted_CAD_grade_context','ANGORA-.dwg; kat_1_bahce')
    # Shift existing front hedge volumes/leaves together onto the corrected pad.
    # Their detailed placement remains a photo review item.
    camera('15_pool_grade_review',(-3,44,15),(0,4.5,4),39,cols['cameras'])
    (ROOT/'build/site-grade-report.json').write_text(json.dumps(dict(datum=report['datum'],buildings=grade_checks,
        villa_front_TK_z=3.3,villa_rear_TK_z=-.1,left_neighbor_BK_z=2.5,right_neighbor_BK_z=-3.0,
        right_neighbor_TK_z=-3.1,phase_complete=False,
        limitations=['Text insertion XY is approximate','Neighbor facades are source-family interpretations',
                     'Plot pad interpolation and unseen retaining-wall heights require photo review']),indent=2))
    print('SITE_GRADE_REFINED',len(buildings)-1,len(vv),flush=True)
