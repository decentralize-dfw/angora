import ezdxf,json,math,collections
from ezdxf import bbox
from pathlib import Path
from PIL import Image,ImageDraw
A=Path(r'C:\Users\yigit\angora-tur10\adim09/cad');d=ezdxf.readfile(A/'ANGORA-.dxf');b=d.blocks['KORKULUK 1'];bb=bbox.extents(b);print('BLOCK BBOX',bb.extmin,bb.extmax)
paths=[]
for e in b:
 if e.dxftype()=='LINE':ps=[list(e.dxf.start),list(e.dxf.end)]
 elif e.dxftype()=='ARC':ps=[list(p) for p in e.flattening(.0003)]
 else:continue
 paths.append({'tip':e.dxftype(),'handle':e.dxf.handle,'katman':e.dxf.layer,'points':ps})
r={'birim':d.header['$INSUNITS'],'bbox':[list(bb.extmin),list(bb.extmax)],'paths':paths,'inserts':[e.dxfattribs() for e in d.modelspace().query('INSERT') if e.dxf.name=='KORKULUK 1']};(A/'panel-ham.json').write_text(json.dumps(r,default=str,ensure_ascii=False,indent=1),encoding='utf-8');print('inserts',r['inserts'][:8]);print('layers',collections.Counter(e.dxf.layer for e in b))
lo=list(bb.extmin);hi=list(bb.extmax);axes=sorted(range(3),key=lambda i:hi[i]-lo[i],reverse=True)[:2];print('axes',axes)
w,h=1800,1000;scale=min((w-60)/(hi[axes[0]]-lo[axes[0]]),(h-60)/(hi[axes[1]]-lo[axes[1]]));im=Image.new('RGB',(w,h),'white');dr=ImageDraw.Draw(im)
for r in paths:dr.line([(30+(p[axes[0]]-lo[axes[0]])*scale,h-30-(p[axes[1]]-lo[axes[1]])*scale) for p in r['points']],fill='black',width=2)
im.save(A/'korkuluk-blok.png')
