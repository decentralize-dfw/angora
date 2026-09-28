"""Fotoğrafa göre farklı C/S ferforje varyantları; kapalı iri halka kullanılmaz."""
import math
PARAM={
 'bodrum':{'foto':[47,48],'tekrar_m':.28,'ana_yaricap_m':.055,'bordur_m':None,'dikme_m':1.25},
 'giris':{'foto':[42,40],'tekrar_m':.40,'ana_yaricap_m':.060,'bordur_m':.12,'dikme_m':1.45},
 'birinci':{'foto':[18,34],'tekrar_m':.34,'ana_yaricap_m':.052,'bordur_m':.095,'dikme_m':1.30},
 'cati':{'foto':[29],'tekrar_m':.47,'ana_yaricap_m':.075,'bordur_m':None,'dikme_m':1.50},
}
def yap(o,tag,p,length,variant,iron,hand,brass):
 cfg=PARAM[variant]
 ob=o.boru(tag+'_kupeste',[p(0,.96),p(length,.96)],.032 if variant!='bodrum' else .028,hand);ob['varyant']=variant
 for h in [.075,.87]:o.boru(tag+'_cerceve',[p(0,h),p(length,h)],.010,iron)
 posts=max(1,round(length/cfg['dikme_m']))
 for i in range(posts+1):
  t=length*i/posts;o.boru(tag+'_dikme',[p(t,-.04),p(t,.955)],.015,iron);o.kutu(tag+'_ayak',p(t,.012),(.06,.06,.025),iron,.003)
 count=max(1,round(length/cfg['tekrar_m']));w=length/count
 def stroke(suffix,coords,r=.0065):o.boru(tag+suffix,[p(t,h) for t,h in coords],r,iron)
 for k in range(count):
  tc=(k+.5)*w
  # Karşılıklı açık S kolları, dar bel; kapalı elips/daire yok.
  for sign in [-1,1]:
   pts=[]
   for j in range(41):
    t=j/40;pts.append((tc+sign*w*(.12+.32*math.sin(2*math.pi*t)),.12+.69*t))
   stroke('_S_ana',pts)
   # S sapına bağlanan C sürgünleri; girişte iki, birinci katta dört.
   heights=[.32,.65] if variant!='bodrum' else [.47]
   for h in heights:
    x=tc+sign*w*.12;rad=min(cfg['ana_yaricap_m'],w*.22)
    start=(tc+sign*w*(.12+.32*math.sin(2*math.pi*((h+.08-.12)/.69))),h+.08)
    end=(x-sign*rad,h);control=(x-sign*rad,h+.08)
    pts=[((1-t)**2*start[0]+2*t*(1-t)*control[0]+t*t*end[0],(1-t)**2*start[1]+2*t*(1-t)*control[1]+t*t*end[1]) for t in [j/8 for j in range(9)]]
    pts += [(x+sign*rad*(1-j/30*.78)*math.cos(math.pi+j/30*math.pi*1.85),h+rad*(1-j/30*.78)*math.sin(math.pi+j/30*math.pi*1.85)) for j in range(1,31)]
    stroke('_C_surgun',pts,.006)
  if variant=='cati':
   # Foto 29'daki üç sivri yapraklı zambak uçları; ince sapın üstünde.
   for flip in [-1,1]:
    tx=tc+flip*w*.25;hh=.58
    stroke('_zambak_sap',[(tc,.47),(tx,hh)],.006)
    for side in [-1,0,1]:
     base=(tx,hh);tip=(tx+side*.047,hh+(.10 if side==0 else .065))
     q=[p(*base),p(tx+side*.028-.012,hh+.036),p(*tip),p(tx+side*.028+.012,hh+.036)]
     o.mesh(tag+'_zambak_yaprak',q,[(0,1,2,3)],iron)
   o.kutu(tag+'_pirinc_baglanti',p(tc,.47),(.020,.020,.023),brass,.006)
 if cfg['bordur_m']:
  n=max(1,round(length/cfg['bordur_m']));spacing=length/n
  for hh in [.12,.825]:
   for k in range(n):
    x=(k+.5)*spacing;r=min(spacing*.44,.045)
    pts=[(x+r*(1-j/23*.8)*math.cos(j/23*math.pi*2.1),hh+r*(1-j/23*.8)*math.sin(j/23*math.pi*2.1)) for j in range(24)]
    stroke('_kucuk_C_bordur',pts,.0045)
