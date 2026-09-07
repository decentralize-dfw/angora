"""Deterministic leaf mesh for the large tree visible beside the rear facade."""
import math,random
from mathutils import Vector
from blender_utils import cylinder,mesh,metadata,collection

def broadleaf_tree(base,height,radius,m,parent,seed=21):
    rng=random.Random(seed);col=collection('Rear broadleaf tree',parent)
    base=Vector(base)
    cylinder('Tree trunk',base,base+Vector((.08,-.06,height*.74)),.14,m['wood_dark'],col,10)
    clusters=[]
    for i in range(11):
        a=i*2.39996;r=radius*rng.uniform(.35,.8)
        center=base+Vector((math.cos(a)*r,math.sin(a)*r,height*rng.uniform(.58,.88)))
        start=base+Vector((0,0,height*(.25+i*.033)))
        middle=(start+center)/2+Vector((0,0,-.22))
        cylinder('Tree main branch',start,middle,.052,m['wood_dark'],col,7)
        cylinder('Tree branch',middle,center,.029,m['wood_dark'],col,6)
        clusters.append(center)
    vertices=[];faces=[];materials=[]
    for i in range(9000):
        center=rng.choice(clusters)
        # Soft overlapping crown clusters preserve irregular sky gaps.
        direction=Vector((rng.gauss(0,1),rng.gauss(0,1),rng.gauss(0,1))).normalized()
        rr=rng.random()**(1/3)
        p=center+Vector((direction.x*radius*.57*rr,direction.y*radius*.57*rr,direction.z*height*.20*rr))
        normal=Vector((rng.uniform(-.7,.7),rng.uniform(-.7,.7),rng.uniform(.25,1))).normalized()
        u=normal.cross(Vector((0,1,0))).normalized();v=normal.cross(u)
        angle=rng.random()*math.tau;u,v=(u*math.cos(angle)+v*math.sin(angle)),(-u*math.sin(angle)+v*math.cos(angle))
        length=rng.uniform(.17,.29);width=length*rng.uniform(.38,.55)
        baseid=len(vertices)
        for x,y,z in [(0,-length/2,0),(width/2,-length*.10,0),(0,length/2,0),(-width/2,-length*.10,0),(0,0,.009)]:
            q=p+u*x+v*y+normal*z;vertices.append(tuple(q))
        for a,b in [(0,1),(1,2),(2,3),(3,0)]:faces.append((baseid+a,baseid+b,baseid+4));materials.append(0 if rng.random()<.72 else 1)
    foliage=mesh('Individual folded leaves',vertices,faces,m['foliage'],col)
    foliage.data.materials.append(m['foliage_light'])
    for p,idx in zip(foliage.data.polygons,materials):p.material_index=idx
    metadata(foliage,'photo_inferred_vegetation','WhatsApp Image 2026-08-27 at 20.31.29.jpeg',species_status='unverified',placement_status='photo_interpreted')
    return col
