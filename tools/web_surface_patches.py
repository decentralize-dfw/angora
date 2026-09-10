"""Blender adapter for guarded, barycentric web-only skin partitioning."""
import bpy,gzip,json,hashlib,numpy as np
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
path=ROOT/'build/cad/web-surface-patches-r27.json.gz'
PATCHES=json.load(gzip.open(path,'rt')) if path.exists() else None
COUNTS={'villa_objects':0,'context_objects':0,'changed_triangles':0}

def patched_mesh(o,me,context=False):
    if PATCHES is None:return None
    candidate=PATCHES['villa'].get(o.name) if not context else True
    if not candidate:return None
    me.calc_loop_triangles()
    local=np.array([list(v.co) for v in me.vertices],dtype='<f4')
    faces=np.array([list(t.vertices) for t in me.loop_triangles],dtype='<i4')
    signature=hashlib.sha256(local.tobytes()+faces.tobytes()).hexdigest()
    if context:
        candidate=PATCHES['context_by_geometry'].get(signature)
        # The authored terrain is shared with the villa garden; it is not a
        # cloned building and keeps its exact, named ownership patch.
        if candidate is None and o.name.startswith(('Terrain','CAD roads','Front pedestrian')):
            candidate=PATCHES['villa'].get(o.name)
            if candidate:assert signature==candidate['geometry_sha256'],f'Stale terrain patch: {o.name}'
        if not candidate:return None
    else:assert signature==candidate['geometry_sha256'],f'Stale surface patch: {o.name}'
    uv=me.uv_layers.active;corner=me.corner_normals
    vertices=[];triangles=[];uvs=[];normals=[];materials=[];smooth=[];lookup={}
    for ti,t in enumerate(me.loop_triangles):
        bary=candidate['triangles'].get(str(ti),[[[1,0,0],[0,1,0],[0,0,1]]])
        positions=local[list(t.vertices)].astype(float)
        source_uv=np.array([list(uv.data[i].uv) if uv else [0,0] for i in t.loops])
        source_n=np.array([list(corner[i].vector) for i in t.loops])
        for weights in bary:
            weights=np.asarray(weights);p=weights@positions;tex=weights@source_uv;n=weights@source_n
            n/=np.maximum(np.linalg.norm(n,axis=1,keepdims=True),1e-15)
            ids=[]
            for point in p:
                key=tuple(np.round(point,8))
                if key not in lookup:lookup[key]=len(vertices);vertices.append(tuple(point))
                ids.append(lookup[key])
            if len(set(ids))<3:continue
            triangles.append(ids);uvs.extend(tex.tolist());normals.extend(n.tolist())
            materials.append(t.material_index);smooth.append(me.polygons[t.polygon_index].use_smooth)
    out=bpy.data.meshes.new('Partitioned web skin | '+o.name);out.from_pydata(vertices,[],triangles);out.update()
    for mat in me.materials:out.materials.append(mat)
    out.uv_layers.new(name='UVMap').data.foreach_set('uv',np.asarray(uvs).ravel())
    for p,m,s in zip(out.polygons,materials,smooth):p.material_index=m;p.use_smooth=s
    if normals:out.normals_split_custom_set(normals)
    COUNTS['context_objects' if context else 'villa_objects']+=1;COUNTS['changed_triangles']+=len(candidate['triangles'])
    return out
