"""M2. Ölçülen üç kat kotu ve merdiven kovasına göre ahşap/ferforje merdiven.
Basamak/rıht ayrı, alt yüzey kesintisiz beyaz diyagonal sıva. Foto 18,34,42,47.
"""
import sys,math,json
from pathlib import Path
sys.path.insert(0,str(Path(__file__).parent))
import ortak as o
o.basla('M2_')
wood=o.malzeme('M2_Ceviz_basamak',(.19,.079,.027),.32)
white=o.malzeme('M2_Beyaz_merdiven_alti',(.81,.79,.73),.8)
iron=o.malzeme('M2_Siyah_dovme_demir',(.018,.020,.018),.36,.72)
hand=o.malzeme('M2_Koyu_ceviz_kupeşte',(.066,.028,.012),.32)
brass=o.malzeme('M2_Korkuluk_ustundeki_pirinc',(.34,.22,.08),.3,.82)
def korkuluk(tag,start,end,variant):
 x0,y0,z0=start;x1,y1,z1=end
 length=math.hypot(x1-x0,y1-y0);ux=(x1-x0)/length;uy=(y1-y0)/length
 def p(t,h):return (x0+ux*t,y0+uy*t,z0+(z1-z0)*t/length+h)
 from korkuluk_motif import yap
 yap(o,tag,p,length,variant,iron,hand,brass)
for level,(base,top,nlower,nupper) in enumerate([(0,3.0996,9,9),(3.0996,6.3714,10,9),(6.3714,9.4705,9,9)]):
 rise=(top-base)/(nlower+nupper);run=.2555;landing=3.1717
 for flight,(n,y0,y1,x0,sgn,z0) in enumerate([(nlower,2.1271,3.1272,landing-nlower*run,1,base),(nupper,.9273,1.9274,landing,-1,base+nlower*rise)]):
  tag=f'M2_K{level}_{flight}';width=y1-y0
  # Beyaz taşıyıcı: ahşap rıhtların altında basamaklı üst yüz, düz eğimli alt yüz.
  profile=[(x0,z0-.12)]
  for j in range(n):
   profile.extend([(x0+sgn*j*run,z0+(j+1)*rise-.034),(x0+sgn*(j+1)*run,z0+(j+1)*rise-.034)])
  profile.append((x0+sgn*n*run,z0+n*rise-.25))
  vs=[(x,y,z) for y in [y0,y1] for x,z in profile];k=len(profile)
  fs=[tuple(reversed(range(k))),tuple(range(k,2*k))]+[(j,(j+1)%k,(j+1)%k+k,j+k) for j in range(k)]
  o.mesh(tag+'_beyaz_altyapi',vs,fs,white)
  for j in range(n):
   z=z0+(j+1)*rise;x=x0+sgn*(j+.5)*run
   o.kutu(tag+'_basamak',(x-sgn*.013,(y0+y1)/2,z-.017),(run+.029,width+.016,.034),wood,.009)
   o.kutu(tag+'_riht',(x0+sgn*j*run,(y0+y1)/2,z-rise/2-.012),(.023,width,rise-.024),wood,.003)
  inner=y0 if flight==0 else y1
  # Foto 47: bodrumun alt kolunda korkuluk açık dış kenardadır, üst katlarla aynı değil.
  if level==0 and flight==0:inner=y1
  endx=x0+sgn*n*run
  variant=['bodrum','giris','birinci'][level]
  if level==2 and flight==1:
   # Foto 29'un eğimli kolu zambak uçlu çatı varyantıdır.
   # Son rıhtın ölçülen x=1.1319 kenarında galeriye bağlanır.
   endx=1.108;variant='cati'
  korkuluk(tag+'_korkuluk',(x0,inner,z0),(endx,inner,z0+n*rise),variant)
 z=base+nlower*rise
 o.kutu(f'M2_K{level}_sahanlik',(3.6717,2.02725,z-.018),(1.0,2.1999,.036),wood,.009)
 o.kutu(f'M2_K{level}_sahanlik_alti',(3.6717,2.02725,z-.143),(1.0,2.1999,.214),white,.004)
# Her katın orijinal yatay küpeşte bileşeni ayrı ölçüldü (adim02-olcum.json).
galleries=[(3.0996,'giris',[((.869,.904),(2.969,.904))]),
           (6.3714,'birinci',[((.1835,-.4278),(.1835,.9627)),((.1835,-.4278),(1.7182,-.4278))]),
           (9.4705,'cati',[((1.108,1.9274),(1.108,3.128))])]
for level,(z,variant,segments) in enumerate(galleries):
 for j,(a,b) in enumerate(segments):
  korkuluk(f'M2_K{level}_bosluk_korkuluk_{j}',(*a,z),(*b,z),variant)
# Yalnız eski merdiven ahşabı ve kovadaki metal; duvar/kapı/zemin malzemeleri korunur.
p=o.W/'silme-kutulari.json';boxes=json.loads(p.read_text(encoding='utf-8'))
boxes=[b for b in boxes if not b['ad'].startswith('M2_') and b['ad']!='107 eski ahsap karyola, silte ve ortu']
boxes.append({'ad':'M2_eski_basamak_ve_korkuluk','katman':'mimari','min':[.12,-.51,.001],'max':[4.19,3.15,10.5],'malzemeler':['Simple wood','metal.001']})
boxes.append({'ad':'M2_eski_kupeşte_ve_pirinc','katman':'mobilya','min':[.12,-.51,.001],'max':[4.19,3.15,10.5],'malzemeler':['brass (4)','R31 | R33 antique nook walnut']})
boxes.append({'ad':'M2_INTERIOR_eski_beyaz_merdiven','katman':'mobilya','min':[.75,.90,-.01],'max':[4.19,3.15,9.47],'malzemeler':['Simple White Wall'],'not':'Foto47 ray ölçümü: interior.002 üzerindeki eski beyaz basamaklar; EKLER merdiveni korunur.'})
p.write_text(json.dumps(boxes,ensure_ascii=False,indent=1),encoding='utf-8')
o.bitir('M2',{'katlar':3,'riht':55,'fotolar':[18,34,42,47,29],'varyantlar':{'bodrum':[47],'giris':[42,40],'birinci':[18,34],'cati':[29]},'olcum':'mimari-olcum.json'})
