"""Apply prepared R18 roads or terrain to the corresponding linked library."""
import bpy,json,sys,gzip
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1];sys.path.insert(0,str(ROOT/'tools'))
from apply_photo_review_patch import physical_uv
archive=ROOT/'build/cad/road-ground-r18.json.gz'
data=json.load(gzip.open(archive,'rt')) if archive.exists() else json.loads((ROOT/'build/intermediate/ground-correction-meshes.json').read_text())
assert not data['report']['building_intersections']
def upward_faces(part):
    points=part['vertices'];out=[]
    for f in part['faces']:
        a,b,c=[points[i] for i in f]
        signed=(b[0]-a[0])*(c[1]-a[1])-(b[1]-a[1])*(c[0]-a[0])
        if abs(signed)<1e-6:continue  # sub-mm slivers collapse at Blender float precision
        out.append(f if signed>0 else list(reversed(f)))
    return out
filename=Path(bpy.data.filepath).name
if filename=='50-neighborhood-03.blend':
    old=[o for o in bpy.data.objects if o.library is None and o.type=='MESH' and o.name.startswith(('Context road','Front road','CAD roads — corrected'))]
    assert old,'Road source objects not found'
    collection=old[0].users_collection[0];material=old[0].data.materials[0]
    part=data['roads'];mesh=bpy.data.meshes.new('CAD guided asphalt surface R18')
    mesh.from_pydata(part['vertices'],[],upward_faces(part));mesh.materials.append(material);mesh.update()
    obj=bpy.data.objects.new('CAD roads — corrected block loops and arterials',mesh);collection.objects.link(obj)
    for o in old:bpy.data.objects.remove(o,do_unlink=True)
elif filename=='50-neighborhood-10.blend':
    obj=next(o for o in bpy.data.objects if o.library is None and o.name.startswith('Terrain'))
    part=data['terrain'];mesh=bpy.data.meshes.new('CAD graded terrain — roads excluded R18')
    mesh.from_pydata(part['vertices'],[],upward_faces(part))
    for material in obj.data.materials:mesh.materials.append(material)
    mesh.update();obj.data=mesh
else:raise RuntimeError('Open the road or terrain library directly: '+filename)
obj['review_revision']=18;obj['geometry_evidence']='CAD curb edges and footprints; interpreted widths/grade interpolation'
obj['dimension_label_allowed']=False;obj['photo_match_approved']=False
physical_uv(obj)
bpy.ops.wm.save_as_mainfile(filepath=bpy.data.filepath,compress=True,relative_remap=False)
print('GROUND_CORRECTION_APPLIED',filename,len(mesh.vertices),len(mesh.polygons),flush=True)
