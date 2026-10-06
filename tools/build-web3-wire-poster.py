from pathlib import Path
import gzip,json,math,struct
ROOT=Path(__file__).resolve().parents[1]
m=json.loads((ROOT/'assets/web3/wire/manifest.json').read_text());raw=gzip.decompress((ROOT/'assets/web3/wire/exterior.bin.gz').read_bytes());coords=struct.unpack_from('<'+'h'*(m['vertices']*3),raw,8);masks=struct.unpack_from('<'+'I'*(m['vertices']//2),raw,m['maskOffset'])
W,H=1000,850;q=m['quantum'];yaw=-.8
def project(i):
    x,y,z=[coords[i+k]*q for k in range(3)];xx=math.cos(yaw)*x+math.sin(yaw)*z;zz=-math.sin(yaw)*x+math.cos(yaw)*z
    return W*.5+xx*23,H*.5-(.88*y-.475*zz)*23
p=[f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {W} {H}"><title>Angora Twenty One in outline</title><defs><radialGradient id="fade"><stop offset="75%" stop-color="white"/><stop offset="100%" stop-color="black"/></radialGradient><mask id="m"><rect width="1000" height="850" fill="url(#fade)"/></mask></defs><g mask="url(#m)" fill="none" stroke="white" stroke-width=".65">']
for g in m['groups']:
    paths=[];step=1 if g['name']=='villa' else 3
    for v in range(g['start'],g['start']+g['count'],2*step):
        angle=round((yaw%(2*math.pi))/(2*math.pi)*m['visibilityAngles'])%m['visibilityAngles']
        if not ((masks[v//2]>>angle)&1):continue
        i=v*3;j=i+3;a=project(i);b=project(j)
        if math.hypot(a[0]-b[0],a[1]-b[1])<3:continue
        if max(a[0],b[0])<0 or min(a[0],b[0])>W or max(a[1],b[1])<0 or min(a[1],b[1])>H:continue
        paths.append(f'M{a[0]:.1f},{a[1]:.1f}L{b[0]:.1f},{b[1]:.1f}')
    opacity={'villa':.45,'garden':.22,'neighbours':.08,'landscape':.12,'trees':.16}[g['name']]
    p.append(f'<path opacity="{opacity}" d="'+''.join(paths)+'"/>')
p.append('</g></svg>');(ROOT/'assets/web3/wire-poster.svg').write_text(''.join(p));print('Line-only fallback exported.')
