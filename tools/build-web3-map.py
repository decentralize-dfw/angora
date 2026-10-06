"""Two genuinely different flat-map layouts from the viewer's registered GIS."""
from pathlib import Path
import json, math
ROOT=Path(__file__).resolve().parents[1]
def read(name):return json.loads((ROOT/f'viewer/src/{name}.json').read_text())
streets,site,places,local,ml=map(read,['region-streets','region-site','region-places','region-local','region-buildings-ml'])
def points(raw):return list(zip(raw[::2],raw[1::2])) if raw and isinstance(raw[0],(int,float)) else raw
def path(raw,closed=True):return 'M'+' '.join(f'{x:.2f},{y:.2f}' for x,y in points(raw))+('Z' if closed else '')
counts={}
for variant,W,H,SCALE in [('desktop',1800,1200,.265),('mobile',900,1300,.18)]:
    CX,CY=W*.5,H*.53
    project=lambda x,y:(CX+x*SCALE,CY+y*SCALE)
    p=[f'<svg xmlns="http://www.w3.org/2000/svg" width="{W}" height="{H}" viewBox="0 0 {W} {H}"><title>Angora 21 neighbourhood map</title><defs><marker id="a" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="8" markerHeight="8" orient="auto"><path d="M1 1L9 5L1 9" fill="none" stroke="#223e35"/></marker></defs><rect width="100%" height="100%" fill="#eef1ec"/>',f'<g transform="translate({CX} {CY}) scale({SCALE})">']
    def shape(d,attrs):p.append(f'<path d="{d}" {attrs}/>')
    shape(''.join(path(a) for a in streets['green']),'fill="#dae3d7"')
    hidden=set(site['osm']['hideBuildings']);hm=set(site['osm'].get('hideMl',[]))
    shape(''.join(path(a) for i,a in enumerate(streets['buildings']) if i not in hidden)+''.join(path(a) for i,a in enumerate(ml['buildings']) if i not in hm),'fill="#223e35" fill-opacity=".10"')
    shape(''.join(path(a) for a in site['roads']),'fill="#ced5cd" fill-rule="evenodd"')
    replaced=set(site['osm']['replacedRoads'])
    for cls,weight,alpha in [(3,.7,.16),(2,1.4,.23),(1,2.1,.3),(0,3,.38)]:
        lines=[path(a,False) for i,(c,_,a) in enumerate(streets['roads']) if c==cls and i not in replaced]
        lines += [path(a,False) for c,a in site['osm']['keptRuns'] if c==cls]
        shape(''.join(lines),f'fill="none" stroke="#506457" stroke-opacity="{alpha}" stroke-width="{weight}" vector-effect="non-scaling-stroke"')
    shape(path(streets['boundary']['ring']),'fill="#223e35" fill-opacity=".025" stroke="#223e35" stroke-width="2.2" stroke-dasharray="7 6" vector-effect="non-scaling-stroke"')
    shape(''.join(path(a) for a in site['houses']),'fill="#657d69" fill-opacity=".3"')
    shape(path(site['plot']),'fill="#698872" fill-opacity=".35"');shape(path(site['villa']),'fill="#223e35"')
    if site.get('pool'):shape(path(site['pool']),'fill="#8eb7c7"')
    p.append('</g>');marks=[];count=[0]*6
    for x,y,g,_ in places['dots']:
        px,py=project(x,y)
        if 15<px<W-15 and 15<py<H-15 and not any(z[2]==g and math.hypot(px-z[0],py-z[1])<3 for z in marks):marks.append((px,py,g))
    for a in places['curated']+local['places']:
        px,py=project(a['x'],a['y']);g=a['g']
        if 15<px<W-15 and 15<py<H-15 and not any(z[2]==g and math.hypot(px-z[0],py-z[1])<3 for z in marks):marks.append((px,py,g))
    for x,y,g in marks:
        count[g]+=1;p.append(f'<circle cx="{x:.1f}" cy="{y:.1f}" r="{10 if variant=="mobile" else 12}" fill="{places["groups"][g]}" stroke="#eef1ec" stroke-width="2"/>')
    vx,vy=project(sum(a[0] for a in site['villa'])/len(site['villa']),sum(a[1] for a in site['villa'])/len(site['villa']))
    p.append(f'<circle cx="{vx}" cy="{vy}" r="22" fill="none" stroke="#223e35" stroke-width="3"/><circle cx="{vx}" cy="{vy}" r="7" fill="#223e35"/>')
    bx,by=max((project(x,y) for x,y in points(streets['boundary']['ring'])),key=lambda a:a[0])
    # Callouts have separate, measured rows. No amenity labels or site gates.
    size=30 if variant=='mobile' else 27
    p.append(f'<path d="M{vx},{vy}L{vx-40},{vy+65}H{vx-240}" fill="none" stroke="#223e35" stroke-width="2"/><text x="{vx-240}" y="{vy+100}" font-size="{size}" font-family="Arial" fill="#223e35" paint-order="stroke" stroke="#eef1ec" stroke-width="8">ANGORA 21</text>')
    p.append(f'<path d="M{bx-10},{by-125}H{bx-170}L{bx-4},{by-4}" fill="none" stroke="#223e35" stroke-width="2" marker-end="url(#a)"/><text x="{bx-280}" y="{by-143}" font-size="{size}" font-family="Arial" fill="#223e35" paint-order="stroke" stroke="#eef1ec" stroke-width="8">Angora Evleri</text>')
    p.append(f'<text x="{W-55}" y="65" font-family="Arial" font-size="30" fill="#223e35">↑ N</text></svg>')
    (ROOT/f'assets/web3/map-{variant}.svg').write_text(''.join(p),encoding='utf-8');counts[variant]=count
(ROOT/'assets/web3/map-data.json').write_text(json.dumps({'counts':counts,'colors':places['groups'],'layers':['Education','Health','Food & drink','Shopping','Parks & sport','Services'],'projection':'north up; viewer local coordinate system','names':False,'gates':False}))
print('Map variants:',counts)
