"""Compact crown volumes sampled from the authored foliage, at its location."""
import bpy,bmesh,numpy as np

def crown_lod(source,parent):
    # The authored broadleaf generator stores five vertices per folded leaf.
    # Sample those existing leaves; do not invent additional trees or grades.
    p=np.array([tuple(v.co) for v in source.data.vertices],dtype=float)
    if len(p)<40 or len(p)%5:return None
    centers=p.reshape(-1,5,3).mean(1)
    seeds=centers[np.linspace(0,len(centers)-1,9,dtype=int)].copy()
    for _ in range(9):
        membership=((centers[:,None]-seeds[None])**2).sum(2).argmin(1)
        for k in range(len(seeds)):
            if np.any(membership==k):seeds[k]=centers[membership==k].mean(0)
    vertices=[];faces=[]
    for k in range(len(seeds)):
        ids=np.flatnonzero(membership==k)
        if len(ids)<5:continue
        ids=ids[np.linspace(0,len(ids)-1,min(len(ids),100),dtype=int)]
        bm=bmesh.new()
        for point in centers[ids]:bm.verts.new(tuple(point))
        bmesh.ops.convex_hull(bm,input=list(bm.verts),use_existing_faces=False)
        bm.verts.ensure_lookup_table();bm.verts.index_update();offset=len(vertices)
        vertices.extend([tuple(v.co) for v in bm.verts]);faces.extend([tuple(offset+v.index for v in f.verts) for f in bm.faces]);bm.free()
    if not faces:return None
    me=bpy.data.meshes.new('Web crown sampled from '+source.name);me.from_pydata(vertices,[],faces);me.update()
    for mat in source.data.materials:me.materials.append(mat)
    for face in me.polygons:face.use_smooth=True;face.material_index=int(len(me.materials)>1 and face.index%7==0)
    obj=bpy.data.objects.new('Web crown | '+source.name,me);parent.objects.link(obj);obj.matrix_world=source.matrix_world.copy()
    obj['reference_status']='LOD_of_existing_authored_foliage';obj['source_object']=source.name
    return obj
