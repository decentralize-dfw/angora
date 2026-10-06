"""Reproducible Web3 delivery media. No generated images or changed source assets."""
from pathlib import Path
from PIL import Image, ImageOps
import hashlib, json, subprocess, shutil, sys

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'assets/web3'
OUT.mkdir(parents=True, exist_ok=True)
def read(p): return json.loads((ROOT/p).read_text(encoding='utf-8'))
def run(args): subprocess.run(args, check=True, stdout=subprocess.DEVNULL)
def ff(*args): run(['ffmpeg','-hide_banner','-loglevel','error','-y',*map(str,args)])
atlas = json.loads((ROOT/'assets/residence/atlas-data.js').read_text(encoding='utf-8').split('window.ANGORA_ATLAS=')[1].strip().rstrip(';'))
poses = read('assets/residence/chapters/poses.json')
films_only='--films-only' in sys.argv
manifest = read('assets/web3/manifest.json') if films_only else {'version':1,'photos':{},'films':{},'floors':[], 'sources': {'listing':'https://remax.com.tr/tr/portfoy/P56131836','checked':'2026-10-05','priceTRY':99000000}}
def picture(key, source, kind, widths=(400,800,1600)):
    dest=OUT/'photos'; dest.mkdir(exist_ok=True)
    with Image.open(source) as raw:
        image=ImageOps.exif_transpose(raw).convert('RGB')
        variants=[]
        for width in widths:
            width=min(width,image.width)
            name=f'{key}-{width}.webp'
            scaled=image.resize((width,round(image.height*width/image.width)),Image.Resampling.LANCZOS)
            scaled.save(dest/name,quality=89,method=6)
            variants.append({'url':f'assets/web3/photos/{name}','width':width,'height':scaled.height})
        manifest['photos'][key]={'source':source.relative_to(ROOT).as_posix(),'sha256':hashlib.sha256(source.read_bytes()).hexdigest(),'kind':kind,'width':image.width,'height':image.height,'variants':variants}
for photo in ([] if films_only else atlas['photos']):
    picture(Path(photo['file']).stem, ROOT/'photogallery-v2'/photo['file'], 'registered property photograph')
for name in ([] if films_only else ['front','pool-garden','garden-facade','pool-terrace','neighbourhood']):
    picture(name,ROOT/f'assets/residence/new/{name}.webp','owner supplied exterior image')
for name in ([] if films_only else ['green','social']):
    picture('life-'+name,ROOT/f'assets/residence/life/{name}-autumn.webp','existing seasonal adaptation; provenance in residence/life/provenance.json')

def movie(key, source, seconds, width, reverse=False):
    dest=OUT/'films'; dest.mkdir(exist_ok=True)
    probe=json.loads(subprocess.check_output(['ffprobe','-v','error','-select_streams','v:0','-show_entries','stream=nb_frames:format=duration','-of','json',str(source)]))
    duration=float(probe['format']['duration'])
    source_frames=int(probe['streams'][0]['nb_frames']);count=round(seconds*60)
    # Select a uniform set INCLUDING BOTH endpoints. A simple setpts+fps loses
    # the source's final frames when the target clip is only 11/14 frames long.
    indices=[round(i*(source_frames-1)/(count-1)) for i in range(count)]
    selection='+'.join(f'eq(n\\,{i})' for i in indices)
    filters=('reverse,' if reverse else '')+f'select={selection},setpts=N/(60*TB),scale={width}:-2:flags=lanczos'
    url=dest/f'{key}.mp4'
    ff('-i',source,'-vf',filters,'-r','60','-frames:v',count,'-an','-c:v','libx264','-preset','fast','-crf','17','-pix_fmt','yuv420p','-movflags','+faststart',url)
    ff('-i',url,'-frames:v','1','-c:v','libwebp','-lossless','1','-compression_level','3',dest/f'{key}-first.webp')
    ff('-sseof','-0.02','-i',url,'-frames:v','1','-c:v','libwebp','-lossless','1','-compression_level','3',dest/f'{key}-last.webp')
    actual=json.loads(subprocess.check_output(['ffprobe','-v','error','-select_streams','v:0','-show_entries','stream=nb_frames,width,height:format=duration','-of','json',str(url)]))
    manifest['films'][key]={'url':f'assets/web3/films/{key}.mp4','first':f'assets/web3/films/{key}-first.webp','last':f'assets/web3/films/{key}-last.webp','seconds':float(actual['format']['duration']),'targetSeconds':seconds,'frames':int(actual['streams'][0]['nb_frames']),'width':actual['streams'][0]['width'],'height':actual['streams'][0]['height'],'source':source.relative_to(ROOT).as_posix(),'sourceFrames':source_frames,'reversed':reverse,'endpointFrames':[source_frames-1,0] if reverse else [0,source_frames-1]}
for name in ['approach','orbit','garden-return']:
    for size,width in [('d',1280),('m',854)]:
        reversed_source=name=='garden-return'
        movie(name+'-'+size, ROOT/f'assets/residence/films/{name}/source.mp4', .7/3, width,reversed_source)
        movie(name+'-back-'+size, ROOT/f'assets/residence/films/{name}/source.mp4', .7/3, width,not reversed_source)
for level in [1,2,3]:
    for size,width in [('d',1920),('m',1280)]:
        movie(f'level-{level}-{size}', ROOT/f'assets/residence/chapters/finished/level-{level}.mp4', .55/3, width)
        movie(f'level-{level}-back-{size}', ROOT/f'assets/residence/chapters/finished/level-{level}.mp4', .55/3, width, True)
manifest['floors']=[]
for i,floor in enumerate(poses['floors']):
    target=OUT/'plans';target.mkdir(exist_ok=True)
    for mode,src in [('iso',ROOT/f'assets/residence/chapters/finished/iso-{i}.webp'),('plan',ROOT/f'assets/residence/chapters/plan-{i}.webp')]:
        if mode=='iso':
            endpoint=OUT/'films'/('level-1-d-first.webp' if i==0 else f'level-{i}-d-last.webp')
            shutil.copyfile(endpoint,target/f'{mode}-{i}.webp')
        else:shutil.copyfile(src,target/f'{mode}-{i}.webp')
    photos=[]
    for n,projection in enumerate(floor['photos']):
        p=next(p for p in atlas['photos'] if p['id']==projection['id'])
        photos.append({**projection,'number':n+1,'file':p['file'],'key':Path(p['file']).stem,'room':p.get('roomId'),'hfov':p.get('hfov'),'name':p.get('en','')})
    manifest['floors'].append({**floor,'photos':photos,'iso':f'assets/web3/plans/iso-{i}.webp','plan':f'assets/web3/plans/plan-{i}.webp'})
temporary=OUT/'manifest.next.json'
temporary.write_text(json.dumps(manifest,ensure_ascii=False,separators=(',',':')),encoding='utf-8')
temporary.replace(OUT/'manifest.json')
print(f"Web3: {len(manifest['photos'])} photographs, {len(manifest['films'])} films, four registered plans.")
