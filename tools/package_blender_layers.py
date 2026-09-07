"""Package an editable master scene with linked, bounded-size Blender libraries.

This requires no privileged remote automation. Open the master to inspect the
whole villa, or open a library to edit its authored geometry directly.
"""
import bpy,json,re,hashlib,shutil,sys
from pathlib import Path

ROOT=Path(__file__).resolve().parents[1];OUT=ROOT/'build/blender';LAYERS=OUT/'layers'
LIMIT=11_500_000

def package():
    LAYERS.mkdir(parents=True,exist_ok=True)
    scene=bpy.context.scene;native=Path(bpy.data.filepath);source_sha=hashlib.sha256(native.read_bytes()).hexdigest()
    for path in sorted((ROOT/'tools').glob('*.py')):
        name='pipeline/'+path.name;text=bpy.data.texts.get(name) or bpy.data.texts.new(name);text.clear();text.write(path.read_text())
    text=bpy.data.texts.get('PROJECT_README.md') or bpy.data.texts.new('PROJECT_README.md');text.clear();text.write((ROOT/'README.md').read_text())
    backup=ROOT/'build/intermediate/angora21-monolithic.blend';backup.parent.mkdir(parents=True,exist_ok=True)
    if native.resolve()!=backup.resolve():shutil.copy2(native,backup)
    roots=[c for c in scene.collection.children if c.name[:2] in ['00','10','15','20','30','40','50']]
    root_flags={c.name:{'hide_render':c.hide_render,'hide_viewport':c.hide_viewport} for c in roots}
    original_objects={o for c in roots for o in c.all_objects};names={o.name for o in original_objects}
    source_vertex_total=sum(len(o.data.vertices) for o in original_objects if o.type=='MESH')
    records=[];layouts=[]
    # Share baked materials and repeated CAD meshes once. Without shared
    # libraries every room/vegetation shard would duplicate the same maps.
    mats=[m for m in bpy.data.materials if m.users and m.library is None]
    for mat in mats:
        if not mat.use_nodes or not mat.get('pbr_maps_json'):continue
        nt=mat.node_tree;keep=set()
        def upstream(node):
            if node in keep:return
            keep.add(node)
            for inp in node.inputs:
                for link in inp.links:upstream(link.from_node)
        for node in nt.nodes:
            if node.type=='OUTPUT_MATERIAL':upstream(node)
        for node in list(nt.nodes):
            if node not in keep:nt.nodes.remove(node)
    materials_path=LAYERS/'shared-materials.blend'
    bpy.data.libraries.write(str(materials_path),set(mats),path_remap='RELATIVE_ALL',fake_user=True,compress=True)
    if materials_path.stat().st_size>LIMIT:raise RuntimeError('Shared materials exceed the bounded library size')
    with bpy.data.libraries.load(str(materials_path),link=True,relative=False) as (data_from,data_to):data_to.materials=[m.name for m in mats]
    replacements={m.name:m for m in data_to.materials}
    for mat in mats:
        mat.user_remap(replacements[mat.name]);bpy.data.materials.remove(mat)
    shared_meshes=[m for m in bpy.data.meshes if m.users>1 and m.library is None]
    meshes_path=LAYERS/'shared-meshes.blend'
    for library in bpy.data.libraries:library.filepath=str(LAYERS/Path(library.filepath).name)
    bpy.data.libraries.write(str(meshes_path),set(shared_meshes),path_remap='RELATIVE_ALL',fake_user=True,compress=True)
    if meshes_path.stat().st_size>LIMIT:raise RuntimeError('Shared meshes exceed the bounded library size')
    with bpy.data.libraries.load(str(meshes_path),link=True,relative=False) as (data_from,data_to):data_to.meshes=[m.name for m in shared_meshes]
    replacements={m.name:m for m in data_to.meshes}
    for mesh in shared_meshes:
        mesh.user_remap(replacements[mesh.name]);bpy.data.meshes.remove(mesh)
    for path,kind in [(materials_path,'materials'),(meshes_path,'shared_meshes')]:
        records.append({'path':path.relative_to(ROOT).as_posix(),'bytes':path.stat().st_size,
                        'sha256':hashlib.sha256(path.read_bytes()).hexdigest(),'kind':kind})
    def save(path,col):
        # Blender's library writer can remap live Library paths; normalize them
        # before every write so an earlier shard cannot double the base folder.
        for library in bpy.data.libraries:library.filepath=str(LAYERS/Path(library.filepath).name)
        bpy.data.libraries.write(str(path),{col},path_remap='RELATIVE_ALL',fake_user=True,compress=True)
        return path.stat().st_size
    def weight(o):
        if o.data and o.data.library:return 30
        if o.type=='MESH':return len(o.data.vertices)+len(o.data.edges)*.3+len(o.data.polygons)*.3
        if o.type=='CURVE':return sum(len(s.points)+len(s.bezier_points)*3 for s in o.data.splines)*3
        return 30
    for i,col in enumerate(roots):
        slug=re.sub('[^a-z0-9]+','-',col.name.lower()).strip('-');path=LAYERS/(slug+'.blend')
        size=save(path,col)
        if size<=LIMIT:
            pieces=[(path,col.name)]
        else:
            path.unlink();pieces=[];groups=[];group=[];cost=0;seen=set()
            for o in sorted(col.all_objects,key=lambda x:x.name):
                w=weight(o) if not o.data or o.data.as_pointer() not in seen else 0
                if group and cost+w>250000:groups.append(group);group=[];cost=0;seen=set()
                group.append(o);cost+=w
                if o.data:seen.add(o.data.as_pointer())
            if group:groups.append(group)
            pending=list(groups);part=0
            while pending:
                group=pending.pop(0);name=col.name+' / part '+str(part+1).zfill(2)
                temp=bpy.data.collections.new(name)
                for o in group:temp.objects.link(o)
                path=LAYERS/(slug+'-'+str(part+1).zfill(2)+'.blend');size=save(path,temp)
                bpy.data.collections.remove(temp)
                if size>LIMIT:
                    path.unlink()
                    if len(group)==1:raise RuntimeError('Single object library exceeds transport limit: '+group[0].name)
                    mid=len(group)//2;pending=[group[:mid],group[mid:]]+pending;continue
                pieces.append((path,name));part+=1
        for path,name in pieces:
            records.append({'path':path.relative_to(ROOT).as_posix(),'bytes':path.stat().st_size,
                            'sha256':hashlib.sha256(path.read_bytes()).hexdigest(),'collection':name})
        layouts.append((col.name,pieces))
        print('LAYER_PACKAGE',col.name,len(pieces),sum(p.stat().st_size for p,n in pieces),flush=True)
    # Remove only geometry already saved in verified library files; camera,
    # lighting, world, render settings and embedded pipeline texts stay local.
    oldcols=set()
    def walk(c):
        oldcols.add(c)
        for child in c.children:walk(child)
    for c in roots:walk(c)
    for o in original_objects:bpy.data.objects.remove(o,do_unlink=True)
    for c in oldcols:bpy.data.collections.remove(c)
    bpy.data.orphans_purge(do_local_ids=True,do_linked_ids=False,do_recursive=True)
    for root_name,pieces in layouts:
        if len(pieces)>1:
            parent=bpy.data.collections.new(root_name);scene.collection.children.link(parent)
            for k,v in root_flags[root_name].items():setattr(parent,k,v)
        else:parent=None
        for path,name in pieces:
            with bpy.data.libraries.load(str(path),link=True,relative=False) as (data_from,data_to):
                if name not in data_from.collections:raise RuntimeError('Missing collection '+name)
                data_to.collections=[name]
            for c in data_to.collections:(parent or scene.collection).children.link(c)
    actual={o.name for o in scene.objects if o.type not in ['LIGHT','CAMERA']}
    if len(actual)<len(names):raise RuntimeError('Linked scene lost authored geometry objects')
    linked_vertex_total=sum(len(o.data.vertices) for o in scene.objects if o.type=='MESH')
    if linked_vertex_total!=source_vertex_total:raise RuntimeError('Linked scene vertex count changed: '+str((source_vertex_total,linked_vertex_total)))
    for library in bpy.data.libraries:library.filepath='//layers/'+Path(library.filepath).name
    scene['delivery_layout']='master_scene_with_linked_editable_libraries';scene['monolithic_source_sha256']=source_sha
    bpy.ops.wm.save_as_mainfile(filepath=str(OUT/'angora21-working.blend'),compress=True,relative_remap=False)
    manifest={'master':'build/blender/angora21-working.blend','master_sha256':hashlib.sha256((OUT/'angora21-working.blend').read_bytes()).hexdigest(),
              'source_monolithic_sha256':source_sha,'source_objects':len(names),'linked_scene_objects':len(actual),
              'source_vertices':source_vertex_total,'linked_vertices':linked_vertex_total,
              'files':records,'maximum_library_bytes':max(r['bytes'] for r in records),
              'usage':'Open the master with the layers folder alongside it. Geometry libraries are individually editable.',
              'automation_required':False}
    (OUT/'layer-manifest.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2))
    print('LAYER_DELIVERY_COMPLETE',len(records),(OUT/'angora21-working.blend').stat().st_size,flush=True)
if __name__=='__main__':package()
