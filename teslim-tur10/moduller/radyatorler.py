"""M6 — foto 40 ve 42'de farklı açılardan görülen antre dikey radyatörü.
Duvar düzlemi x=2.969 ölçüldü. Boyutlar 2.10 m kapı referansıyla yaklaşık.
"""
import sys,json
from pathlib import Path
sys.path.insert(0,str(Path(__file__).parent))
import ortak as o
o.basla('M6_')
white=o.malzeme('M6_Kirik_beyaz_emaye',(.82,.80,.74),.33,.05)
steel=o.malzeme('M6_Krom_vana',(.55,.55,.55),.25,.8)
x=2.865;y=-.97;bottom=3.22;h=1.67;width=.68;n=10
for i in range(n):
 yy=y-width/2+(i+.5)*width/n
 o.kutu(f'M6_Antre_dilim_{i:02}',(x,yy,bottom+h/2),(.060,width/n-.009,h),white,.006)
for z in [bottom+.022,bottom+h-.022]:
 o.kutu('M6_Antre_kollektor',(x+.02,y,z),(.045,width+.015,.034),white,.007)
for yy in [y-width/2+.03,y+width/2-.03]:
 o.boru('M6_Antre_boru',[(x+.015,yy,3.105),(x+.015,yy,bottom+.08)],.008,white)
 o.kutu('M6_Antre_vana',(x-.009,yy,bottom+.09),(.038,.027,.03),steel,.008)
for z in [bottom+.25,bottom+h-.25]:
 for yy in [y-.23,y+.23]:o.kutu('M6_Antre_duvar_askisi',(2.93,yy,z),(.07,.025,.055),white,.003)
o.bitir('M6_antre',{'fotolar':[40,42],'adet':1,'not':'Aynı x=2.969 antre duvarı iki farklı açıdan görülüyor; iki radyatör üst üste kopyalanmadı. Diğer oda radyatörleri bu aşamada yok.','olcu_m':[width,.10,h]})
