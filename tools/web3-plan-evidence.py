"""Read-only source inspection for the web3 plan review; no UI or rating tests."""
from pathlib import Path
from io import BytesIO
import json
import re
import subprocess
import xml.etree.ElementTree as ET
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
def read(path):
    return json.loads((ROOT / path).read_text(encoding='utf-8'))

poses = read('assets/residence/chapters/poses.json')
native = read('assets/residence/chapters/native-manifest.json')
films = read('assets/residence/films/manifest.json')
wire = read('assets/residence/wireframe/manifest.json')
region = read('assets/residence/life/angora-map.json')
web2_source=(ROOT/'web2.js').read_text(encoding='utf-8')
hero_frames=int(re.search(r'const CLIPS =[^\n]*frames:\s*(\d+)',web2_source)[1])
iso_frames=int(re.search(r'const FLOOR_CLIPS =[^\n]*frames:\s*(\d+)',web2_source)[1])
map_viewbox=[float(n) for n in ET.parse(ROOT/'assets/residence/life/angora-map.svg').getroot().attrib['viewBox'].split()]

def bounds(points):
    xs, ys = zip(*points)
    return [min(xs), min(ys), max(xs)-min(xs), max(ys)-min(ys)]

floor_facts = []
for floor in poses['floors']:
    room_points = [p for r in floor['rooms'] for p in r['screen']]
    room_points += [[p['x'], p['y']] for p in floor['photos']]
    contour_points = [p for contour in floor['contours'] for p in contour]
    floor_facts.append(dict(floor=floor['floor'], cameras=len(floor['photos']),
        rooms=len(floor['rooms']), contourPoints=len(contour_points),
        roomCameraBounds=bounds(room_points), contourBounds=bounds(contour_points)))

# Sample endpoints and stills directly from Git without changing sparse checkout.
paths = [f'assets/web2/films/{clip}/{variant}/f-{i:03}.webp'
    for clip in ['approach','orbit','garden-return']
    for variant in ['d','m'] for i in [1,hero_frames]]
paths += [f'assets/web2/chapters/level-{level}/{variant}/f-{i:03}.webp'
    for level in [1,2,3] for variant in ['d','m'] for i in [1,iso_frames]]
paths += [f'assets/web2/chapters/iso-{level}-1440.webp' for level in range(4)]
image_facts=[]
for path in paths:
    content=subprocess.check_output(['git','show','HEAD:'+path],cwd=ROOT)
    with Image.open(BytesIO(content)) as img:
        image_facts.append(dict(path=path,width=img.width,height=img.height,bytes=len(content)))

video_paths=[f'assets/residence/films/{clip}/source.mp4'
    for clip in ['opening','approach','orbit','garden-return']]
video_paths += [f'assets/residence/chapters/level-{level}.mp4' for level in [1,2,3]]
video_facts=[]
for path in video_paths:
    probe=json.loads(subprocess.check_output(['ffprobe','-v','error','-select_streams','v:0',
        '-show_entries','stream=width,height,r_frame_rate,nb_frames:format=duration,size',
        '-of','json',str(ROOT/path)],cwd=ROOT))
    video_facts.append(dict(path=path,**probe))

hero_seconds=float(re.search(r'HERO_SECONDS\s*=\s*([.\d]+)',web2_source)[1])
iso_seconds=float(re.search(r'player\.play\(clip, step,\s*([.\d]+)',web2_source)[1])
hero_source_seconds=float(next(v['format']['duration'] for v in video_facts if '/approach/' in v['path']))

result=dict(baseCommit=subprocess.check_output(['git','rev-parse','HEAD'],cwd=ROOT,text=True).strip(),
    scope='Filesystem/Git metadata inspection. No live interaction, visual approval, physical phone or runtime performance pass.',
    floors=floor_facts,imagesSampled=image_facts,videos=video_facts,
    frameRateImplication=dict(note='V1 confused 3x source speed with 3x existing playback speed. These are different durations, not approvals.',
        heroFramesInWeb2=hero_frames,heroSourceSeconds=hero_source_seconds,
        v1SourceBasedHeroSeconds=round(hero_source_seconds/3,4),
        v1AvailableDistinctFramesPerSecond=round(hero_frames/(hero_source_seconds/3),2),
        currentHeroSeconds=hero_seconds,threeTimesCurrentHeroSeconds=round(hero_seconds/3,4),
        isoFramesInWeb2=iso_frames,isoSourceSeconds=native['duration'],
        v1SourceBasedIsoSeconds=round(native['duration']/3,4),
        currentIsoSeconds=iso_seconds,threeTimesCurrentIsoSeconds=round(iso_seconds/3,4)),
    decodedLowerBound=dict(note='Width × height × 4 × frames; excludes browser/GPU overhead and compressed blobs.',
        desktopHeroClipBytes=next(i['width']*i['height']*4*hero_frames for i in image_facts if '/films/approach/d/' in i['path']),
        mobileHeroClipBytes=next(i['width']*i['height']*4*hero_frames for i in image_facts if '/films/approach/m/' in i['path'])),
    wireframe=dict(visibleLineSegments=wire['vertices']//2,radius=wire['radius'],
        invisibleMeshIndices=wire['depthIndices'],target=wire['target']),
    map=dict(viewBox=map_viewbox,points=sum(region['markerCounts']),
        groups=region['allGroups'],sourceRadius=region['markerRadius'],
        dotDiameterAt320CssPx=[round(2*r*320/map_viewbox[2],3) for r in region['markerRadius']]),
    planHeightIllustration=dict(note='Proposed example, not measured UI: 568px viewport minus 48px header reservation.',
        available=520,planAt48Percent=249.6,photoAt30Percent=156,
        minimumSingleRowControls=132,total=537.6,overflow=17.6))
target=ROOT/'docs/web3-plan-evidence-2026-10-05.json'
target.write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
print(json.dumps({k:result[k] for k in ['frameRateImplication','decodedLowerBound','wireframe','map','planHeightIllustration']},ensure_ascii=False,indent=2))
