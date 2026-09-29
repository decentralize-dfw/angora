from pathlib import Path
import numpy as np,xatlas,json,time
from PIL import Image,ImageDraw
import shapely
U=Path(r'C:\Users\yigit\angora-tur10\adim10\uv');data=json.loads((U/'girdi.json').read_text(encoding='utf-8'));result={'atlaslar':{},'ters_yuz_sayisi':sum(x['cevrilen'] for x in data['ters_yuz']),'ters_yuz_esigi_m':.60,'ters_yuz_detay':data['ters_yuz'],'malzeme_atlas':{r['mat']:r['atlas'] for r in data['mesh']},'kaldi':[]}
for name,size in [('duvar',4096),('zemin',4096),('cephe',2048),('bahce',2048)]:
 t=time.time();members=[r for r in data['mesh'] if r['atlas']==name];atlas=xatlas.Atlas();area=0
 for r in members:
  d=np.load(U/r['data']);pos=d['pos'];idx=d['idx'];atlas.add_mesh(pos.astype(np.float32),idx.astype(np.uint32),uvs=d['uv0'].astype(np.float32));tri=pos[idx];area+=float((np.linalg.norm(np.cross(tri[:,1]-tri[:,0],tri[:,2]-tri[:,0]),axis=1)*.5).sum())
 chart=xatlas.ChartOptions();chart.max_iterations=2;chart.use_input_mesh_uvs=True;chart.max_cost=100;chart.normal_deviation_weight=.01;chart.straightness_weight=0;chart.roundness_weight=0;chart.normal_seam_weight=0;chart.fix_winding=True;pack=xatlas.PackOptions();pack.resolution=size;pack.padding=6;pack.bilinear=True;pack.bruteForce=False;pack.texels_per_unit=40 if size==4096 else 18;atlas.generate(chart_options=chart,pack_options=pack)
 print('[UV]',name,'pack',atlas.width,atlas.height,'atlas',atlas.atlas_count,'charts',atlas.chart_count,'tpu',atlas.texels_per_unit,'sec',time.time()-t,flush=True)
 rec=dict(boyut=size,atlas_sayisi=atlas.atlas_count,alan_m2=area,texel_m=float(atlas.texels_per_unit),dolgu_px=6,chart_sayisi=atlas.chart_count,doluluk=float(atlas.utilization),meshler=[])
 if atlas.atlas_count!=1:
  print('[UV] en parçalı',sorted([(atlas.get_mesh_chart_count(i),r['ob']) for i,r in enumerate(members)],reverse=True)[:15],flush=True)
  result['kaldi'].append(name+' 40 texel/m ile '+str(atlas.atlas_count)+' sayfa gerektiriyor'); (U/'uv-kontrol.json').write_text(json.dumps(result,ensure_ascii=False,indent=1),encoding='utf-8'); raise RuntimeError(name+' tek atlasa sığmadı')
 alltri=[];im=Image.new('RGB',(size,size),(20,20,20));draw=ImageDraw.Draw(im);dens=[]
 for i,r in enumerate(members):
  vm,idx,uv=atlas.get_mesh(i);idx=idx.reshape(-1,3);np.savez(U/(r['data']+'.uv.npz'),vm=vm,idx=idx,uv=uv);tt=uv[idx];alltri.append(tt);rec['meshler'].append(r['ob']);d=np.load(U/r['data']);world=d['pos'][d['idx']];wa=np.linalg.norm(np.cross(world[:,1]-world[:,0],world[:,2]-world[:,0]),axis=1)*.5;ua=np.abs(((tt[:,1,0]-tt[:,0,0])*(tt[:,2,1]-tt[:,0,1])-(tt[:,1,1]-tt[:,0,1])*(tt[:,2,0]-tt[:,0,0])))*.5;valid=wa>1e-5;dens.extend(np.sqrt(ua[valid]/wa[valid])*size)
  color=(80+(i*67)%150,80+(i*113)%150,80+(i*41)%150)
  for tri in tt:draw.polygon([tuple(p) for p in tri*np.array([size,-size])+np.array([0,size])],fill=color,outline=(220,220,220))
 im.save(U/f'uv_{name}.png');tri=np.concatenate(alltri);polys=shapely.polygons(tri);polys=polys[shapely.area(polys)>1e-12];tree=shapely.STRtree(polys);overlap=0;overlaparea=0
 for start in range(0,len(polys),10000):
  pair=tree.query(polys[start:start+10000],predicate='intersects');a=pair[0]+start;b=pair[1];keep=a<b;a=a[keep];b=b[keep]
  if len(a):areas=shapely.area(shapely.intersection(polys[a],polys[b]));bad=areas>1e-10;overlap+=int(bad.sum());overlaparea+=float(areas[bad].sum())
 rec.update(ucgen_cakisma_sayisi=overlap,ucgen_cakisma_alani_uv=overlaparea,texel_m_min=float(np.min(dens)),texel_m_p01=float(np.percentile(dens,1)),texel_m_medyan=float(np.median(dens)),sure_sn=round(time.time()-t,2));result['atlaslar'][name]=rec
 if overlap:result['kaldi'].append(name+' UV üçgen çakışması '+str(overlap))
 if name in ['duvar','zemin'] and rec['texel_m_min']<39.9:result['kaldi'].append(name+' minimum 40 texel/m altında')
 (U/'uv-kontrol.json').write_text(json.dumps(result,ensure_ascii=False,indent=1),encoding='utf-8');print('[UV] KONTROL',name,overlap,'min',rec['texel_m_min'],'median',rec['texel_m_medyan'],flush=True)






