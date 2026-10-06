"""Make web-playable, viewport-only recordings from the owner's three captures.

Frames retain their original 60 fps timing. No motion is reconstructed.
Usage: python tools/prepare-casestudy2.py [--site era|likova|active]
"""
from pathlib import Path
import argparse, subprocess, shutil, json, concurrent.futures

ROOT=Path(__file__).resolve().parents[1]
SOURCES={'era':Path.home()/'Videos/2026-10-05 13-16-27.mp4','likova':Path.home()/'Videos/2026-10-05 13-20-35.mp4','active':Path.home()/'Videos/2026-10-05 15-29-15.mp4'}
TAKES=[
 dict(id='era-desktop',site='era',device='desktop',start=3.0,end=151.0,crop=[0,152,2540,1388]),
 dict(id='era-mobile',site='era',device='mobile',start=160.0,end=238.0,crop=[594,254,426,636]),
 dict(id='likova-mobile',site='likova',device='mobile',start=3.0,end=110.0,crop=[594,254,426,636]),
 dict(id='likova-desktop',site='likova',device='desktop',start=113.5,end=264.8,crop=[0,152,2540,1388]),
 dict(id='active-desktop',site='active',device='desktop',start=4.0,end=110.0,crop=[0,152,2540,1388]),
 dict(id='active-mobile',site='active',device='mobile',start=122.0,end=207.0,crop=[594,254,426,636]),
]

def prepare(take):
 out=ROOT/'assets/casestudy2'/take['site'];out.mkdir(parents=True,exist_ok=True)
 file=out/(take['device']+'.mp4');x,y,w,h=take['crop'];filters=f'crop={w}:{h}:{x}:{y}'
 if take['device']=='desktop':filters+=',scale=1920:-2:flags=lanczos'
 command=[shutil.which('ffmpeg'),'-hide_banner','-loglevel','error','-y','-ss',str(take['start']),'-i',str(SOURCES[take['site']]),'-t',str(take['end']-take['start']),'-vf',filters,'-an','-c:v','libx264','-threads','4','-preset','fast','-crf','21','-pix_fmt','yuv420p','-g','60','-keyint_min','60','-sc_threshold','0','-movflags','+faststart',str(file)]
 subprocess.run(command,check=True)
 info=json.loads(subprocess.check_output([shutil.which('ffprobe'),'-v','error','-select_streams','v:0','-show_entries','format=duration,size:stream=width,height,r_frame_rate','-of','json',str(file)]))
 record={**take,'sourceFile':SOURCES[take['site']].name,'sourceResolution':[2560,1600],'sourceFPS':60,'sourceOffset':take['start'],'processed':info,'processing':'Viewport crop; desktop resized to 1920 px; H.264; no audio; original frame timing. Mobile is Chrome responsive emulation at 459 × 686 CSS px, not a physical phone recording.'}
 (out/(take['device']+'-provenance.json')).write_text(json.dumps(record,ensure_ascii=False,indent=2),encoding='utf-8')
 print(take['id'],info['format'],flush=True)

if __name__=='__main__':
 parser=argparse.ArgumentParser();parser.add_argument('--site',choices=list(SOURCES));parser.add_argument('--take');args=parser.parse_args()
 with concurrent.futures.ThreadPoolExecutor(max_workers=2) as pool:list(pool.map(prepare,[t for t in TAKES if (not args.site or t['site']==args.site) and (not args.take or t['id']==args.take)]))
