from pathlib import Path
import urllib.request,json,concurrent.futures
A=Path(r"C:\Users\yigit\angora-tur10\adim08\stok")
opener=urllib.request.build_opener();opener.addheaders=[('User-Agent','AngoraMaterialStudy/1.0')];urllib.request.install_opener(opener)
assets=['european_walnut_veneer_05','cherry_veneer','oak_veneer_01','black_oak_veneer','terracotta_floor_tiles']
def get(asset):
 data=json.load(urllib.request.urlopen('https://api.polyhaven.com/files/'+asset));folder=A/asset;folder.mkdir(exist_ok=True);result={}
 for target,keys in [('albedo',['Diffuse','diff']),('normal',['nor_gl']),('roughness',['Rough','rough'])]:
  key=next(k for k in keys if k in data);x=data[key]['4k'];variant=x.get('jpg') or x.get('png');url=variant['url'];path=folder/(target+Path(url).suffix)
  urllib.request.urlretrieve(url,path);result[target]=dict(url=url,path=str(path))
 (folder/'kaynak.json').write_text(json.dumps(result,indent=1),encoding='utf-8');print('[stok]',asset,flush=True)
with concurrent.futures.ThreadPoolExecutor(max_workers=4) as e:list(e.map(get,assets))
