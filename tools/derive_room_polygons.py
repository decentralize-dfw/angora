#!/usr/bin/env python3
"""T07a - derive room boundary polygons and areas for Angora 21 from the R39 delivery.

INPUTS  (read-only, both under build/web/full/):
  sections.json  R39 wall-section atlas, 192 filled cross-sections at 0.08 m steps
  rooms.json     the 27 room labels with their registered XZ positions
OUTPUT
  room-spaces.json  one entry per enclosed space, with polygon + areas + provenance

The lift-shaft footprint is taken from the "Lift shaft continuous walls | F<n>" node
bounds in level-<n>.glb (identical on f0/f1/f2); it is hard-coded below and re-checked
by tools/verify (x -2.932..-1.001, z -1.320..-0.060).

Method: barrier = union of the atlas slices of the storey (seals doorways with their
lintels and windows with their sills) + the lift-shaft footprint; 0.01 m raster;
4-connected flood from each room position; rectilinear boundary trace; Douglas-Peucker
at 0.015 m; every axis-aligned coordinate snapped to the nearest vertex coordinate of
the measuring slice (datum+1.0 m) within 0.03 m; shoelace area.
"""
import json, math, sys
import numpy as np
from collections import defaultdict

ROOT=sys.argv[1] if len(sys.argv)>1 else '/home/user/angora'
CELL=0.01; X0,Z0=-7.0,-9.6; NX,NZ=1500,1660
DAT=[0,3.0996,6.3714,9.4705]
BAND=[(0.08,2.56),(3.20,5.84),(6.48,8.96),(9.60,11.60)]   # storey slice band (datum+0.08 .. under the ceiling / above the attic door heads)
MEAS=[0.96,4.08,7.36,10.48]                               # atlas slice nearest datum+1.00
LINING=0.030                                              # measured thickness of the R39 wall finish lining
SHAFT=(-2.932,-1.001,-1.320,-0.060)                       # lift shaft footprint, all storeys that carry it
SHAFT_FLOORS={0,1,2}
APPENDAGE_R=12       # 0.12 m square opening: drops boundary appendages narrower than 0.24 m
APPENDAGE_MIN=0.05   # ... only when the appendage is larger than this area

ATL=json.load(open(ROOT+'/build/web/full/sections.json'))
ROOMS=json.load(open(ROOT+'/build/web/full/rooms.json'))
SL=ATL['slices']; HS=np.array([s['height'] for s in SL])
def ij(x,z): return int((x-X0)/CELL), int((z-Z0)/CELL)

def raster(tri,mask):
    for t in tri:
        i0=max(0,int((t[:,0].min()-X0)/CELL)-1); i1=min(NX,int((t[:,0].max()-X0)/CELL)+2)
        j0=max(0,int((t[:,1].min()-Z0)/CELL)-1); j1=min(NZ,int((t[:,1].max()-Z0)/CELL)+2)
        if i1>i0 and j1>j0:
            xs=X0+CELL*(np.arange(i0,i1)+0.5); zs=Z0+CELL*(np.arange(j0,j1)+0.5)
            XX,ZZ=np.meshgrid(xs,zs)
            d=lambda a,b:(b[0]-a[0])*(ZZ-a[1])-(b[1]-a[1])*(XX-a[0])
            d1,d2,d3=d(t[0],t[1]),d(t[1],t[2]),d(t[2],t[0])
            mask[j0:j1,i0:i1]|=~(((d1<0)|(d2<0)|(d3<0))&((d1>0)|(d2>0)|(d3>0)))
        for a,b in ((t[0],t[1]),(t[1],t[2]),(t[2],t[0])):
            L=math.hypot(b[0]-a[0],b[1]-a[1]); n=max(2,int(L/(CELL*0.4))+2); tt=np.linspace(0,1,n)
            ii=((a[0]+tt*(b[0]-a[0])-X0)/CELL).astype(int); jj=((a[1]+tt*(b[1]-a[1])-Z0)/CELL).astype(int)
            ok=(ii>=0)&(ii<NX)&(jj>=0)&(jj<NZ); mask[jj[ok],ii[ok]]=True
    return mask

def slice_mask(sel):
    m=np.zeros((NZ,NX),dtype=bool)
    for s in sel:
        if s['i']:
            p=np.array(s['p']).reshape(-1,2); i=np.array(s['i']).reshape(-1,3); raster(p[i],m)
    return m

def flood(free,seed):
    reg=np.zeros_like(free); si,sj=seed
    if not free[sj,si]: return reg,False
    st=[(si,sj)]
    while st:
        x,y=st.pop()
        if reg[y,x] or not free[y,x]: continue
        x1=x
        while x1>0 and free[y,x1-1] and not reg[y,x1-1]: x1-=1
        x2=x
        while x2<NX-1 and free[y,x2+1] and not reg[y,x2+1]: x2+=1
        reg[y,x1:x2+1]=True
        for ny in (y-1,y+1):
            if 0<=ny<NZ:
                row=free[ny,x1:x2+1]&~reg[ny,x1:x2+1]; idx=np.flatnonzero(row)
                if len(idx):
                    for st0 in np.concatenate([[0],np.flatnonzero(np.diff(idx)>1)+1]):
                        st.append((x1+int(idx[st0]),ny))
    return reg,True

def loops(reg):
    R=np.zeros((NZ+2,NX+2),dtype=bool); R[1:-1,1:-1]=reg
    E=defaultdict(list)
    for j,i in zip(*np.nonzero(R)):
        if not R[j,i-1]: E[(i,j+1)].append((i,j))
        if not R[j,i+1]: E[(i+1,j)].append((i+1,j+1))
        if not R[j-1,i]: E[(i,j)].append((i+1,j))
        if not R[j+1,i]: E[(i+1,j+1)].append((i,j+1))
    used=set(); out=[]
    for start in list(E):
        for k in range(len(E[start])):
            if (start,k) in used: continue
            loop=[]; cur=start; prev=None
            while True:
                outs=[(e,n) for n,e in enumerate(E[cur]) if (cur,n) not in used]
                if not outs: break
                if prev is not None and len(outs)>1:
                    din=(cur[0]-prev[0],cur[1]-prev[1])
                    def key(it):
                        d=(it[0][0]-cur[0],it[0][1]-cur[1]); cr=din[0]*d[1]-din[1]*d[0]
                        return 0 if cr<0 else (1 if cr==0 and din[0]*d[0]+din[1]*d[1]>0 else 2)
                    outs.sort(key=key)
                e,n=outs[0]; used.add((cur,n)); loop.append(cur); prev=cur; cur=e
                if cur==start: break
            if len(loop)>=4: out.append(loop)
    return out

def collinear(l):
    n=len(l); return [l[k] for k in range(n)
        if (l[k][0]-l[(k-1)%n][0])*(l[(k+1)%n][1]-l[k][1])!=(l[k][1]-l[(k-1)%n][1])*(l[(k+1)%n][0]-l[k][0])]

def dp(pts,tol):
    n=len(pts)
    if n<4: return pts
    cx=sum(p[0] for p in pts)/n; cz=sum(p[1] for p in pts)/n
    i0=max(range(n),key=lambda k:(pts[k][0]-cx)**2+(pts[k][1]-cz)**2)
    i1=max(range(n),key=lambda k:(pts[k][0]-pts[i0][0])**2+(pts[k][1]-pts[i0][1])**2)
    a,b=min(i0,i1),max(i0,i1)
    def rec(P):
        if len(P)<3: return P
        x0,y0=P[0]; x1,y1=P[-1]; dx,dy=x1-x0,y1-y0; L=math.hypot(dx,dy); best=-1; bi=0
        for k in range(1,len(P)-1):
            d=(math.hypot(P[k][0]-x0,P[k][1]-y0) if L<1e-12 else abs(dx*(P[k][1]-y0)-dy*(P[k][0]-x0))/L)
            if d>best: best,bi=d,k
        return [P[0],P[-1]] if best<=tol else rec(P[:bi+1])[:-1]+rec(P[bi:])
    return rec(pts[a:b+1])[:-1]+rec(pts[b:]+pts[:a+1])[:-1]

def shoelace(p):
    n=len(p); return sum(p[k][0]*p[(k+1)%n][1]-p[(k+1)%n][0]*p[k][1] for k in range(n))/2

def offset(ring,t,ccw):
    n=len(ring); ln=[]
    for k in range(n):
        a=ring[k]; b=ring[(k+1)%n]; dx,dy=b[0]-a[0],b[1]-a[1]; L=math.hypot(dx,dy)
        if L<1e-12: ln.append(None); continue
        nx,ny=(dy/L,-dx/L) if ccw else (-dy/L,dx/L)
        ln.append((a[0]+nx*t,a[1]+ny*t,dx/L,dy/L))
    out=[]
    for k in range(n):
        l1,l2=ln[(k-1)%n],ln[k]
        if l1 is None or l2 is None: continue
        x1,y1,u1,v1=l1; x2,y2,u2,v2=l2; den=u1*v2-v1*u2
        if abs(den)<1e-9: out.append((round(x2,4),round(y2,4))); continue
        s=((x2-x1)*v2-(y2-y1)*u2)/den; out.append((round(x1+u1*s,4),round(y1+v1*s,4)))
    return out

def erode_sq(m,r):
    e=m.copy()
    for _ in range(r):
        t=e.copy(); t[1:]&=e[:-1]; t[:-1]&=e[1:]; e=t
    for _ in range(r):
        t=e.copy(); t[:,1:]&=e[:,:-1]; t[:,:-1]&=e[:,1:]; e=t
    return e
def dilate_sq(m,r):
    e=m.copy()
    for _ in range(r):
        t=e.copy(); t[1:]|=e[:-1]; t[:-1]|=e[1:]; e=t
    for _ in range(r):
        t=e.copy(); t[:,1:]|=e[:,:-1]; t[:,:-1]|=e[:,1:]; e=t
    return e

spaces={}; assign={}
for f in range(4):
    band=slice_mask([s for s in SL if BAND[f][0]-1e-9<=s['height']<=BAND[f][1]+1e-9])
    if f in SHAFT_FLOORS:
        i0,j0=ij(SHAFT[0],SHAFT[2]); i1,j1=ij(SHAFT[1],SHAFT[3]); band[j0:j1+1,i0:i1+1]=True
    sm=SL[int(np.argmin(np.abs(HS-MEAS[f])))]; pm=np.array(sm['p']).reshape(-1,2)
    mx=set(round(float(v),4) for v in pm[:,0]); mz=set(round(float(v),4) for v in pm[:,1])
    if f in SHAFT_FLOORS:
        mx|={SHAFT[0],SHAFT[1]}; mz|={SHAFT[2],SHAFT[3]}
    mx=np.array(sorted(mx)); mz=np.array(sorted(mz))
    seen={}; idx=0
    for r in ROOMS['rooms']:
        if r['floor_index']!=f: continue
        reg,ok=flood(~band,ij(r['position'][0],r['position'][2]))
        assert ok, r['id']
        key=int(reg.sum())
        if key in seen:
            spaces[seen[key]]['members'].append(r['id']); assign[r['id']]=seen[key]; continue
        idx+=1; sid='f%d-S%d'%(f,idx); seen[key]=sid; assign[r['id']]=sid
        dropped=[]
        op=dilate_sq(erode_sq(reg,APPENDAGE_R),APPENDAGE_R)&reg
        rem=reg&~op
        while rem.any():
            j,i=np.argwhere(rem)[0]
            c,_=flood(rem,(int(i),int(j))); rem&=~c
            if c.sum()*CELL*CELL>APPENDAGE_MIN:
                jj,ii=np.nonzero(c)
                dropped.append({'area_m2':round(c.sum()*CELL*CELL,3),
                    'bbox_xz':[round(X0+ii.min()*CELL,3),round(X0+(ii.max()+1)*CELL,3),
                               round(Z0+jj.min()*CELL,3),round(Z0+(jj.max()+1)*CELL,3)]})
                reg&=~c
        rings=[]; resid=0.0
        for l in loops(reg):
            pts=dp([(X0+(p[0]-1)*CELL,Z0+(p[1]-1)*CELL) for p in collinear(l)],0.015)
            n=len(pts); sp=[]
            for k in range(n):
                a,b,c=pts[(k-1)%n],pts[k],pts[(k+1)%n]; X,Z=b
                if abs(a[0]-b[0])<1e-9 or abs(b[0]-c[0])<1e-9:
                    kk=int(np.argmin(np.abs(mx-X)))
                    if abs(mx[kk]-X)<=0.03: resid=max(resid,abs(mx[kk]-X)); X=float(mx[kk])
                if abs(a[1]-b[1])<1e-9 or abs(b[1]-c[1])<1e-9:
                    kk=int(np.argmin(np.abs(mz-Z)))
                    if abs(mz[kk]-Z)<=0.03: resid=max(resid,abs(mz[kk]-Z)); Z=float(mz[kk])
                sp.append((round(X,4),round(Z,4)))
            rings.append(sp)
        rings.sort(key=lambda r:-abs(shoelace(r)))
        area=sum(shoelace(r) for r in rings)
        sub=sum(shoelace(offset(r,LINING,shoelace(r)>0)) for r in rings)
        spaces[sid]={'space_id':sid,'floor_index':f,'members':[r['id']],
            'boundary_xz':[list(p) for p in rings[0]],
            'holes_xz':[[list(p) for p in r] for r in rings[1:]],
            'area_m2':round(area,3),'area_to_substrate_m2':round(sub,3),
            'max_snap_residual_m':round(resid,4),
            'excluded_appendages':dropped,
            'derivation':('R39 delivery: sections.json slice h=%.2f m (datum+%.2f) for the face planes, '
                'union of slices %.2f-%.2f m to close door and window heads, lift-shaft footprint from '
                'level-<n>.glb; 0.01 m raster flood fill, boundary snapped to the slice vertices '
                '(max residual %.3f m); area_m2 is to the finished wall face, area_to_substrate_m2 offsets '
                'every face outward by the measured %.3f m finish lining.')%(
                MEAS[f],MEAS[f]-DAT[f],BAND[f][0],BAND[f][1],resid,LINING)}
json.dump({'version':1,'coordinate_system':'glTF_XZ_metres','model_revision':'R39',
    'source':{'sections.json':ATL.get('revision'),'atlas_sha256':'ca6997dcd567698bef76f46799c3ad132bbbcca0e3a9c63bcce7f60109bdb259'},
    'spaces':list(spaces.values()),'room_to_space':assign},open(ROOT+'/build/web/full/room-spaces.json','w'),indent=1)
print('spaces',len(spaces))
for s in spaces.values():
    print(s['space_id'],s['members'],s['area_m2'],s['area_to_substrate_m2'],len(s['boundary_xz']),'holes',len(s['holes_xz']),s['excluded_appendages'])
