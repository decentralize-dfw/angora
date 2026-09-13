"""Run in the persistent native Blender review namespace."""
ROUT=ROOT/'build/qa/roads-native'
ROUT.mkdir(parents=True,exist_ok=True)
def road_report(name,data):
    (ROUT/name).write_text(json.dumps(data,ensure_ascii=False,indent=2),encoding='utf-8')
def inspect_roads_native():
    bpy.context.view_layer.update();rows=[]
    for o in SC.objects:
        if o.type!='MESH':continue
        lo,hi=bounds(o)
        if any(s in o.name.lower()for s in ('road','curb','sidewalk','path','driveway'))or (lo[1]<-4 and hi[1]>-11 and lo[2]<4.5 and hi[2]>3 and any(s in o.name.lower()for s in ('door','radiator','frame','threshold'))):
            rows.append({'name':o.name,'bounds':[lo,hi],'collections':[c.name for c in o.users_collection],'faces':len(o.data.polygons),'materials':[m.name for m in o.data.materials if m]})
    road_report('inventory-before.json',rows)
    stations=[]
    for x in np.arange(.4,3.01,.15):
        for y in np.arange(-7.2,-4.8,.15):
            floor=ray_info((float(x),float(y),3.5),(0,0,-1),.6);hits=[]
            for h in (.5,1.65):
                for d in ((1,0,0),(-1,0,0),(0,1,0),(0,-1,0)):
                    hit=ray_info((float(x),float(y),3.0996+h),d,.3)
                    if hit:hits.append(hit['object'])
            stations.append({'x':float(x),'y':float(y),'floor':floor,'hits':hits})
    road_report('porch-grid-before.json',stations)
    road_report('front-ground-samples-before.json',[{'xy':[float(x),float(y)],'hit':ray_info((float(x),float(y),6),(0,0,-1),5)}for x in np.arange(-12,15,1)for y in np.arange(-17,-9.5,.25)])
    GARDEN_CAMERAS['road-overview']=((18,-33,22),(-1,-10,2.8),30)
    GARDEN_CAMERAS['porch']=((3.0,-9.5,4.75),(1.5,-5.3,4.1),24)
    render_garden(['road-overview','porch'],'roads-before')
    print('ROAD INSPECTION',len(rows),len(stations))

def road_solid(name,points,mat):
    n=len(points);vs=points+[(x,y,z-.22)for x,y,z in points]
    fs=[tuple(range(n)),tuple(range(2*n-1,n-1,-1))]+[(i,(i+1)%n,(i+1)%n+n,i+n)for i in range(n)]
    o=garden_mesh(name,vs,fs,mat);o['roads_native_review']=True;return o

def repair_front_connections():
    if SC.get('roads_front_connections'):return
    road=bpy.data.objects['CAD roads — corrected block loops and arterials'];entry=bpy.data.objects['R33 | Connected coursed entry path'];drive=bpy.data.objects['R33 | Connected garage driveway']
    ramp_specs=[]
    for name,x0,x1,obj in [('Pedestrian',.35,1.8,entry),('Vehicle',3.09,6.97,drive)]:
        y0,y1=-11.20,-10.058
        zs=[garden_surface(road,x,y0,7)[2]+.008 for x in (x0,x1)]
        ze=[garden_surface(obj,min(x1-.001,max(x0+.001,x)),y1+.002,7)[2]for x in (x0,x1)]
        spec=[x0,x1,y0,y1,zs,ze];ramp_specs.append(spec)
        road_solid('Road | '+name+' continuous dropped kerb',[(x0,y0,zs[0]),(x1,y0,zs[1]),(x1,y1,ze[1]),(x0,y1,ze[0])],obj.data.materials[0])
    def grade(p,s):
        x0,x1,y0,y1,zs,ze=s;u=(p.x-x0)/(x1-x0);v=(p.y-y0)/(y1-y0)
        return (zs[0]*(1-u)+zs[1]*u)*(1-v)+(ze[0]*(1-u)+ze[1]*u)*v
    # Split retained top polygons at the two crossing outlines; preserve all outside grades.
    def half(poly,axis,value,positive):
        result=[]
        for a,b in zip(poly,poly[1:]+poly[:1]):
            aa=(a[axis]-value)*(1 if positive else -1);bb=(b[axis]-value)*(1 if positive else -1)
            if aa>=-1e-7:result.append(a.copy())
            if (aa>1e-7 and bb<-1e-7)or(aa<-1e-7 and bb>1e-7):result.append(a+(b-a)*(aa/(aa-bb)))
        return result
    soil=bpy.data.objects['R32 | Continuous local soil volume'];old=soil.data;old.use_fake_user=True;polys=[]
    for f in old.polygons:
        ps=[soil.matrix_world@old.vertices[i].co for i in f.vertices]
        if f.normal.z>.00001:polys.append((ps,f.material_index))
    for s in ramp_specs:
        updated=[];x0,x1,y0,y1,_,_=s
        for p,mi in polys:
            if max(v.x for v in p)<x0 or min(v.x for v in p)>x1 or max(v.y for v in p)<y0 or min(v.y for v in p)>y1:updated.append((p,mi));continue
            remainder=p
            for axis,value,positive in [(0,x0,True),(0,x1,False),(1,y0,True),(1,y1,False)]:
                outside=half(remainder,axis,value,not positive)
                if len(outside)>=3:updated.append((outside,mi))
                remainder=half(remainder,axis,value,positive)
                if len(remainder)<3:break
            if len(remainder)>=3:
                for pnt in remainder:pnt.z=min(pnt.z,grade(pnt,s)-.06)
                updated.append((remainder,mi))
        polys=updated
    vs=[];fs=[];mids=[]
    for p,mi in polys:
        clean=[]
        for v in p:
            if not clean or (v-clean[-1]).length>1e-6:clean.append(v)
        if len(clean)>2 and(clean[0]-clean[-1]).length<1e-6:clean.pop()
        if len(clean)<3:continue
        for i in range(1,len(clean)-1):
            q=[clean[0],clean[i],clean[i+1]]
            if(q[1]-q[0]).cross(q[2]-q[0]).length<1e-9:continue
            k=len(vs);vs.extend(q);vs.extend([Vector((v.x,v.y,-6))for v in q]);fs.extend([(k,k+1,k+2),(k+5,k+4,k+3),(k,k+3,k+4,k+1),(k+1,k+4,k+5,k+2),(k+2,k+5,k+3,k)]);mids.extend([mi,2,1,1,1])
    me=bpy.data.meshes.new('Road crossing fitted closed soil');inv=soil.matrix_world.inverted();me.from_pydata([inv@v for v in vs],[],fs);me.update()
    for m in old.materials:me.materials.append(m)
    for f,i in zip(me.polygons,mids):f.material_index=i
    uv=me.uv_layers.new(name='Physical soil coordinates')
    for f in me.polygons:
        for li in f.loop_indices:
            p=vs[me.loops[li].vertex_index];uv.data[li].uv=(p.x,p.y)if abs(f.normal.z)>.5 else(p.x+p.y,p.z)
    soil.data=me
    # Existing sidewalk and rounded curb descend through the same crossing width.
    lowered=[]
    for name in ('Front pedestrian sidewalk','CAD curb edges'):
        o=bpy.data.objects[name];old=o.data;old.use_fake_user=True;o.data=old.copy();inv=o.matrix_world.inverted();changed=0
        for v in o.data.vertices:
            p=o.matrix_world@v.co
            for s in ramp_specs:
                x0,x1,y0,y1,_,_=s
                if x0<=p.x<=x1 and y0<=p.y<=y1 and p.z>grade(p,s)-.05:
                    p.z=grade(p,s)-.055-abs(p.z-grade(p,s))*.035;v.co=inv@p;changed+=1;break
        lowered.append({'object':name,'vertices':changed})
    finish_front_porch(ramp_specs,lowered,len(fs)//5)

def finish_front_porch(ramp_specs=None,lowered=None,soil_cells=None):
    # A surface probe must be strictly inside the last triangle, not on its edge.
    entry=bpy.data.objects['R33 | Connected coursed entry path']
    mat=entry.data.materials[0];za=garden_surface(entry,1.798,-6.05,5)[2];zb=3.0996
    road_solid('Road | Porch turning approach',[(1.7999,-6.05,za),(2.99,-6.05,za),(2.99,-5.14,zb),(1.7999,-5.14,zb)],mat)
    road_solid('Road | Entrance threshold approach',[(1.4,-5.14,zb),(2.99,-5.14,zb),(2.99,-4.16299,3.0996),(1.4,-4.16299,3.0996)],mat)
    SC['roads_front_connections']=True;GARDEN_TREES.clear();bpy.context.view_layer.update();road_report('front-connections.json',{'ramps':ramp_specs,'lowered':lowered,'soil_closed_cells':soil_cells or len(bpy.data.objects['R32 | Continuous local soil volume'].data.polygons)//5,'porch_floor_completed':True});bpy.ops.wm.save_mainfile()

def check_front_routes():
    bpy.context.view_layer.update();records=[]
    paths={'pedestrian':[(1.08,-11.5),(1.08,-7.25),(.60,-6.95),(.60,-5.86),(2.39,-5.86),(2.39,-4.23)],'vehicle':[(5,-11.5),(5,-1.6)]}
    for name,points in paths.items():
        rows=[]
        for a,b in zip(points,points[1:]):
            count=math.ceil(math.dist(a,b)/.08)
            for j in range(count):
                t=j/count;x=a[0]*(1-t)+b[0]*t;y=a[1]*(1-t)+b[1]*t;floor=ray_info((x,y,4.6),(0,0,-1),2);hits=[]
                if floor:
                    z=floor['point'][2]
                    for h in (.3,1,1.65):
                        for d in ((1,0,0),(-1,0,0),(0,1,0),(0,-1,0)):
                            hit=ray_info((x,y,z+h),d,.26)
                            if hit:hits.append(hit)
                rows.append({'xy':[x,y],'floor':floor,'body_hits':hits})
        records.append({'route':name,'samples':len(rows),'missing_floor':sum(r['floor']is None for r in rows),'body_hit_samples':[r for r in rows if r['body_hits']],'max_floor_delta':max(abs(a['floor']['point'][2]-b['floor']['point'][2])for a,b in zip(rows,rows[1:])if a['floor']and b['floor']),'rows':rows})
    road_report('front-routes-qa.json',records);print('FRONT ROUTES',[(r['route'],r['missing_floor'],len(r['body_hit_samples']),r['max_floor_delta'])for r in records])
