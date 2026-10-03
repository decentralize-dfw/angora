import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {MOTIONS,STORY,MEDIA,SOURCE} from '../likova-motion-catalog.js';
import {SUPPORTED_KINDS} from '../likova-motion-library.js';

test('all 60 Likova experiments have evidence and occur in the section map',()=>{
 assert.equal(MOTIONS.length,60);
 assert.deepEqual(MOTIONS.map(m=>m.id),Array.from({length:60},(_,i)=>i+1));
 assert.deepEqual(new Set(STORY.flatMap(s=>s.cases)),new Set(MOTIONS.map(m=>m.id)));
 for(const m of MOTIONS)for(const key of ['title','description','evidence','parameters','angora'])assert.ok(m[key]?.length>3,`${m.id} ${key}`);
});
test('every catalog kind has an explicit renderer and a declared capability',async()=>{
 const code=await readFile(new URL('../likova-motion-library.js',import.meta.url),'utf8');
 const actual=new Set([...code.matchAll(/case '([^']+)'/g)].map(m=>m[1]));
 assert.deepEqual(actual,new Set(MOTIONS.map(m=>m.kind)));
 assert.deepEqual(actual,SUPPORTED_KINDS);
});
test('source inventory preserves all 14 sections and separates non-motion plugins',async()=>{
 const data=JSON.parse(await readFile(new URL('../likova-source-inventory.json',import.meta.url),'utf8'));
 assert.equal(data.sections.length,14);assert.equal(data.bindings.length,341);
 assert.ok(data.bindings.some(p=>p.attrs['data-plugin'].includes('utmSave')));
 assert.ok(data.bindings.some(p=>p.attrs['data-plugin'].includes('webglDark')));
 assert.match(data.note,/non-motion/);
});
test('special reference materials and the real camera are clearly identified',()=>{
 assert.equal(new URL(SOURCE.page).hostname,'likova.space');
 Object.values(MEDIA).flat().forEach(url=>assert.equal(new URL(url).hostname,'likova.space'));
 assert.match(MOTIONS.find(m=>m.kind==='camera-path').description,/şemasıdır/);
 assert.match(MOTIONS.find(m=>m.kind==='maps').angora,/Angora verisi değildir/);
 assert.match(MOTIONS.find(m=>m.kind==='video').description,/seek edildiği iddia edilmez/);
});
