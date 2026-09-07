"""Render each review camera in a fresh Blender process and record source hashes.

Fresh processes avoid the Cycles importance-map stall observed on the third
camera of one long cloud rendering process. Failures leave a per-camera log.
"""
import argparse,hashlib,json,os,subprocess,time
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
p=argparse.ArgumentParser();p.add_argument('--samples',type=int,default=24);p.add_argument('--width',type=int,default=1000)
p.add_argument('cameras',nargs='+');args=p.parse_args()
native=ROOT/'build/blender/angora21-working.blend';digest=hashlib.sha256(native.read_bytes()).hexdigest()
path=ROOT/'build/renders/render-manifest.json'
manifest=json.loads(path.read_text()) if path.exists() else {}
if manifest.get('native_sha256')!=digest:manifest={'native_sha256':digest,'stage':'work_in_progress','images':{}}
for name in args.cameras:
    log=ROOT/'build/intermediate'/('render-'+name+'.log');started=time.time()
    cmd=['bash',str(ROOT/'tools/run_blender.sh'),str(native),'--python',str(ROOT/'tools/render_review.py'),'--',
         '--samples',str(args.samples),'--width',str(args.width),name]
    with log.open('w') as stream:subprocess.run(cmd,cwd=ROOT,stdout=stream,stderr=subprocess.STDOUT,check=True,timeout=300)
    image=ROOT/'build/renders'/(name+'.png')
    manifest['images'][name]={'file':image.relative_to(ROOT).as_posix(),'sha256':hashlib.sha256(image.read_bytes()).hexdigest(),
                             'width':args.width,'samples':args.samples,'seconds':round(time.time()-started,2)}
    path.write_text(json.dumps(manifest,ensure_ascii=False,indent=2))
    print('FINISHED',name,manifest['images'][name]['seconds'],flush=True)
