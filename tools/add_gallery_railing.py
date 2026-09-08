"""Add photo-guided gallery ironwork to the fixed-fittings delivery library.

The gallery floor, opening and stair meshes remain untouched. Three editable
meshes group forged iron, brass details and profiled timber. Dimensions of the
ornament and handrail are photo inferences, not measured shop-drawing values.
"""
import bpy,json,math,hashlib
from pathlib import Path
from mathutils import Vector
ROOT=Path(__file__).resolve().parents[1]
FILE=ROOT/'build/blender/layers/20-fixed-fittings.blend'
assert Path(bpy.data.filepath).resolve()==FILE
layout=json.loads((ROOT/'build/cad/gallery-railing-layout.json').read_text())
assert hashlib.sha256((ROOT/'build/blender/layers/10-architecture.blend').read_bytes()).hexdigest()==layout['source_architecture_sha256']
name='Gallery guard | photo review R20'
old=bpy.data.collections.get(name)
if old:
    for obj in list(old.all_objects):
        assert obj.library is None
        data=obj.data
        bpy.data.objects.remove(obj,do_unlink=True)
        if data.users==0:bpy.data.meshes.remove(data)
    bpy.data.collections.remove(old)
col=bpy.data.collections.new(name);bpy.data.collections['F2_Fittings'].children.link(col)

class Geometry:
    def __init__(self,name,material):self.name=name;self.material=material;self.v=[];self.f=[];self.uv=[]
    def add(self,vertices,faces,uv=None):
        base=len(self.v);self.v.extend(vertices);self.f.extend(tuple(base+i for i in f) for f in faces)
        uv=uv or [(v[0],v[2]) for v in vertices]
        self.uv.extend(uv[i] for f in faces for i in f)
    def finish(self):
        mesh=bpy.data.meshes.new(self.name);mesh.from_pydata(self.v,[],self.f);mesh.update()
        mesh.materials.append(bpy.data.materials[self.material]);uv=mesh.uv_layers.new(name='UVMap')
        uv.data.foreach_set('uv',[x for pair in self.uv for x in pair])
        obj=bpy.data.objects.new(self.name,mesh);col.objects.link(obj)
        for key,value in {'floor_index':2,'evidence_status':'CAD_supported_photo_inferred_detail',
            'source_reference':'kat_3_hol photos 11.52.44 (6), (11), (15); build/cad/gallery-railing-layout.json',
            'dimension_label_allowed':False,'photo_match_approved':False,'review_revision':20,
            'category':'fixed_gallery_guard','handrail_height_status':'photo_proportions_inferred'}.items():obj[key]=value
        return obj

iron=Geometry('Gallery R20 | forged flat-bar scrolls','metal')
wood=Geometry('Gallery R20 | profiled timber handrails','antique_wood')
brass=Geometry('Gallery R20 | brass fixing accents','brass')

def box(g,center,size):
    c=Vector(center);x,y,z=[s/2 for s in size]
    v=[tuple(c+Vector(p)) for p in [(-x,-y,-z),(x,-y,-z),(x,y,-z),(-x,y,-z),(-x,-y,z),(x,-y,z),(x,y,z),(-x,y,z)]]
    g.add(v,[(3,2,1,0),(4,5,6,7),(0,1,5,4),(1,2,6,5),(2,3,7,6),(3,0,4,7)])

def rivet(center,r=.011):
    c=Vector(center);v=[];uv=[];rings=6;segments=12
    for j in range(rings+1):
        phi=math.pi*j/rings
        for i in range(segments):
            theta=math.tau*i/segments
            v.append(tuple(c+r*Vector((math.sin(phi)*math.cos(theta),math.sin(phi)*math.sin(theta),math.cos(phi)))))
            uv.append((i/segments,j/rings))
    f=[]
    for j in range(rings):
        for i in range(segments):
            a=j*segments+i;b=j*segments+(i+1)%segments
            f.append((a,b,b+segments,a+segments))
    brass.add(v,f,uv)

def bezier(points,steps=14):
    result=[points[0]];start=Vector(points[0])
    for j in range(1,len(points),3):
        a,b,end=[Vector(p) for p in points[j:j+3]]
        for i in range(1,steps+1):
            t=i/steps;result.append(tuple((1-t)**3*start+3*(1-t)**2*t*a+3*(1-t)*t*t*b+t**3*end))
        start=end
    return result

motif=bezier([(.5,.08),(.13,.02),(.015,.26),(.18,.46),
    (.31,.60),(.40,.54),(.44,.75),(.49,.95),(.20,.96),(.21,.78),
    (.22,.65),(.36,.65),(.35,.78),(.35,.86),(.27,.83),(.29,.77)])
small=bezier([(.04,.50),(.20,.03),(.91,.05),(.94,.54),
    (.98,.94),(.44,1.03),(.43,.62),(.42,.32),(.76,.32),(.73,.58)])
nodes=layout['nodes'];segments=[]
for index,(a,b) in enumerate(zip(nodes,nodes[1:])):
    start=Vector((*a['xy'],a['rail_base_z_m']));end=Vector((*b['xy'],b['rail_base_z_m']))
    direction=Vector((end.x-start.x,end.y-start.y,0));length=direction.length;direction.normalize()
    normal=Vector((-direction.y,direction.x,0));rise=(end.z-start.z)/length
    def point(u,z,offset=0):return start+direction*u+Vector((0,0,z+rise*u))+normal*offset
    def strip(path,width=.012,depth=.006):
        p=[Vector(q) for q in path];vertices=[];uv=[];travel=0
        for i,q in enumerate(p):
            tangent=p[min(i+1,len(p)-1)]-p[max(0,i-1)];tangent.normalize()
            perpendicular=Vector((-tangent.y,tangent.x))*width/2
            if i:travel+=(q-p[i-1]).length
            for sign,face in [(-1,-1),(1,-1),(1,1),(-1,1)]:
                r=q+perpendicular*sign;vertices.append(tuple(point(r.x,r.y,face*depth/2)));uv.append((travel,face*.5+.5))
        faces=[(3,2,1,0),tuple(4*(len(p)-1)+i for i in range(4))]
        faces.extend((4*i+j,4*i+(j+1)%4,4*(i+1)+(j+1)%4,4*(i+1)+j) for i in range(len(p)-1) for j in range(4))
        iron.add(vertices,faces,uv)
    # Forged top/bottom frame; the sloped segment follows the real lower treads.
    strip([(0,.12),(length,.12)],.020,.010);strip([(0,.90),(length,.90)],.020,.010)
    panel_count=max(1,round(length/1.35));panel=length/panel_count
    for k in range(panel_count):
        lo=k*panel+.045;width=panel-.09
        if k:strip([(k*panel,.10),(k*panel,.93)],.024,.018)
        for mirror in [False,True]:
            strip([(lo+width*(1-u if mirror else u),.12+.74*h) for u,h in motif])
            strip([(lo+width*(1-u if mirror else u),.12+.74*(1-h)) for u,h in motif],.010,.005)
        for j in range(3):
            strip([(lo+width*(j+u)/3,.90+.065*h) for u,h in small],.008,.005)
        for u,z in [(.50,.18),(.50,.49),(.50,.82),(.22,.47),(.78,.47)]:rivet(point(lo+u*width,z,-.008))
        # Small raised leaf silhouettes, matching the photographed floral iron.
        outline=[(0,0),(-.026,.018),(-.053,.039),(-.043,.063),(-.018,.049),(-.010,.083),(0,.105),(.017,.077),(.019,.048),(.045,.062),(.055,.039),(.038,.019)]
        for u,h,flip in [(.20,.62,1),(.80,.62,-1),(.32,.28,-1),(.68,.28,1)]:
            count=len(outline);v=[]
            for offset in [-.007,-.003]:
                v.extend(tuple(point(lo+u*width+flip*x,h+z,offset)) for x,z in outline)
                v.append(tuple(point(lo+u*width,h+.035,offset)))
            f=[(i,(i+1)%count,count) for i in range(count)]
            f.extend((count+1+i,2*count+1,count+1+(i+1)%count) for i in range(count))
            f.extend((i,count+1+i,count+1+(i+1)%count,(i+1)%count) for i in range(count))
            iron.add(v,f)
    def timber(profile,z):
        vertices=[tuple(point(u,z+h,n)) for u in [0,length] for n,h in profile];count=len(profile)
        faces=[tuple(range(count-1,-1,-1)),tuple(range(count,2*count))]
        faces.extend((i,(i+1)%count,(i+1)%count+count,i+count) for i in range(count))
        wood.add(vertices,faces,[(u/1.5,j/count) for u in [0,length] for j in range(count)])
    timber([(-.034,-.022),(-.039,-.007),(-.032,.008),(-.022,.022),(0,.027),(.022,.022),(.032,.008),(.039,-.007),(.034,-.022)],.985)
    if index<2:timber([(-.046,-.009),(-.046,.009),(.046,.009),(.046,-.009)],.014)
    segments.append({'index':index,'length_xy_m':length,'rise_m':end.z-start.z,'panels':panel_count})
for node in nodes:
    x,y=node['xy'];bottom=node['support_z_m'];top=node['rail_base_z_m']+.966
    box(iron,(x,y,(bottom+top)/2),(.027,.027,top-bottom))
    box(iron,(x,y,bottom+.004),(.060,.060,.008))
    for dx,dy in [(-.02,-.02),(.02,.02)]:rivet((x+dx,y+dy,bottom+.009),.005)
created=[g.finish() for g in [iron,wood,brass]]
col['source_evidence']='CAD-supported gallery rim and photographed ornamental guard'
col['dimension_label_allowed']=False
bpy.ops.wm.save_as_mainfile(filepath=str(FILE),compress=True,relative_remap=False)
report={**layout,'native_library':'build/blender/layers/20-fixed-fittings.blend',
 'native_library_sha256':hashlib.sha256(FILE.read_bytes()).hexdigest(),
 'segments':segments,'objects':[{'name':o.name,'vertices':len(o.data.vertices),'polygons':len(o.data.polygons),'material':o.data.materials[0].name} for o in created],
 'floor_geometry_changed':False,'stair_geometry_changed':False,'source_architecture_unchanged':True,
 'reuses_existing_packed_pbr_materials':True}
(ROOT/'build/gallery-railing-report.json').write_text(json.dumps(report,ensure_ascii=False,indent=2))
print('GALLERY_RAIL_ADDED',json.dumps(report,ensure_ascii=False),flush=True)
