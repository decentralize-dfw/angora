"""Photo-directed detailing pass; CAD geometry stays in its original collections.

Geometry added here is explicitly interpreted from photos, never surveyed.
Furniture remains independently removable in 30_FURNITURE_PLACEHOLDERS.
"""
import bpy,math,random
from pathlib import Path
from mathutils import Vector
from blender_utils import *
from detail_materials import add_detail_materials

REF_MAIN='kat_2_ust_salon/WhatsApp Image 2026-08-26 at 11.51.15 (8).jpeg'
REF_BED='kat_3_master_bedroom/WhatsApp Image 2026-08-26 at 11.52.07 (2).jpeg'
REF_FRONT='WhatsApp Image 2026-08-27 at 20.32.54.jpeg'
ROOT=Path(__file__).resolve().parents[1]

def photo_surface(name,reference):
    mat=bpy.data.materials.new(name);mat.use_nodes=True
    image=bpy.data.images.load(str(ROOT/reference),check_existing=True);image.pack()
    tex=mat.node_tree.nodes.new('ShaderNodeTexImage');tex.image=image
    bs=mat.node_tree.nodes.get('Principled BSDF');bs.inputs['Roughness'].default_value=.82
    mat.node_tree.links.new(tex.outputs['Color'],bs.inputs['Base Color'])
    mat['source_reference']=reference;mat['texture_projection']='photo_quad_interpreted'
    mat['reference_status']='source_photo_projection_not_color_calibrated'
    return mat

class Local:
    def __init__(self,col,origin=(0,0,0),angle=0):
        self.col=col;self.origin=Vector(origin);self.angle=math.radians(angle)
    def point(self,p):
        x,y,z=p;a=self.angle
        return self.origin+Vector((x*math.cos(a)-y*math.sin(a),x*math.sin(a)+y*math.cos(a),z))
    def box(self,name,p,size,mat,bevel=.009):return box(name,self.point(p),size,mat,self.col,bevel,self.angle)
    def sphere(self,name,p,size,mat,sub=2):
        o=sphere(name,self.point(p),size,mat,self.col,sub);o.rotation_euler.z=self.angle;return o
    def path(self,name,lines,r,mat):return paths(name,[[self.point(p) for p in line] for line in lines],r,mat,self.col)
    def mesh(self,name,vertices,faces,mat,smooth=False):
        o=mesh(name,vertices,faces,mat,self.col);o.location=self.origin;o.rotation_euler.z=self.angle
        if smooth:
            for p in o.data.polygons:p.use_smooth=True
        return o
    def lathe(self,name,p,profile,mat,n=32,flutes=0):
        x,y,z=p;vv=[];ff=[]
        for r,h in profile:
            for i in range(n):
                a=math.tau*i/n;rr=r*(1+.025*math.cos(a*flutes))
                vv.append((x+rr*math.cos(a),y+rr*math.sin(a),z+h))
        for j in range(len(profile)-1):
            for i in range(n):ff.append((j*n+i,j*n+(i+1)%n,(j+1)*n+(i+1)%n,(j+1)*n+i))
        return self.mesh(name,vv,ff,mat,True)

def reset_collection(name,parent):
    old=bpy.data.collections.get(name)
    if old:
        for obj in list(old.all_objects):bpy.data.objects.remove(obj,do_unlink=True)
        bpy.data.collections.remove(old)
    return collection(name,parent)

def clear_room(name):
    c=bpy.data.collections.get(name)
    if c:
        for o in list(c.all_objects):bpy.data.objects.remove(o,do_unlink=True)
    return c

def curtain(ctx,x,y,bottom,top,width,mat):
    nx=60;ny=16;vv=[];ff=[]
    for j in range(ny+1):
        t=j/ny
        for i in range(nx+1):
            u=i/nx;fold=math.sin(u*math.tau*8)
            vv.append((x+(u-.5)*width,y+.035*fold*(.88+.12*t),bottom+(top-bottom)*t+.012*math.sin(u*math.tau*8)*(1-t)))
    for j in range(ny):
        for i in range(nx):
            a=j*(nx+1)+i;ff.append((a,a+1,a+nx+2,a+nx+1))
    o=ctx.mesh('Pleated curtain',vv,ff,mat,True)
    mod=o.modifiers.new('Woven thickness','SOLIDIFY');mod.thickness=.0015
    return o

def classic_chair(ctx,m):
    ctx.box('Upholstered chair seat',(0,0,.48),(.47,.45,.10),m['chair_tapestry'],.04)
    ctx.box('Upholstered chair back',(0,.18,.84),(.40,.065,.53),m['chair_tapestry'],.06)
    top=[]
    for i in range(33):
        t=i/32;x=-.25+.50*t;z=1.05+.07*math.sin(math.pi*t)+.018*math.sin(5*math.pi*t)
        top.append((x,.19,z))
    rails=[top,
           [(x,.19,z) for x,z in [(-.25,.49),(-.25,.93),(-.23,1.05)]],
           [(x,.19,z) for x,z in [(.25,.49),(.25,.93),(.23,1.05)]]]
    for x in [-.18,.18]:
        for y in [-.17,.16]:rails.append([(x*.85,y*.82,.04),(x*1.05,y*1.04,.17),(x*.87,y*.83,.33),(x,y,.49)])
    ctx.path('Carved chair frame',rails,.026,m['antique_wood'])
    ctx.path('Chair seat frame',[[(-.24,-.23,.43),(.24,-.23,.43),(.24,.22,.43),(-.24,.22,.43),(-.24,-.23,.43)]],.028,m['antique_wood'])

def leather_seating(ctx,m,width=2.1):
    ctx.box('Leather sofa base',(0,0,.30),(width,.88,.33),m['leather_brown'],.075)
    ctx.box('Leather sofa back',(0,.34,.77),(width,.24,.64),m['leather_brown'],.105)
    count=3 if width>1.7 else 1
    for i in range(count):
        x=(i-(count-1)/2)*(width-.34)/count;cw=(width-.40)/count
        ctx.box('Leather seat cushion',(x,-.07,.52),(cw,.66,.16),m['leather_brown'],.06)
        o=ctx.box('Loose leather back cushion',(x,.17,.83),(cw,.21,.42),m['leather_brown'],.065)
        o.rotation_euler.x=math.radians(-8)
        seam=[(x-cw/2+.04,-.35,.535),(x+cw/2-.04,-.35,.535),(x+cw/2-.04,.20,.535)]
        ctx.path('Cushion piping',[seam],.003,m['leather_brown'])
    for x in [-width/2+.1,width/2-.1]:
        ctx.box('Rolled leather arm',(x,-.015,.62),(.25,.90,.37),m['leather_brown'],.10)
        for y in [-.3,.28]:ctx.box('Sofa foot',(x,y,.075),(.10,.10,.15),m['antique_wood'],.018)
    tex=bpy.data.textures.get('Leather cushion irregularity') or bpy.data.textures.new('Leather cushion irregularity',type='CLOUDS')
    tex.noise_scale=.12;tex.noise_depth=2
    for o in ctx.col.objects:
        if not o.name.startswith(('Leather','Loose leather','Rolled leather')) or o.get('cushion_refined'):continue
        for p in o.data.polygons:p.use_smooth=True
        for mod in o.modifiers:
            if mod.type=='BEVEL':mod.segments=3
        sub=o.modifiers.new('Soft cushion subdivision','SUBSURF');sub.levels=2;sub.render_levels=2
        dis=o.modifiers.new('Leather cushion folds','DISPLACE');dis.texture=tex;dis.strength=.012;dis.mid_level=.5
        o['cushion_refined']=True

def ornament_table(ctx,m,length=2.25,width=1.03,height=.77,glass=False):
    # A gently bowed outline and turned legs follow the visible classical silhouettes.
    count=64;outline=[]
    for i in range(count):
        a=math.tau*i/count;c=math.cos(a);s=math.sin(a)
        outline.append((math.copysign(abs(c)**.4,c)*length/2,math.copysign(abs(s)**.4,s)*width/2))
    vv=[(x,y,z) for z in [height-.07,height] for x,y in outline]
    ff=[tuple(range(count-1,-1,-1)),tuple(range(count,2*count))]+[(i,(i+1)%count,(i+1)%count+count,i+count) for i in range(count)]
    ctx.mesh('Bowed table top',vv,ff,m['antique_wood'])
    ctx.path('Table top inlay',[[(x*.97,y*.95,height+.004) for x,y in outline+[outline[0]]]],.007,m['inlay_wood'])
    if glass:
        ctx.box('Coffee table inset glass',(0,0,height+.003),(length*.81,width*.70,.008),m['cabinet_glass'],.012)
        ctx.box('Coffee table central divider',(0,0,height+.008),(.026,width*.75,.017),m['antique_wood'])
    for x in [-length*.38,length*.38]:
        for y in [-width*.32,width*.32]:
            ctx.lathe('Turned table leg',(x,y,0),[(.024,.04),(.030,.06),(.025,height*.32),(.048,height*.58),(.055,height*.64),(.038,height-.06)],m['antique_wood'],20,6)

def china_cabinet(ctx,m):
    ctx.box('Vitrine lower cabinet',(0,0,.38),(1.46,.45,.68),m['antique_wood'],.025)
    for x in [-.47,0,.47]:ctx.box('Cabinet lower inset',(x,-.235,.38),(.41,.025,.47),m['wood_honey'],.028)
    ctx.box('Vitrine back',(0,.205,1.43),(1.47,.05,1.47),m['antique_wood'])
    ctx.box('Vitrine top cornice',(0,0,2.18),(1.60,.53,.10),m['antique_wood'],.021)
    ctx.box('Vitrine bottom cornice',(0,0,.76),(1.55,.51,.10),m['antique_wood'],.012)
    for x in [-.71,-.26,.26,.71]:ctx.box('Vitrine vertical stile',(x,-.215,1.45),(.055,.065,1.35),m['antique_wood'])
    for x in [-.49,0,.49]:ctx.box('Vitrine glazed door',(x,-.214,1.45),(.40,.008,1.30),m['cabinet_glass'],.001)
    for x in [-.72,.72]:ctx.box('Vitrine glass side',(x,0,1.45),(.009,.40,1.30),m['cabinet_glass'],.001)
    for z in [.84,1.16,1.50,1.86]:
        ctx.box('Glass shelf',(0,0,z),(1.37,.39,.01),m['cabinet_glass'],.002)
        for i in range(4):
            x=-.49+i*.32
            ctx.lathe('Display porcelain',(x,.02,z+.01),[(.02,0),(.05,.02),(.067,.085),(.045,.15),(.025,.17)],m['china'],18)
    crest=[(-.73+1.46*i/48,-.1,2.21+.26*math.sin(math.pi*i/48)**.75) for i in range(49)]
    ctx.path('Vitrine pediment',[crest],.036,m['antique_wood'])
    for x in [-.58,.58]:ctx.lathe('Cabinet foot',(x,0,0),[(.045,.015),(.06,.055),(.038,.13)],m['antique_wood'],20)

def chandelier(ctx,m,lights,arms=6):
    ctx.path('Chandelier suspension',[[(0,0,0),(0,0,-.33)]],.009,m['brass'])
    ctx.lathe('Chandelier central body',(0,0,-.65),[(.035,0),(.075,.1),(.045,.19),(.024,.36)],m['brass'],28)
    for i in range(arms):
        a=math.tau*i/arms
        pp=[]
        for j in range(18):
            t=j/17;r=.045+.32*t;z=-.49-.15*math.sin(math.pi*t)
            pp.append((r*math.cos(a),r*math.sin(a),z))
        ctx.path('Curved chandelier arm',[pp],.010,m['brass'])
        x,y=.365*math.cos(a),.365*math.sin(a)
        ctx.lathe('Candle cup',(x,y,-.49),[(.055,0),(.045,.015),(.018,.055)],m['brass'],24)
        ctx.box('Candle sleeve',(x,y,-.40),(.025,.025,.10),m['china'],.01)
        ctx.sphere('Candle bulb',(x,y,-.31),(.023,.023,.062),m['bulb_warm'],2)
    p=ctx.point((0,0,-.41));area_light('Warm chandelier light',p,ctx.point((0,0,-2)),78,1.0,lights,(1,.88,.72))

def draped_quilt(ctx,m):
    nx,ny=72,72;vv=[];ff=[]
    for j in range(ny+1):
        v=-1.62+2.55*j/ny
        for i in range(nx+1):
            u=-1.38+2.76*i/nx;dropx=max(0,abs(u)-.86);dropy=max(0,-v-1.045)
            x=u if not dropx else math.copysign(.86+.030*math.sin(min(1,dropx/.07)*math.pi/2)+dropx*(.10+.045*math.sin(v*18)),u)
            y=v if not dropy else -1.045-.026*math.sin(min(1,dropy/.07)*math.pi/2)-dropy*(.10+.045*math.sin(u*17))
            fall=max(dropx,dropy)+min(dropx,dropy)*.12
            z=.659-fall+.006*math.sin(u*20+v*12)+.003*math.cos(v*45)
            vv.append((x,y,z))
    for j in range(ny):
        for i in range(nx):a=j*(nx+1)+i;ff.append((a,a+1,a+nx+2,a+nx+1))
    textile=photo_surface('Master quilt — photo projection',REF_BED)
    o=ctx.mesh('Draped master quilt',vv,ff,textile,True)
    uv=o.data.uv_layers.new(name='Quilt coordinates')
    for p in o.data.polygons:
        for li in p.loop_indices:
            vi=o.data.loops[li].vertex_index;u=(vi%(nx+1))/nx;v=(vi//(nx+1))/ny
            # Four visible blanket corners in the source photograph. The unseen
            # reverse is not claimed to be reconstructed from this projection.
            seam=Vector((370,982)).lerp(Vector((1040,959)),u)
            if v<.23:
                bottom=Vector((370,1105)).lerp(Vector((1015,1087)),u)
                p=bottom.lerp(seam,v/.23)
            else:
                top=Vector((402,855)).lerp(Vector((865,829)),u)
                p=seam.lerp(top,(v-.23)/.77)
            uv.data[li].uv=(p.x/1200,1-p.y/1600)
    mod=o.modifiers.new('Quilt thickness','SOLIDIFY');mod.thickness=.004

def pillow(ctx,m,x):
    vv=[];ff=[];n=40;rows=20
    def sp(v,e):return math.copysign(abs(v)**e,v)
    for j in range(rows+1):
        lat=-math.pi/2+math.pi*j/rows
        for i in range(n):
            a=math.tau*i/n
            xx=.33*sp(math.cos(lat)*math.cos(a),.52)
            yy=.085*sp(math.cos(lat)*math.sin(a),.55)
            zz=.215*sp(math.sin(lat),.50)
            vv.append((x+xx,.67+yy+zz*.22,.78+zz))
    for j in range(rows):
        for i in range(n):ff.append((j*n+i,j*n+(i+1)%n,(j+1)*n+(i+1)%n,(j+1)*n+i))
    ctx.mesh('Soft grey pillow',vv,ff,m['pillow_grey'],True)

def framed_art(ctx,m,center,size,quad):
    x,y,z=center;w,h=size
    mat=photo_surface('Salon artwork — photographed detail',REF_MAIN)
    o=ctx.mesh('Photographed wall artwork',[(x-w/2,y,z-h/2),(x+w/2,y,z-h/2),(x+w/2,y,z+h/2),(x-w/2,y,z+h/2)],[(0,1,2,3)],mat)
    uv=o.data.uv_layers.new(name='Source artwork corners')
    for p in o.data.polygons:
        for li in p.loop_indices:
            a,b=quad[o.data.loops[li].vertex_index];uv.data[li].uv=(a/1600,1-b/672)
    for xx in [x-w/2-.035,x+w/2+.035]:ctx.box('Artwork frame stile',(xx,y-.009,z),(.06,.045,h+.12),m['antique_wood'])
    for zz in [z-h/2-.035,z+h/2+.035]:ctx.box('Artwork frame rail',(x,y-.009,zz),(w+.12,.045,.06),m['antique_wood'])

def lamps(ctx,m):
    for x in [-1.12,1.12]:
        ctx.lathe('Ornate bedside lamp',(x,.68,.54),[(.12,0),(.12,.025),(.07,.045),(.06,.12),(.13,.24),(.11,.31),(.055,.39),(.06,.45)],m['antique_wood'],40,8)
        ctx.lathe('Bell lampshade',(x,.68,1.00),[(.20,0),(.205,.015),(.16,.10),(.10,.32),(.085,.35)],m['lamp_shade'],48,8)
        ctx.sphere('Lamp finial',(x,.68,1.39),(.022,.022,.03),m['brass'],2)

def cornice(ctx,rect,z,m):
    x0,y0,x1,y1=rect
    for inset,down,radius in [(.065,.035,.035),(.042,.074,.020),(.021,.105,.013)]:
        pp=[(x0+inset,y0+inset,z-down),(x1-inset,y0+inset,z-down),(x1-inset,y1-inset,z-down),(x0+inset,y1-inset,z-down),(x0+inset,y0+inset,z-down)]
        ctx.path('Stepped ceiling cornice',[pp],radius,m['white_trim'])

def refine(m,cols):
    add_detail_materials(m)
    f1=bpy.data.collections['F1_Furniture'];fixed1=bpy.data.collections['F1_Fittings'];fixed2=bpy.data.collections['F2_Fittings']
    for name in ['Main lounge','Main lounge east','Main dining','Display cabinet']:clear_room(name)
    main=reset_collection('Photo furniture — main lounge',f1)
    leather_seating(Local(main,(2.53,5.80,2.7996),-90),m,2.22)
    leather_seating(Local(main,(1.28,7.45,2.7996),0),m,.98)
    leather_seating(Local(main,(1.35,3.91,2.7996),180),m,.98)
    ornament_table(Local(main,(1.26,5.64,2.7996),90),m,1.28,.84,.43,True)
    ornament_table(Local(main,(-3.08,5.40,2.7996),90),m,2.24,1.04,.77)
    for x,angle in [(-3.94,90),(-2.22,-90)]:
        for y in [4.72,5.40,6.08]:classic_chair(Local(main,(x,y,2.7996),angle),m)
    china_cabinet(Local(main,(-4.77,6.65,2.7996),90),m)
    decor=reset_collection('Photo details — entrance',fixed1)
    c=Local(decor)
    for x,width in [(-4.53,.40),(-2.77,.42),(-1.90,.43),(-.08,.46),(2.65,.46)]:curtain(c,x,7.94,2.82,5.77,width,m['burgundy_velvet'])
    for x,width,bottom,height in [(-3.642,1.15,3.43,1.45),(-.987,1.15,2.82,2.06),(1.688,1.15,3.43,1.45)]:
        for xx in [x-width/2,x+width/2]:c.box('Interior window casing',(xx,8.01,bottom+height/2),(.075,.075,height+.13),m['wood_dark'])
        for zz in [bottom,bottom+height]:c.box('Interior window casing',(x,8.01,zz),(width+.08,.075,.075),m['wood_dark'])
    for i in range(12):c.box('Salon radiator fin',(-4.0+i*.068,7.935,3.24),(.05,.09,.57),m['ceramic'])
    framed_art(Local(decor,(3.035,5.82,4.68),-90),m,(0,0,0),(.74,.69),[(1198,323),(1260,324),(1263,263),(1198,259)])
    cornice(c,(-5.03,3.327,3.118,8.077),5.8914,m)
    # Keep original fixtures out of the refined rooms; all replacements stay in fittings.
    for fixture_col in [fixed1,fixed2]:
        for obj in list(fixture_col.all_objects):
            if obj.name.startswith(('Pendant stem','Chandelier arm','Chandelier shade')):
                bpy.data.objects.remove(obj,do_unlink=True)
    for name in ['Chandelier 1','Chandelier 2']:
        c0=bpy.data.collections.get(name)
        if c0:
            for o in list(c0.all_objects):bpy.data.objects.remove(o,do_unlink=True)
    for o in list(cols['lights'].all_objects):
        if o.name.startswith(('Main lounge chandelier','Master ceiling light')):bpy.data.objects.remove(o,do_unlink=True)
    chandelier(Local(decor,(-3.02,5.42,5.875)),m,cols['lights'])
    chandelier(Local(decor,(1.25,5.70,5.875)),m,cols['lights'])
    bed=bpy.data.collections['Master bedroom']
    for o in list(bed.all_objects):
        if o.name.startswith(('Headboard','Coverlet','Lamp base','Lamp stem','Lamp shade','Draped master quilt','Ornate bedside lamp','Bell lampshade','Lamp finial','Pillow','Soft grey pillow')):bpy.data.objects.remove(o,do_unlink=True)
        elif o.name.startswith('Bed base'):o.data=o.data.copy();o.data.materials.clear();o.data.materials.append(m['bed_base'])
    c=Local(bed,(-3.98,6.35,6.3714),90);draped_quilt(c,m);lamps(c,m)
    for x in [-.4125,.4125]:pillow(c,m,x)
    c=Local(bed,(-4.64,4.49,6.3714),90)
    c.box('Master upholstered chair seat',(0,0,.47),(.49,.45,.12),m['linen'],.055)
    c.box('Master upholstered chair back',(0,.17,.80),(.47,.09,.66),m['linen'],.07)
    for x in [-.19,.19]:
        for y in [-.16,.16]:c.box('Master upholstered chair leg',(x,y,.21),(.042,.042,.42),m['wood_honey'])
    clear_room('Master curtains')
    master=reset_collection('Photo details — master bedroom',fixed2);c=Local(master)
    for x,width in [(-3.50,1.25),(-1.0,1.30)]:curtain(c,x,7.925,6.39,8.93,width,m['curtain_sheer'])
    # The bedroom photo shows one fabric pendant, not a multi-arm chandelier.
    c.path('Pendant chain',[[(-3.20,6.0,8.98),(-3.20,6.0,8.47)]],.009,m['metal'])
    c.lathe('Master fabric pendant',(-3.20,6.0,8.00),[(.27,0),(.27,.015),(.17,.44),(.165,.46)],m['lamp_shade'],64)
    c.sphere('Pendant lamp',(-3.20,6.0,8.26),(.05,.05,.09),m['bulb_warm'],2)
    area_light('Master pendant light',(-3.2,6.0,8.1),(-3.2,6.0,6.4),48,.35,cols['lights'],(1,.88,.66))
    cornice(c,(-5.03,4.03,.12,8.077),8.9905,m)
    for col,ref in [(main,REF_MAIN),(decor,REF_MAIN),(bed,REF_BED),(master,REF_BED)]:
        for obj in col.all_objects:metadata(obj,'photo_interpreted',ref,dimension_label_allowed=False)
    for obj in main.all_objects:obj['placeholder']=True;obj['floor_index']=1;obj['room']='Main lounge and dining'
    for obj in decor.all_objects:obj['floor_index']=1
    for obj in master.all_objects:obj['floor_index']=2
    from rooms_refinement import refine_rooms
    refine_rooms(m,cols)
    from bathrooms_refinement import refine_bathrooms
    refine_bathrooms(m,cols)
    from lighting_refinement import refine_lighting
    refine_lighting(m,cols)
    # A review camera oriented toward the three source north openings.
    cam=bpy.data.objects['05_main_lounge'];cam.location=(-.45,3.68,4.37)
    cam.rotation_euler=(Vector((-.8,6.2,4.25))-cam.location).to_track_quat('-Z','Y').to_euler();cam.data.lens=14.5
    data=cam.data.copy();data.name='Main lounge photo comparison panorama';data.type='PANO';data.panorama_type='EQUIRECTANGULAR'
    data.longitude_min=-1.25;data.longitude_max=1.25;data.latitude_min=-.40;data.latitude_max=.46
    pano=bpy.data.objects.new('09_main_panorama',data);cols['cameras'].objects.link(pano)
    pano.location=cam.location.copy();pano.rotation_euler=cam.rotation_euler.copy()
    for o in cols['lights'].all_objects:
        if o.type=='LIGHT' and o.name.startswith('Interior fill'):o.data.energy=28
    scene=bpy.context.scene;scene['detail_stage']='photo_refinement_01';scene['photo_match_complete']=False
    bpy.context.view_layer.update()
    from exterior_refinement import refine_exterior
    refine_exterior(m,cols)
    from site_refinement import refine_site
    from facade_refinement import refine_facade
    refine_facade(m,cols)
    refine_site(m,cols)
    from lift_refinement import refine_lift
    refine_lift(m,cols)
    return m
