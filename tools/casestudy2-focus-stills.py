"""Extract the first real source frame for each curated comparison interval.
Run node tools/casestudy2-manifest.mjs before this script.
"""
from pathlib import Path
import json, shutil, subprocess

ROOT = Path(__file__).resolve().parents[1]
flows = json.loads((ROOT / 'build/casestudy2-analysis/manifest.json').read_text(encoding='utf-8'))
out = ROOT / 'assets/casestudy2/focus'
out.mkdir(parents=True, exist_ok=True)
jobs = {}
for active in flows.values():
    if active['project'] != 'active':
        continue
    for scene in active['scenes']:
        for ref in scene['review']['references']:
            if 'focus' in ref:
                jobs[(ref['flow'], ref['key'])] = ref['focus']['sourceStart']
for (flow_id, key), source_time in jobs.items():
    flow = flows[flow_id]
    filters = 'scale=640:350:flags=lanczos' if flow['device'] == 'desktop' else 'null'
    subprocess.run([shutil.which('ffmpeg'), '-hide_banner', '-loglevel', 'error', '-y', '-ss', str(source_time - flow['offset']), '-i', str(ROOT / flow['video']), '-vf', filters, '-frames:v', '1', '-q:v', '3', str(out / f'{flow_id}-{key}.jpg')], check=True)
    print(flow_id, key, source_time, flush=True)
