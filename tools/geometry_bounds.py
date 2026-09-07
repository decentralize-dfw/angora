"""World extents of rendered vertices; Curve.bound_box can include control hull margins."""
import numpy as np

def geometry_bounds(objects,deps):
    low=np.full(3,np.inf);high=np.full(3,-np.inf)
    for obj in objects:
        evaluated=obj.evaluated_get(deps);mesh=evaluated.to_mesh()
        try:
            if not mesh or not mesh.loops:continue
            coords=np.empty(len(mesh.vertices)*3,dtype=np.float64)
            mesh.vertices.foreach_get('co',coords)
            indices=np.empty(len(mesh.loops),dtype=np.int32)
            mesh.loops.foreach_get('vertex_index',indices)
            coords=coords.reshape(-1,3)[np.unique(indices)]
            matrix=np.array(obj.matrix_world,dtype=np.float64)
            world=coords@matrix[:3,:3].T+matrix[:3,3]
            low=np.minimum(low,world.min(axis=0));high=np.maximum(high,world.max(axis=0))
        finally:evaluated.to_mesh_clear()
    return [low.tolist(),high.tolist()]
