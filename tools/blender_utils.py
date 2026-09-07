import bpy,bmesh,math
from mathutils import Vector

def collection(name,parent=None):
    c=bpy.data.collections.new(name);(parent or bpy.context.scene.collection).children.link(c);return c

def link(obj,col):
    for old in list(obj.users_collection):old.objects.unlink(obj)
    col.objects.link(obj);return obj

def metadata(obj,status='photo_inferred',source=None,**kwargs):
    obj['evidence_status']=status
    obj['dimension_label_allowed']=status=='verified_dimension'
    if source:obj['source_reference']=source
    for k,v in kwargs.items():obj[k]=v
    return obj

def box(name,location,size,mat,col,bevel=0,rotation=0):
    w,d,h=[v/2 for v in size]
    vv=[(-w,-d,-h),(w,-d,-h),(w,d,-h),(-w,d,-h),(-w,-d,h),(w,-d,h),(w,d,h),(-w,d,h)]
    ff=[(3,2,1,0),(4,5,6,7),(0,1,5,4),(1,2,6,5),(2,3,7,6),(3,0,4,7)]
    o=mesh(name,vv,ff,mat,col);o.location=location;o.rotation_euler.z=rotation
    if bevel:
        mod=o.modifiers.new('Edge softness','BEVEL');mod.width=bevel;mod.segments=2
        norm=o.modifiers.new('Weighted normals','WEIGHTED_NORMAL')
    metadata(o);return o

def cylinder(name,a,b,radius,mat,col,vertices=12):
    a=Vector(a);b=Vector(b);delta=b-a
    vv=[(radius*math.cos(2*math.pi*i/vertices),radius*math.sin(2*math.pi*i/vertices),z) for z in [-delta.length/2,delta.length/2] for i in range(vertices)]
    ff=[tuple(range(vertices-1,-1,-1)),tuple(range(vertices,2*vertices))]+[(i,(i+1)%vertices,(i+1)%vertices+vertices,i+vertices) for i in range(vertices)]
    o=mesh(name,vv,ff,mat,col);o.location=(a+b)/2;o.rotation_euler=delta.to_track_quat('Z','Y').to_euler()
    metadata(o);return o

def sphere(name,center,scale,mat,col,subdivisions=1):
    key=f'_Sphere_{subdivisions}_{mat.name if mat else "none"}'
    data=bpy.data.meshes.get(key)
    if data is None:
        data=bpy.data.meshes.new(key);bm=bmesh.new();bmesh.ops.create_icosphere(bm,subdivisions=subdivisions,radius=1);bm.to_mesh(data);bm.free()
        if mat:data.materials.append(mat)
        for p in data.polygons:p.use_smooth=True
    o=bpy.data.objects.new(name,data);col.objects.link(o);o.location=center;o.scale=scale
    metadata(o);return o

def cone(name,center,radius,depth,mat,col,vertices=11):
    vv=[(radius*math.cos(2*math.pi*i/vertices),radius*math.sin(2*math.pi*i/vertices),-depth/2) for i in range(vertices)]+[(0,0,depth/2)]
    ff=[tuple(range(vertices-1,-1,-1))]+[(i,(i+1)%vertices,vertices) for i in range(vertices)]
    o=mesh(name,vv,ff,mat,col);o.location=center;metadata(o);return o

def mesh(name,vertices,faces,mat,col,edges=None):
    data=bpy.data.meshes.new(name);data.from_pydata(vertices,edges or [],faces);data.update()
    o=bpy.data.objects.new(name,data);col.objects.link(o)
    if mat:data.materials.append(mat)
    return o

def paths(name,lines,bevel,mat,col):
    data=bpy.data.curves.new(name,'CURVE');data.dimensions='3D';data.resolution_u=1;data.bevel_depth=bevel;data.bevel_resolution=0
    for line in lines:
        if len(line)<2:continue
        s=data.splines.new('POLY');s.points.add(len(line)-1)
        for p,co in zip(s.points,line):p.co=(*co,1)
    o=bpy.data.objects.new(name,data);col.objects.link(o)
    if mat:data.materials.append(mat)
    return o

def camera(name,position,target,lens,col,ortho=None):
    data=bpy.data.cameras.new(name);data.lens=lens;data.clip_end=1000
    if ortho:data.type='ORTHO';data.ortho_scale=ortho
    o=bpy.data.objects.new(name,data);col.objects.link(o);o.location=position
    o.rotation_euler=(Vector(target)-o.location).to_track_quat('-Z','Y').to_euler();return o

def area_light(name,position,target,power,size,col,color=(1.,.91,.78)):
    data=bpy.data.lights.new(name,'AREA');data.energy=power;data.shape='DISK';data.size=size;data.color=color
    o=bpy.data.objects.new(name,data);col.objects.link(o);o.location=position
    o.rotation_euler=(Vector(target)-o.location).to_track_quat('-Z','Y').to_euler();return o
