import sys, json, math, numpy as np, trimesh
from trimesh.ray.ray_pyembree import RayMeshIntersector
from PIL import Image, ImageDraw, ImageFont
def load(tp):
    P=np.fromfile(tp+'.bin',np.float32).reshape(-1,3,3).astype(np.float64); meta=json.load(open(tp+'.json'))
    mat=np.concatenate([np.full(c,i) for i,(_,_,c) in enumerate(meta)]); names=np.array([meta[m][1] for m in mat])
    c=P.mean(1); A=np.linalg.norm(np.cross(P[:,1]-P[:,0],P[:,2]-P[:,0]),axis=1)
    k=(c[:,0]>-5)&(c[:,0]<3.5)&(c[:,1]>-1)&(c[:,1]<4)&(c[:,2]>-12)&(c[:,2]<-4)&(A>1e-9)&(names!='glass')
    return P[k]
def shade(P, eye, look, W=900, H=640, fov=62):
    rx=RayMeshIntersector(trimesh.Trimesh(vertices=P.reshape(-1,3),faces=np.arange(len(P)*3).reshape(-1,3),process=False))
    F=np.array(look,float); F/=np.linalg.norm(F); R=np.cross(F,[0,1,0]); R/=np.linalg.norm(R); U=np.cross(R,F)
    f=(H/2)/math.tan(math.radians(fov)/2)
    ys,xs=np.mgrid[0:H,0:W]; d=F[None]*f+R[None]*(xs.ravel()[:,None]-W/2+.5)-U[None]*(ys.ravel()[:,None]-H/2+.5); d/=np.linalg.norm(d,axis=1,keepdims=True)
    O=np.repeat(np.array(eye,float)[None],len(d),0)
    tri=rx.intersects_first(O,d)
    n=np.cross(P[:,1]-P[:,0],P[:,2]-P[:,0]); n/=np.linalg.norm(n,axis=1,keepdims=True)+1e-12
    L=np.array([0.35,0.8,-0.5]); L/=np.linalg.norm(L)
    img=np.full(len(d),235.0); hit=tri>=0
    nn=n[tri[hit]]; nn*=np.sign(-(nn*d[hit]).sum(1))[:,None]
    img[hit]=60+170*np.clip(nn@L,0,1)*0.75+170*0.25*np.abs((nn*d[hit]).sum(1))
    return Image.fromarray(img.reshape(H,W).clip(0,255).astype(np.uint8)).convert('RGB')
eye=[-1.75,1.45,-10.4]; look=[0.28,-0.08,1]
a=shade(load(sys.argv[1]),eye,look); b=shade(load(sys.argv[2]),eye,look)
f=ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf',28)
o=Image.new('RGB',(a.width*2+16,a.height+50),'white'); d=ImageDraw.Draw(o)
o.paste(a,(0,50)); o.paste(b,(a.width+16,50)); d.text((10,10),'ÖNCE (model)',fill=(170,30,30),font=f); d.text((a.width+26,10),'SONRA (model)',fill=(20,120,40),font=f)
o.save(sys.argv[3],quality=90)
