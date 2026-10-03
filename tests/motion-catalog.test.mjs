import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {MOTIONS,STORY,MEDIA,SOURCE} from '../motion-catalog.js';
test('every numbered experiment is reachable from the chronological story',()=>{
 assert.equal(MOTIONS.length,62);
 assert.equal(new Set(MOTIONS.map(m=>m.id)).size,62);
 const ids=new Set(MOTIONS.map(m=>m.id));
 const storyIds=new Set(STORY.flatMap(s=>s.cases));
 assert.deepEqual(storyIds,ids);
 MOTIONS.forEach(m=>{for(const key of ['title','group','kind','description','evidence','parameters','angora'])assert.ok(m[key]?.length>2,`${m.id}: ${key}`);});
});
test('the demo module has an explicit renderer for every documented motion',async()=>{
 const code=await readFile(new URL('../motion-library.js',import.meta.url),'utf8');
 const implemented=new Set([...code.matchAll(/case '([^']+)'/g)].map(m=>m[1]));
 assert.deepEqual(implemented,new Set(MOTIONS.map(m=>m.kind)));
});
test('the reference and Angora assets are clearly distinguished',()=>{
 assert.equal(new URL(SOURCE.page).hostname,'www.era-residence.com');
 Object.values(MEDIA).forEach(url=>assert.ok(['cdn.prod.website-files.com','assets.era-residence.com'].includes(new URL(url).hostname)));
 const crossfade=MOTIONS.find(m=>m.kind==='crossfade');
 assert.match(crossfade.angora,/aynı kamera/);
 assert.match(MOTIONS.find(m=>m.kind==='alpha').angora,/alpha/);
});
