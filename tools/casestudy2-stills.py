"""Extract three real frames for each editorial scene; never reconstruct motion.
Run node tools/casestudy2-manifest.mjs before this script.
"""
from pathlib import Path
import json, subprocess, shutil, concurrent.futures
ROOT=Path(__file__).resolve().parents[1]
FLOWS=json.loads((ROOT/'build/casestudy2-analysis/manifest.json').read_text(encoding='utf-8'))

def extract(flow):
 out=ROOT/'assets/casestudy2'/flow['project']/'stills';out.mkdir(parents=True,exist_ok=True)
 jobs=[]
 for scene in flow['scenes']:
  for index,fraction in enumerate([0,.5,1]):
   time=max(scene['start'],min(scene['end']-1/flow['fps'],scene['start']+scene['duration']*fraction))
   # Choose the first source frame whose timestamp is at or after the requested time.
   import math
   frame=math.ceil(time*flow['fps']-1e-6)
   jobs.append((frame,out/f"{flow['device']}-{scene['id']}-{index}.jpg"))
 frames=sorted(set(frame for frame,_ in jobs))
 temp=ROOT/'build/casestudy2-analysis'/('stills-'+flow['id']);temp.mkdir(parents=True,exist_ok=True)
 selection='+'.join(f'eq(n,{frame})' for frame in frames)
 filters=f"select='{selection}'"
 if flow['device']=='desktop':filters+=',scale=640:350:flags=lanczos'
 command=[shutil.which('ffmpeg'),'-hide_banner','-loglevel','error','-y','-threads','2','-i',str(ROOT/flow['video'].removeprefix('./')),'-vf',filters,'-fps_mode','vfr','-q:v','3',str(temp/'%04d.jpg')]
 subprocess.run(command,check=True)
 files=sorted(temp.glob('*.jpg'))
 if len(files)!=len(frames):raise RuntimeError(f"{flow['id']}: expected {len(frames)} frames, got {len(files)}")
 mapping=dict(zip(frames,files))
 for frame,target in jobs:shutil.copyfile(mapping[frame],target)
 print(flow['id'],len(jobs),'stills',flush=True)

if __name__=='__main__':
 with concurrent.futures.ThreadPoolExecutor(max_workers=2) as pool:list(pool.map(extract,FLOWS.values()))
