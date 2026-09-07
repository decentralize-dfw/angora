"""Bounded photo review: pool joints, kitchen tilework, candle fixture and entry.

Apply to the editable monolithic source and the affected linked libraries.
Only local datablocks are modified. CAD wire geometry is always preserved.
"""
import bpy,json,math,sys,hashlib
from pathlib import Path
from mathutils import Vector
ROOT=Path(__file__).resolve().parents[1]
sys.path.insert(0,str(ROOT/'tools'))
from blender_utils import mesh,paths,cylinder,sphere,metadata
REV='12-pool-kitchen-photo-review'

def local(o):return o.library is None
def physical_uv(o):
    uv=o.data.uv_layers.active or o.data.uv_layers.new(name='UVMap')
    for face in o.data.polygons:
        mat=o.data.materials[face.material_index];repeat=mat.get('pbr_repeat_m',(1,1))
        axis=max(range(3),key=lambda i:abs(face.normal[i]));axes=[i for i in range(3) if i!=axis]
        for li in face.loop_indices:
            p=o.data.vertices[o.data.loops[li].vertex_index].co
            uv.data[li].uv=(p[axes[0]]/repeat[0],p[axes[1]]/repeat[1])

def fit_box(o,low,high):
    if not local(o):return False
    points=[o.matrix_world@v.co for v in o.data.vertices]
    oldlow=[min(v[i] for v in points) for i in range(3)];oldhigh=[max(v[i] for v in points) for i in range(3)]
    o.data=o.data.copy();inv=o.matrix_world.inverted()
    for v,p in zip(o.data.vertices,points):
        q=Vector([low[i]+(p[i]-oldlow[i])/(oldhigh[i]-oldlow[i])*(high[i]-low[i]) for i in range(3)])
        v.co=inv@q
    o.data.update();physical_uv(o);o['review_revision']=REV
    return True

def apply():
    changed=[];white=bpy.data.materials.get('white_trim');terra=bpy.data.materials.get('terra_floor')
    # Continuous coping interfaces. The former front slab projected into the
    # water and the narrower rear strip left corner recesses.
    bounds={
        'Pool terrace':([-7.35,8.25,-.31],[6.35,13.225,.02]),
        'Pool terrace.001':([-6.005,17.675,-.31],[5.005,18.925,.02]),
        'Pool terrace.002':([-6.005,13.21,-.31],[-4.725,17.70,.02]),
        'Pool terrace.003':([3.725,13.21,-.31],[5.005,17.70,.02])}
    for name,(low,high) in bounds.items():
        o=bpy.data.objects.get(name)
        if o and fit_box(o,low,high):changed.append(name)
    water=bpy.data.materials.get('water')
    if water and local(water):
        nt=water.node_tree;bs=next(n for n in nt.nodes if n.type=='BSDF_PRINCIPLED');out=next(n for n in nt.nodes if n.type=='OUTPUT_MATERIAL')
        light=nt.nodes.get('Pool shadow path') or nt.nodes.new('ShaderNodeLightPath');light.name='Pool shadow path'
        trans=nt.nodes.get('Pool transmitted shadow') or nt.nodes.new('ShaderNodeBsdfTransparent');trans.name='Pool transmitted shadow'
        mix=nt.nodes.get('Pool surface and transmitted shadow') or nt.nodes.new('ShaderNodeMixShader');mix.name='Pool surface and transmitted shadow'
        nt.links.new(light.outputs['Is Shadow Ray'],mix.inputs[0]);nt.links.new(bs.outputs['BSDF'],mix.inputs[1]);nt.links.new(trans.outputs[0],mix.inputs[2]);nt.links.new(mix.outputs[0],out.inputs['Surface'])
        water['shadow_transport']='transparent_shadow_approximation_without_caustic_bake'
        changed.append('water shadow transport')
    water_obj=bpy.data.objects.get('Pool water')
    if water_obj and local(water_obj):water_obj['cast_shadow']=False
    # Paint only CAD door faces at the photographed exterior entry; interior
    # timber doors and the source wire remain untouched.
    entry_faces=0
    for o in bpy.data.objects:
        if not local(o) or o.type!='MESH' or o.get('floor_index')!=1:continue
        if 'KAPI' not in o.get('source_layer','').upper():continue
        slot=next((i for i,m in enumerate(o.data.materials) if m==white),None)
        hits=[]
        for face in o.data.polygons:
            p=o.matrix_world@face.center
            if .20<p.x<2.25 and -5.45<p.y<-4.70 and 3.0<p.z<5.50:hits.append(face.index)
        if hits:
            o.data=o.data.copy()
            if slot is None:slot=len(o.data.materials);o.data.materials.append(white)
            for i in hits:o.data.polygons[i].material_index=slot
            entry_faces+=len(hits)
    if entry_faces:changed.append('white entry CAD faces: '+str(entry_faces))
    kitchen=bpy.data.collections.get('Photo kitchen — garden')
    if kitchen and local(kitchen):
        for o in list(kitchen.objects):
            if o.name.startswith('Review kitchen '):bpy.data.objects.remove(o,do_unlink=True)
        def tile_panel(name,axis,fixed,lo,hi,z0,z1):
            columns=round((hi-lo)/.105);rows=7;step=(hi-lo)/columns;dz=(z1-z0)/rows
            vv=[];ff=[];uvs=[]
            for row in range(rows):
                for col in range(columns):
                    a=lo+col*step+.0012;b=lo+(col+1)*step-.0012;c=z0+row*dz+.0012;d=z0+(row+1)*dz-.0012
                    pts=[(fixed,a,c),(fixed,b,c),(fixed,b,d),(fixed,a,d)] if axis==0 else [(a,fixed,c),(b,fixed,c),(b,fixed,d),(a,fixed,d)]
                    start=len(vv);vv.extend(pts);ff.append(tuple(start+i for i in ([0,1,2,3] if axis==0 else [3,2,1,0])))
                    # Sample tile interiors of the existing terracotta PBR
                    # atlas; joints are explicit geometry at the smaller size.
                    bx=.165+((col+row)%4)*.33;by=.165+((col*3+row)%4)*.33
                    u=(bx+by)/math.sqrt(2)/2.4;v=(-bx+by)/math.sqrt(2)/2.4
                    uvs.extend([(u-.011,v-.011),(u+.011,v-.011),(u+.011,v+.011),(u-.011,v+.011)])
            o=mesh(name,vv,ff,terra,kitchen);uv=o.data.uv_layers.new(name='UVMap')
            for loop in o.data.loops:uv.data[loop.index].uv=uvs[loop.vertex_index]
            metadata(o,'photo_interpreted_small_square_tile','kat_1_bodrum_mutfak/WhatsApp Image 2026-08-26 at 11.54.10 (4).jpeg',floor_index=0,dimension_label_allowed=False)
            o['preserve_authored_uv']=True;return o
        for name in ['Garden south backsplash','Garden west backsplash']:
            o=bpy.data.objects.get(name)
            if o and local(o):o.data.materials.clear();o.data.materials.append(white)
        tile_panel('Review kitchen west small tiles',0,-5.521,0.05,3.15,.905,1.635)
        tile_panel('Review kitchen south small tiles',1,-.284,-5.135,-3.305,.905,1.635)
        # Three black candle arms, photographed above the work area.
        metal=bpy.data.materials['metal'];bulb=bpy.data.materials.get('bulb_warm') or white
        x,y,z=-3.83,1.12,2.60
        sphere('Review kitchen ceiling cup',(x,y,z-.018),(.053,.053,.023),metal,kitchen,2)
        cylinder('Review kitchen central stem',(x,y,z-.025),(x,y,z-.32),.010,metal,kitchen,12)
        for i in range(3):
            angle=i*math.tau/3+.25;points=[]
            for j in range(25):
                t=j/24;r=.285*t;h=z-.32-.19*math.sin(math.pi*t)
                points.append((x+r*math.cos(angle),y+r*math.sin(angle),h))
            paths('Review kitchen candle arm',[points],.009,metal,kitchen)
            p=points[-1];cylinder('Review kitchen candle saucer',p,(p[0],p[1],p[2]+.012),.035,metal,kitchen,24)
            cylinder('Review kitchen candle', (p[0],p[1],p[2]+.015),(p[0],p[1],p[2]+.115),.013,white,kitchen,16)
            sphere('Review kitchen candle bulb',(p[0],p[1],p[2]+.143),(.014,.014,.031),bulb,kitchen,2)
        for o in kitchen.objects:
            if o.name.startswith('Review kitchen '):o['floor_index']=0;o['review_revision']=REV
        for o in list(bpy.data.objects):
            if not local(o) or not o.name.startswith(('Flush ceiling rim','Opal ceiling diffuser')):continue
            p=o.location
            if abs(p.x+3.5)<.16 and abs(p.y-.8)<.16 and 2.3<p.z<2.7:bpy.data.objects.remove(o,do_unlink=True)
        changed.append('small square backsplash and three-arm kitchen candle fixture')
    for s in bpy.data.scenes:
        if s.render.engine=='CYCLES':s.cycles.transmission_bounces=max(s.cycles.transmission_bounces,8)
    for o in bpy.data.objects:
        if local(o) and o.type=='LIGHT' and o.name.startswith('Photographed opal fixture'):
            p=o.location
            if abs(p.x+3.5)<.16 and abs(p.y-.8)<.16 and 2.3<p.z<2.7:
                o.location=(-3.83,1.12,2.12);o.data.size=.30;changed.append('kitchen fixture light position')
    from wc_placement_refinement import refine_wc_placement
    changed.extend(refine_wc_placement())
    for o in bpy.data.objects:
        if local(o) and o.type=='MESH' and o.get('review_revision')=='13-wc-cad-placement':physical_uv(o)
    return changed

if __name__=='__main__':
    if '--discover' in sys.argv:
        libs={str(Path(bpy.path.abspath(o.library.filepath)).resolve()) for o in bpy.data.objects if o.library and o.name.startswith('Pool terrace')}
        libs|={str(ROOT/'build/blender/layers'/n) for n in ['shared-materials.blend','10-architecture.blend','20-fixed-fittings.blend']}
        (ROOT/'build/intermediate/review-patch-libraries.json').write_text(json.dumps(sorted(libs),indent=2))
        print('PATCH_LIBRARIES',json.dumps(sorted(libs)),flush=True)
    else:
        path=Path(bpy.data.filepath)
        # Standalone library files may have no scene users. Evaluate their
        # authored transforms before editing world-space geometry.
        if path.parent.name=='layers':
            nested={child for c in bpy.data.collections for child in c.children}
            for c in list(bpy.data.collections):
                if local(c) and c not in nested and c!=bpy.context.scene.collection and c.name not in bpy.context.scene.collection.children:
                    bpy.context.scene.collection.children.link(c)
        bpy.context.view_layer.update()
        changes=apply();bpy.context.view_layer.update()
        if changes or path.name=='angora21-working.blend':
            bpy.context.scene['review_revision']=REV
            if path.name=='angora21-working.blend':bpy.context.scene['monolithic_source_sha256']=hashlib.sha256((ROOT/'build/intermediate/angora21-monolithic.blend').read_bytes()).hexdigest()
            bpy.ops.wm.save_as_mainfile(filepath=str(path),compress=True,relative_remap=False)
        review_bounds={}
        for o in bpy.context.scene.objects:
            if o.type=='MESH' and o.get('review_revision') in [REV,'13-wc-cad-placement']:
                points=[o.matrix_world@Vector(p) for p in o.bound_box]
                review_bounds[o.name]=[[min(p[i] for p in points) for i in range(3)],[max(p[i] for p in points) for i in range(3)]]
        report={'file':str(path),'changes':changes,'mesh_vertices':sum(len(o.data.vertices) for o in bpy.context.scene.objects if o.type=='MESH'),'objects':len(bpy.context.scene.objects),'geometry_and_empty_objects':sum(o.type not in ['LIGHT','CAMERA'] for o in bpy.context.scene.objects),'review_geometry_bounds_m':review_bounds}
        if path.name=='angora21-monolithic.blend':(ROOT/'build/intermediate/review-patch-source.json').write_text(json.dumps(report,indent=2))
        print('PHOTO_REVIEW_PATCH',json.dumps(report),flush=True)
