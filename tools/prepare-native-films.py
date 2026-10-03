"""Prepare the canvas recordings exported by the actual villa viewer.

Run after tools/capture-residence.mjs and the viewer's Record presentation button.
FFmpeg is required. No camera movement or model geometry is synthesized here.
"""
import json
import hashlib
import math
import subprocess
from pathlib import Path

root = Path(__file__).resolve().parents[1] / 'assets/residence/chapters'
poses = json.loads((root / 'poses.json').read_text(encoding='utf-8'))
manifest = {
    'fps': 24, 'width': 1280, 'height': 720,
    'revision': hashlib.sha256((root / 'poses.json').read_bytes()).hexdigest()[:12],
    'source': 'Actual Three.js viewer, Tur 10 model. Native floor clipping, camera flights and orthographic plans.',
    'crops': [
        {'x': .32, 'y': .58, 'width': .40, 'height': .35},
        {'x': .29, 'y': .08, 'width': .43, 'height': .83},
        {'x': .28, 'y': .06, 'width': .45, 'height': .87},
        {'x': .28, 'y': .07, 'width': .44, 'height': .85},
    ],
}

def run(*args):
    subprocess.run(['ffmpeg', '-hide_banner', '-loglevel', 'error', '-y', *map(str, args)], check=True)

for kind, key in [('floors', 'isometric'), ('plans', 'plans')]:
    target = root / f'{kind}-frames'
    target.mkdir(exist_ok=True)
    frames = math.ceil(poses[key]['stops'][-1] * 24) + 1
    duration = frames / 24
    vf = 'fps=24,tpad=stop_mode=clone:stop_duration=3'
    run('-i', root / f'{kind}.webm', '-vf', vf, '-frames:v', frames,
        '-c:v', 'libwebp', '-f', 'image2', '-quality', 84,
        '-start_number', 0, target / 'frame-%04d.webp')
    run('-i', root / f'{kind}.webm', '-vf', vf, '-t', duration,
        '-c:v', 'libx264', '-crf', 20, '-pix_fmt', 'yuv420p',
        '-movflags', '+faststart', root / f'{kind}-native.mp4')
    manifest[key] = {'id': f'{kind}-frames', 'frames': frames, **poses[key]}

for kind in ['iso', 'plan']:
    for floor in range(4):
        source = root / f'{kind}-{floor}.png'
        if source.exists():
            run('-i', source, '-quality', 90, root / f'{kind}-{floor}.webp')
        elif not (root / f'{kind}-{floor}.webp').exists():
            raise FileNotFoundError(f'Record the missing still: {source}')
(root / 'native-manifest.json').write_text(json.dumps(manifest, indent=2), encoding='utf-8')
print('Prepared recorded floors and plans:', manifest['isometric']['frames'], manifest['plans']['frames'])
