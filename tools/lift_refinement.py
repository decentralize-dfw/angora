"""Photo-derived lift inside the repeated CAD U-shaped vertical core.

The original CAD predates/does not label the installed lift. Alignment to the
core and the kitchen photograph is interpreted, not an elevator shop drawing.
"""
import bpy,math,json
from pathlib import Path
from mathutils import Vector
from blender_utils import *
from blender_materials import material,noise_bump

ROOT=Path(__file__).resolve().parents[1]
def refine_lift(m,cols):
    for c in list(bpy.data.collections):
        if c.name=='Lift' or c.name.startswith('Lift landing '):
            for o in list(c.all_objects):bpy.data.objects.remove(o,do_unlink=True)
            bpy.data.collections.remove(c)
    lift=collection('Lift — shaft cabin and landing doors',cols['fixed'])
    x=-2.02;y=.86;ix0=x-.68;ix1=x+.68;iy0=.19;iy1=1.53
    # User confirmed 2026-09-08: the installed lift does not serve the attic.
    floorz=[0,3.0996,6.3714];tops=floorz[1:]+[8.991]
    m['lift_steel']=material('Lift brushed patterned stainless','B9BDC0',.22,1)
    noise_bump(m['lift_steel'],170,.09,.0004)
    m['lift_mirror']=material('Lift mirror','F3F4F2',.025,1)
    m['lift_stone']=material('Lift speckled granite floor','B7B7AA',.42)
    noise_bump(m['lift_stone'],90,.20,.002)
    m['lift_rose']=material('Lift glass rose','793E49',.38)
    m['lift_leaf']=material('Lift glass leaf','53734B',.38)
    m['lift_amber']=material('Lift glass amber','AC8A44',.35)
    # Restore a continuous pit and shaft, with real landing apertures.
    box('Lift pit floor',(x,y,-.42),(1.58,1.56,.16),m['stone_tile'],lift)
    for i,(z,top) in enumerate(zip(floorz,tops)):
        col=collection('Lift F'+str(i),lift);h=top-z
        for xx in [ix0-.065,ix1+.065]:box('Lift shaft side wall',(xx,y,z+h/2),(.13,1.60,h),m['interior'],col)
        box('Lift shaft back wall',(x,iy0-.065,z+h/2),(1.62,.13,h),m['interior'],col)
        for xx in [x-.67,x+.67]:box('Lift landing jamb wall',(xx,iy1+.07,z+h/2),(.27,.14,h),m['interior'],col)
        box('Lift lintel wall',(x,iy1+.07,z+(2.15+h)/2),(1.12,.14,h-2.15),m['interior'],col)
        for xx in [x-.54,x+.54]:box('Lift timber architrave',(xx,iy1+.157,z+1.075),(.10,.045,2.15),m['wood_dark'],col,.01)
        box('Lift timber head',(x,iy1+.157,z+2.14),(1.18,.045,.13),m['wood_dark'],col,.01)
        box('Lift threshold',(x,iy1+.07,z+.018),(1.03,.23,.035),m['lift_steel'],col,.003)
        # Hinged timber/glass home-lift landing leaf, as in the source photos.
        hinge=bpy.data.objects.new('Lift F'+str(i)+' hinged door',None);col.objects.link(hinge)
        hinge.location=(x+.49,iy1+.15,z);hinge.rotation_euler.z=math.radians(-72 if i==0 else 0)
        door=[]
        for xx in [-.92,-.06]:door.append(box('Lift door stile',(xx,0,1.04),(.13,.044,2.06),m['wood_dark'],col,.006))
        for zz,hh in [(.17,.34),(1.99,.14)]:door.append(box('Lift door rail',(-.49,0,zz),(.87,.044,hh),m['wood_dark'],col,.006))
        glass=box('Lift floral textured glass',(-.49,0,1.14),(.70,.012,1.62),m['cabinet_glass'],col,.002);door.append(glass)
        # Thin colored leaded-glass motif geometry; no opaque photo rectangle.
        stem=[(-.49+.08*math.sin(t*math.tau),-.011,.43+t*1.25) for t in [j/40 for j in range(41)]]
        door.append(paths('Lift floral lead stem',[stem],.008,m['lift_amber'],col))
        for k in range(6):
            z0=.57+k*.165;side=1 if k%2 else -1
            pts=[(-.49,-.014,z0),(-.49+side*.17,-.018,z0+.04),(-.49+side*.24,-.018,z0+.13),(-.49+side*.04,-.014,z0+.10)]
            door.append(mesh('Lift stained-glass leaf',pts,[(0,1,2,3)],m['lift_leaf'],col))
        for r in [.03,.058,.09,.12]:
            pts=[(-.49+r*(1+.16*math.sin(5*a))*math.cos(a),-.019,1.19+r*(1+.16*math.sin(5*a))*math.sin(a)) for a in [j*math.tau/48 for j in range(49)]]
            door.append(paths('Lift glass rose lead',[pts],.007,m['lift_rose'],col))
        door.append(paths('Lift door pull',[[(-.86,.065,.82),(-.86,.065,1.04)]],.014,m['brass'],col))
        for o in door:o.parent=hinge
        box('Lift landing call plate',(x-.66,iy1+.176,z+1.28),(.082,.015,.30),m['lift_steel'],col,.006)
        box('Lift floor indicator',(x-.66,iy1+.190,z+1.34),(.042,.008,.085),m['black'],col,.004)
        box('Lift call button',(x-.66,iy1+.193,z+1.20),(.031,.012,.031),m['chrome'],col,.004)
        for o in col.all_objects:metadata(o,'CAD_core_photo_interpreted_lift','asansor; kat_1_bodrum_mutfak',floor_index=i,dimension_label_allowed=False)
    cabin=collection('Lift cabin at garden floor',lift)
    box('Lift cabin granite',(x,y,.045),(1.25,1.24,.08),m['lift_stone'],cabin,.005)
    for xx in [x-.626,x+.626]:box('Lift cabin steel side',(xx,y,1.125),(.020,1.25,2.14),m['lift_steel'],cabin)
    box('Lift cabin steel back',(x,.233,1.125),(1.25,.022,2.14),m['lift_steel'],cabin)
    box('Lift rear mirror',(x,.247,1.28),(.49,.012,1.69),m['lift_mirror'],cabin)
    # Instanced small dimples give the photographed stainless pattern depth.
    for xx in [x-.55,x-.44,x-.33,x+.33,x+.44,x+.55]:
        for zz in [0.22+j*.082 for j in range(23)]:sphere('Lift steel embossed dot',(xx,.254,zz),(.010,.006,.010),m['chrome'],cabin,1)
    for sign in [-1,1]:
        for yy in [.34+j*.10 for j in range(11)]:
            for zz in [.22+j*.105 for j in range(18)]:sphere('Lift side embossed dot',(x+sign*.612,yy,zz),(.006,.009,.009),m['chrome'],cabin,1)
    for a,b in [((x-.52,.30,.95),(x+.52,.30,.95)),((x-.56,.35,.95),(x-.56,1.23,.95))]:cylinder('Lift handrail',a,b,.022,m['chrome'],cabin,16)
    box('Lift cabin ceiling',(x,y,2.23),(1.25,1.25,.05),m['lift_steel'],cabin)
    for xx in [x-.37,x+.37]:
        for yy in [.5,1.20]:area_light('Lift recessed LED',(xx,yy,2.20),(xx,yy,.6),6,.075,cols['lights'])
    # Cut only horizontal architecture slabs; do not use broad Boolean cuts
    # through the structural walls or erase the untouched CAD source collection.
    def clip(poly,axis,value,sign):
        out=[]
        for a,b in zip(poly,poly[1:]+poly[:1]):
            da=(a[axis]-value)*sign;db=(b[axis]-value)*sign
            if da>=-1e-8:out.append(a)
            if (da<0)<(db<0) or (db<0)<(da<0):
                t=da/(da-db);out.append(a.lerp(b,t))
        return out
    cut=[]
    for o in list(cols['arch'].all_objects):
        layer=o.get('source_layer','').upper()
        if o.type!='MESH' or not any(t in layer for t in ['ZEMİN','TAVAN','DUVAR']):continue
        if not any(ix0-.05<v.co.x<ix1+.05 and iy0-.05<v.co.y<iy1+.05 for v in o.data.vertices):
            # Large triangles can cross the shaft without vertices inside it.
            mn=[min(v.co[i] for v in o.data.vertices) for i in range(3)];mx=[max(v.co[i] for v in o.data.vertices) for i in range(3)]
            if mx[0]<ix0 or mn[0]>ix1 or mx[1]<iy0 or mn[1]>iy1:continue
        vertices=[];faces=[];indices=[];removed=0
        for face in o.data.polygons:
            poly=[o.data.vertices[i].co.copy() for i in face.vertices]
            pieces=[]
            if abs(face.normal.z)>.99 and -.15<face.center.z<8.991-1e-4:
                inside=poly
                for axis,value,sign in [(0,ix0,1),(0,ix1,-1),(1,iy0,1),(1,iy1,-1)]:
                    if len(inside)<3:break
                    outside=clip(inside,axis,value,-sign)
                    if len(outside)>=3:pieces.append(outside)
                    inside=clip(inside,axis,value,sign)
                if len(inside)>=3:removed+=1
            else:pieces=[poly]
            for piece in pieces:
                start=len(vertices);vertices.extend(piece);faces.append(tuple(range(start,start+len(piece))));indices.append(face.material_index)
        if removed:
            old=o.data;new=bpy.data.meshes.new(old.name+' | lift aperture');new.from_pydata(vertices,[],faces);new.update()
            for mat in old.materials:new.materials.append(mat)
            for face,index in zip(new.polygons,indices):face.material_index=index
            o.data=new;cut.append(o.name)
    camera('17_lift_garden',(-1.98,3.78,1.52),(x,.60,1.13),21,cols['cameras'])
    # A separate cutaway is assembled by the review renderer, not by hiding
    # walls in the authored scene permanently.
    (ROOT/'build/lift-report.json').write_text(json.dumps(dict(core_center_xy=[x,y],clear_shaft_xy=[1.36,1.34],
        shaft_pit_z=-.5,shaft_top_z=8.991,landing_z=floorz,slab_objects_cut=cut,
        position_status='repeated_CAD_U_core_with_photo_relation_to_kitchen',
        dimensions_status='interpreted_not_shop_drawing',dimension_label_allowed=False),indent=2))
    print('LIFT_SHAFT_CUT',len(cut),flush=True)
