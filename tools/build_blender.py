"""Cloud Blender scene builder. Source archive -> layered editable villa checkpoint.

Run with Blender --background --python tools/build_blender.py -- [--dress] [--render]
"""
import bpy,bmesh,sys,json,gzip,math,collections,re
from pathlib import Path
from mathutils import Vector

ROOT=Path(__file__).resolve().parents[1]
sys.path.insert(0,str(ROOT/'tools'))
from blender_materials import palette
from blender_utils import *

def build():
    bpy.ops.wm.read_factory_settings(use_empty=True)
    scene=bpy.context.scene;scene.unit_settings.system='METRIC';scene.unit_settings.scale_length=1
    scene['project']='Angora villa 21 / MERGVS';scene['completion_status']='work_in_progress'
    scene['source']='ANGORA-.dwg; source SHA recorded in extraction-report.json'
    scene['verified_dimension_labels_only']=True
    raw=json.load(gzip.open(ROOT/'build/cad/surfaces.json.gz','rt'))
    site=json.loads((ROOT/'build/cad/site.json').read_text())
    mats=palette()
    cols={key:collection(name) for key,name in {
        'source':'00_SOURCE_REFERENCE','arch':'10_ARCHITECTURE','ext':'15_EXTERIOR_DETAILS',
        'fixed':'20_FIXED_FITTINGS','furniture':'30_FURNITURE_PLACEHOLDERS','land':'40_LANDSCAPE',
        'neighbors':'50_NEIGHBORHOOD','cameras':'90_CAMERAS','lights':'91_LIGHTING'}.items()}
    cols['source'].hide_render=True;cols['source'].hide_viewport=True
    floors=[collection(f'{i:02d}_{name}',cols['arch']) for i,name in enumerate(['Garden_level','Entrance_level','Bedrooms','Attic'])]
    floorz=raw['floor_z']; stats=[]
    def floor_of(z):return max(0,min(3,sum(z>=f-.09 for f in floorz)-1))
    def mat_for(name):
        upper=name.upper().replace(' ','')
        if 'CAM' in upper:return 'glass'
        if 'KORKULUK' in upper:return 'metal'
        if name=='DORBAK':return 'soil'
        if name=='ek dalgalar':return 'white_trim'
        if 'ALIN' in upper:return 'wood_dark'
        if 'ÇATI' in upper or 'CATI' in upper:return 'roof'
        if 'SHUTTER' in upper:return 'wood_dark'
        if 'ÇEPHE' in upper or 'CEPHEFRAME' in upper or 'CEPHEÇER' in upper:return 'white_trim'
        if 'KAPI' in upper or 'ÇERÇEVE' in upper:return 'wood_dark'
        if 'ZEM' in upper:return 'wood_floor' if ('KAT2' in upper or 'KAT3' in upper) else 'terra_floor'
        if 'TAVAN' in upper:return 'ceiling'
        if 'MERDİVEN' in upper:return 'wood_floor'
        return 'interior'
    for layer in raw['layers']:
        name=layer['source_layer'];material_key=mat_for(name)
        sourcev=layer.get('source_vertices',layer['vertices']);sourcee=layer.get('source_edges',layer.get('edges',[]))
        ref=mesh('SOURCE | '+name,sourcev,[],None,cols['source'],sourcee)
        metadata(ref,'cad_source','ANGORA-.dwg',source_layer=name)
        if layer['faces']:
            buckets=collections.defaultdict(list)
            # CAD floor ownership overrides height: the entrance lounge is a
            # split level at 2.80 m, below its 3.10 m entrance datum.
            source_floor=re.match(r'^KAT\s*([0-3])\$',name)
            for face in layer['faces']:
                z=sum(layer['vertices'][i][2] for i in face)/len(face)
                owner=int(source_floor.group(1)) if source_floor else floor_of(z)
                buckets[owner].append(face)
            for floor,faces in buckets.items():
                used=sorted({i for face in faces for i in face});remap={j:i for i,j in enumerate(used)}
                vertices=[layer['vertices'][i] for i in used]
                obj=mesh(f'F{floor} | {name}',vertices,[[remap[i] for i in face] for face in faces],mats[material_key],floors[floor])
                if material_key=='glass':
                    bm=bmesh.new();bm.from_mesh(obj.data);bmesh.ops.remove_doubles(bm,verts=list(bm.verts),dist=.0002)
                    bmesh.ops.recalc_face_normals(bm,faces=list(bm.faces));bm.to_mesh(obj.data);bm.free()
                metadata(obj,'cad_surface_reconstruction','ANGORA-.dwg',source_layer=name,floor_index=floor)
                obj['floor_assignment']='source_layer' if source_floor else 'height_inferred'
                obj['qa_status']='needs_photo_and_opening_review'
                obj.data.materials.append(mats['stucco']);obj.data.materials.append(mats['stone_tile'])
                obj.data.materials.append(mats['wood_floor'])
                # Exterior-facing surfaces are provisional until registered footprint review.
                if name.upper().endswith('$DUVAR'):
                    for p in obj.data.polygons:
                        x,y,z=p.center
                        if (abs(p.normal.z)<.1 and (x<-5.0 or x>3.17 or y<-4.85 or y>8.08)):
                            p.material_index=1
                if 'ZEM' in name.upper():
                    for p in obj.data.polygons:
                        x,y,z=p.center
                        if y>8.05 or x>3.4 or y<-5.05:p.material_index=2
                        elif name.startswith('KAT 1') and y>3.15 and x<3.25:p.material_index=3
            stats.append({'source_layer':name,'triangles':len(layer['faces']),'unresolved_edges':len(layer['unresolved'])})
        if layer['unresolved']:
            if 'KORKULUK' in name.upper():
                # Exact source paths for ironwork, section radius inferred from photos.
                obj=paths('Ironwork | '+name,layer.get('display_paths',[]),.006,mats['metal'],cols['ext'])
                metadata(obj,'cad_path_photo_section','ANGORA-.dwg',source_layer=name,section_radius_m=.006)
    master=paths('Masterplan curbs and walls',[[(p[0],p[1],0) for p in line['points']] for line in site['site_lines']],.025,mats['metal'],cols['source'])
    metadata(master,'cad_registered','ANGORA-.dwg')
    cams={}
    for name,pos,target,lens in [
      ('01_front',(23,-33,17),(.5,-1,5.5),48),('02_pool',(-10,41,22),(0,6,4),40),
      ('03_neighborhood',(100,105,95),(0,3,0),42),('04_garden_lounge',(1.75,7.25,1.6),(-3.3,4.8,1.15),20),
      ('05_main_lounge',(1.75,7.55,4.75),(-3.2,4.6,4.3),20),('06_master_bedroom',(-1.55,4.35,7.96),(-3.35,6.9,7.2),20),
      ('07_attic',(-.65,2.7,10.99),(-4.1,1.6,10.3),20)]:
        cams[name]=camera(name,pos,target,lens,cols['cameras'])
    cams['08_plan']=camera('08_plan',(0,0,55),(0,0,0),45,cols['cameras'],35)
    scene.camera=cams['02_pool']
    world=bpy.data.worlds.new('Daylight');world.use_nodes=True;scene.world=world
    nt=world.node_tree;sky=nt.nodes.new('ShaderNodeTexSky');sky.sky_type='NISHITA';sky.sun_elevation=math.radians(43);sky.sun_rotation=math.radians(130);sky.sun_disc=False
    nt.links.new(sky.outputs['Color'],nt.nodes.get('Background').inputs['Color']);nt.nodes.get('Background').inputs['Strength'].default_value=.15
    light=bpy.data.lights.new('Sun','SUN');light.energy=2.0;light.angle=math.radians(3)
    sun=bpy.data.objects.new('Sun',light);cols['lights'].objects.link(sun);sun.rotation_euler=(.5,-.4,-.7)
    scene.render.engine='CYCLES';scene.cycles.device='CPU';scene.cycles.samples=32;scene.cycles.use_denoising=True
    scene.cycles.max_bounces=8;scene.cycles.transparent_max_bounces=12;scene.cycles.transmission_bounces=8
    scene.render.resolution_x=1200;scene.render.resolution_y=900;scene.render.resolution_percentage=100
    if '--preview' in sys.argv:
        scene.render.resolution_x=960;scene.render.resolution_y=720;scene.cycles.samples=16
    scene.render.image_settings.file_format='PNG';scene.view_settings.view_transform='AgX'
    out=ROOT/'build'/'blender';out.mkdir(parents=True,exist_ok=True)
    scene['stage']='DWG surface recovery'
    bpy.ops.wm.save_as_mainfile(filepath=str(out/'angora21-source.blend'),compress=True)
    print('SAVED_SOURCE',flush=True)
    if '--dress' in sys.argv:
        from dress_scene import dress
        dress(mats,cols,floors,site)
        if '--detail' in sys.argv:
            from photo_refinement import refine
            refine(mats,cols)
        scene['stage']='Photo-directed architecture and furnishings WIP'
        # Drop unused proxy datablocks; the hidden CAD/source collection and
        # geometry-node tile prototype remain referenced and are retained.
        bpy.data.orphans_purge(do_local_ids=True,do_linked_ids=False,do_recursive=True)
        for path in sorted((ROOT/'tools').glob('*.py')):
            text=bpy.data.texts.new('pipeline/'+path.name);text.write(path.read_text())
        readme=bpy.data.texts.new('PROJECT_README.md');readme.write((ROOT/'README.md').read_text())
        bpy.ops.wm.save_as_mainfile(filepath=str(out/'angora21-working.blend'),compress=True)
        print('SAVED_WORKING',flush=True)
    report={'objects':len(bpy.data.objects),'collections':len(bpy.data.collections),'mesh_triangles_unique':sum(sum(len(p.vertices)-2 for p in m.polygons) for m in bpy.data.meshes),
        'cad_layers':stats,'stage':scene['stage'],'completion_status':'work_in_progress','camera_names':[o.name for o in scene.objects if o.type=='CAMERA'],
        'web_ready':False,'remaining':['Source openings and surface normals QA','Complete room-by-room dimensions and furniture placement QA','Photo color/texture match and web texture baking','Mobile performance validation']}
    (ROOT/'build'/'scene-report.json').write_text(json.dumps(report,ensure_ascii=False,indent=2))
    if '--render' in sys.argv:
        render=ROOT/'build'/'renders';render.mkdir(parents=True,exist_ok=True)
        names=['01_front','02_pool'] if '--dress' not in sys.argv else ['01_front','02_pool','03_neighborhood','05_main_lounge','06_master_bedroom']
        if '--detail' in sys.argv:names=['09_main_panorama','06_master_bedroom','10_main_kitchen','11_southwest_bedroom','12_garden_lounge','01_front','02_pool','03_neighborhood','05_main_lounge']
        for name in names:
            scene.camera=bpy.data.objects[name]
            scene.render.resolution_x=1440 if name=='09_main_panorama' else (960 if '--preview' in sys.argv else 1200)
            scene.render.resolution_y=600 if name=='09_main_panorama' else (720 if '--preview' in sys.argv else 900)
            scene.render.filepath=str(render/(name+'.png'));bpy.ops.render.render(write_still=True)
            print('RENDERED',name,flush=True)
    return report

if __name__=='__main__':print(json.dumps(build(),ensure_ascii=False),flush=True)
