import ezdxf,json,collections
from ezdxf import bbox
from pathlib import Path
A=Path(r'C:\Users\yigit\angora-tur10\adim09/cad');d=ezdxf.readfile(A/'ANGORA-.dxf');m=d.modelspace();b=d.blocks['KORKULUK 1'];bb=bbox.extents(b);paths=[]
for e in b:
 ps=[e.dxf.start,e.dxf.end] if e.dxftype()=='LINE' else list(e.flattening(.12))
 paths.append({'tip':e.dxftype(),'handle':e.dxf.handle,'points':[[float((p.x-bb.extmin.x)*.01),float((p.y-bb.extmin.y)*.01)] for p in ps]})
r={'kaynak':'ANGORA-.dwg / KORKULUK 1 / 2D$FER','INSUNITS':6,'blok_ham_boyut':[100,80],'yerel_olcek':.01,'olcek_aciklama':'INSUNITS metre, fakat 2D detay 100x80 yerel birim; panel 1.00x0.80m olarak yorumlandı. Blok insert 2.5 pafta ölçeği; dünya yerleşimi için kullanılmadı. Desen koordinatları korunur.','width':1.,'height':.8,'paths':paths};(A/'panel.json').write_text(json.dumps(r,ensure_ascii=False,indent=1),encoding='utf-8');print('path',len(paths),'points',sum(len(r['points']) for r in paths))
for layer in ['KORKULUK','2D$FER','2D$FERFORJE','2D$KTR']:
 es=[e for e in m if e.dxf.layer==layer];print(layer,len(es),dict(collections.Counter(e.dxftype() for e in es)))
