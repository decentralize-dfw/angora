"""Foto 29: onaylanan yerel kapı üstü/yan duvar değişimi; kaynak mimariye yazmaz."""
import sys,json
from pathlib import Path
sys.path.insert(0,str(Path(__file__).parent))
from ortak import *
basla('M3C_')
mat=malzeme('SimpleWhiteWall',(.86,.82,.75),.85)
def prizma(ad,poly):
 n=len(poly);vs=[(x,y,z) for y in (3.547,3.81) for x,z in poly]
 fs=[tuple(reversed(range(n))),tuple(range(n,2*n))]
 fs += [(i,(i+1)%n,(i+1)%n+n,i+n) for i in range(n)]
 return mesh('M3C_'+ad,vs,fs,mat)
# Fotoğraftaki iki pah, yaklaşık 15 cm. Geçiş net genişliği 1.04 m.
prizma('sol_yan',[(-.40,9.47),(-.18,9.47),(-.18,11.22),(-.03,11.40),(-.40,11.40)])
prizma('sag_yan',[(.86,9.47),(1.02,9.47),(1.02,11.40),(.71,11.40),(.86,11.22)])
prizma('kapi_ustu',[(-.40,11.40),(1.02,11.40),(1.02,11.412),(-.40,12.392)])
boxes=json.loads((W/'silme-kutulari.json').read_text(encoding='utf-8'))
boxes=[b for b in boxes if b['ad']!='Tur10_foto29_yerel_duvar']
boxes.append({'ad':'Tur10_foto29_yerel_duvar','katman':'mimari','min':[-.4,3.44,9.475],'max':[1.02,3.83,12.5],'malzemeler':['SimpleWhiteWall'],'kes':True,'not':'Kullanıcı onaylı yerel kapı üstü/yan duvar; yüzler kutu sınırında bölünür.'})
(W/'silme-kutulari.json').write_text(json.dumps(boxes,ensure_ascii=False,indent=1),encoding='utf-8')
bitir('M3C_cati_duvar','Foto29 yerel geçiş: 1.04m, 15cm pah; referans dosyasına yazılmadı.')
