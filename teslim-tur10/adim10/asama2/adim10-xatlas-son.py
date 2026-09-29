from pathlib import Path
import numpy as np,xatlas,json,time,shapely
from PIL import Image,ImageDraw
U=Path(r'C:\Users\yigit\angora-tur10\adim10\uv');data=json.loads((U/'girdi.json').read_text(encoding='utf-8'));result={'atlaslar':{},'ters_yuz_sayisi':sum(x['cevrilen'] for x in data['ters_yuz']),'ters_yuz_esigi_m':.60,'ters_yuz_detay':data['ters_yuz'],'malzeme_atlas':{r['mat']:r['atlas'] for r in data['mesh']},'kaldi':[],'aciklama':'Çakışma her fiziksel sayfa içinde sayılır. Bir atlas çok sayfa ise tek atlas koşulu sağlanmaz ve üretime hazır değildir.'}
for name,size in [('zemin',4096),('cephe',2048),('bahce',2048),('duvar',4096)]:
 t=time.time();members=[r for r in data['mesh'] if r['atlas']==name];atlas=xatlas.Atlas();area=0
 for r in members:
  d=np.load(U/r['data']);pos=d['pos'];idx=d['idx'];weld,remap=np.unique(np.round(pos,4),axis=0,return_inverse=True);atlas.add_mesh(weld.astype(np.float32),remap[idx].astype(np.uint32));tri=pos[idx];area+=float((np.linalg.norm(np.cross(tri[:,1]-tri[:,0],tri[:,2]-tri[:,0]),axis=1)*.5).sum())
 chart=xatlas.ChartOptions();chart.max_iterations=2;pack=xatlas.PackOptions();pack.resolution=size;pack.padding=6;pack.bilinear=True;pack.texels_per_unit=40 if size==4096 else 18;atlas.generate(chart_options=chart,pack_options=pack)
 print('[UV]',name,'pack',atlas.width,atlas.height,'pages',atlas.atlas_count,'charts',atlas.chart_count,flush=True)
 rec=dict(boyut=size,atlas_sayisi=atlas.atlas_count,alan_m2=area,texel_m=float(atlas.texels_per_unit),dolgu_px=6,chart_sayisi=atlas.chart_count,meshler=[]);alltri=[];allpages=[];dens=[]
 imgs=[Image.new('RGB',(size,size),(20,20,20)) for _ in range(atlas.atlas_count)];draws=[ImageDraw.Draw(im) for im in imgs]
 for i,r in enumerate(members):
  vm,idx,uv=atlas.get_mesh(i);idx=idx.reshape(-1,3);assignment,_=atlas.get_mesh_vertex_assignment(i);pages=assignment[idx[:,0]];np.savez(U/(r['data']+'.uv.npz'),vm=vm,idx=idx,uv=uv,page=pages);tt=uv[idx];alltri.append(tt);allpages.append(pages);rec['meshler'].append(r['ob']);d=np.load(U/r['data']);world=d['pos'][d['idx']];wa=np.linalg.norm(np.cross(world[:,1]-world[:,0],world[:,2]-world[:,0]),axis=1)*.5;ua=np.abs((tt[:,1,0]-tt[:,0,0])*(tt[:,2,1]-tt[:,0,1])-(tt[:,1,1]-tt[:,0,1])*(tt[:,2,0]-tt[:,0,0]))*.5;valid=(wa>1e-5)&(pages<atlas.atlas_count);dens.extend(np.sqrt(ua[valid]/wa[valid])*size)
  color=(80+(i*67)%150,80+(i*113)%150,80+(i*41)%150)
  for tri,page in zip(tt,pages):
   if page<atlas.atlas_count:draws[page].polygon([tuple(p) for p in tri*np.array([size,-size])+np.array([0,size])],fill=color)
  if i%200==0:print('[UV]',name,'mesh',i,flush=True)
 tri=np.concatenate(alltri);pages=np.concatenate(allpages);overlap=0;overlaparea=0
 for page in range(atlas.atlas_count):
  polys=shapely.polygons(tri[pages==page]);polys=polys[shapely.area(polys)>1e-12];tree=shapely.STRtree(polys)
  for start in range(0,len(polys),10000):
   pair=tree.query(polys[start:start+10000],predicate='intersects');a=pair[0]+start;b=pair[1];keep=a<b;a=a[keep];b=b[keep]
   if len(a):areas=shapely.area(shapely.intersection(polys[a],polys[b]));bad=areas>1e-10;overlap+=int(bad.sum());overlaparea+=float(areas[bad].sum())
  imgs[page].save(U/f'uv_{name}_sayfa{page+1}.png');print('[UV]',name,'page checked',page+1,flush=True)
 overview=Image.new('RGB',(2048,1024*((len(imgs)+1)//2)),(20,20,20));dr=ImageDraw.Draw(overview)
 for k,im in enumerate(imgs):overview.paste(im.resize((1024,990)),((k%2)*1024,(k//2)*1024+34));dr.text(((k%2)*1024+15,(k//2)*1024+10),f'{name} / SAYFA {k+1} / {size}px',fill='white')
 overview.save(U/f'uv_{name}.png');rec.update(ucgen_cakisma_sayisi=overlap,ucgen_cakisma_alani_uv=overlaparea,texel_m_min=float(np.min(dens)),texel_m_p01=float(np.percentile(dens,1)),texel_m_medyan=float(np.median(dens)),sure_sn=round(time.time()-t,2));result['atlaslar'][name]=rec
 if atlas.atlas_count!=1:result['kaldi'].append(name+': '+str(atlas.atlas_count)+' fiziksel sayfa gerekiyor; tek atlas koşulu sağlanmadı')
 if overlap:result['kaldi'].append(name+': '+str(overlap)+' UV üçgen çakışması')
 if name in ['duvar','zemin'] and rec['texel_m_min']<39.9:result['kaldi'].append(name+': bazı yüzlerde minimum40 texel/m sağlanmadı')
 (U/'uv-kontrol.json').write_text(json.dumps(result,ensure_ascii=False,indent=1),encoding='utf-8');print('[UV] SON',name,'overlap',overlap,'min',rec['texel_m_min'],flush=True)
