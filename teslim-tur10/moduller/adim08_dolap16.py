import sys,json
from pathlib import Path
sys.path.insert(0,str(Path(__file__).parent))
import ortak as o
import bpy
o.basla('A08_D16_')
wood=o.malzeme('A08_Ceviz',(.15,.08,.035),.52);mirror=o.malzeme('A08_Ayna',(.92,.92,.92),.025,1)
# Two broad sliding leaves on each perpendicular cupboard run, at measured front planes.
for face,start,end,fixed in [('X',3.46,5.82,2.385),('Y',.36,2.39,4.005)]:
 w=(end-start)/2;bottom=6.401;top=8.69
 for k in range(2):
  a=start+k*w;b=a+w;plane=fixed+(.012 if k else 0)*(1 if face=='Y' else -1)
  def box(name,u,z,su,sz,mat,depth=.028):
   pos=(plane,u,z) if face=='X' else (u,plane,z);size=(depth,su,sz) if face=='X' else (su,depth,sz);return o.kutu('A08_D16_'+face+str(k)+'_'+name,pos,size,mat,.003)
  for u in [a+.035,b-.035]:box('dikme',u,(top+bottom)/2,.07,top-bottom,wood)
  for z in [bottom+.035,top-.035]:box('ray', (a+b)/2,z,w,.07,wood)
  box('ayna',(a+b)/2,(top+bottom)/2,w-.145,top-bottom-.145,mirror if k else wood,.014)
# Hide measured original hinged facade/handles behind the new sliding leaves.
p=o.W/'silme-kutulari.json';boxes=json.loads(p.read_text(encoding='utf-8'));boxes=[b for b in boxes if not b['ad'].startswith('A08_D16_')]
for layer in ['mimari','mobilya']:
 for i,(lo,hi) in enumerate([([2.30,3.43,6.39],[2.445,5.84,8.72]),([.34,3.94,6.39],[2.41,4.02,8.72])]):
  boxes.append({'ad':f'A08_D16_{layer}_{i}','katman':layer,'min':lo,'max':hi,'malzemeler':['wood_honey','FINISH | Silver mirror','brass (4)'],'not':'Ölçülen eski menteşeli dolap önleri yerine sürgülü ayna kanatlar; yan gövde korunur.'})
p.write_text(json.dumps(boxes,ensure_ascii=False,indent=1),encoding='utf-8')
o.bitir('A08_D16',{'foto':16,'kanat':'L gömme dolap, her yüzde bir ceviz ve bir ayna sürgülü kanat, ceviz ray/çerçeve'})
