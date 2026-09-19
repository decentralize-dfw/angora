import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {gunzipSync} from 'node:zlib';
import {createWallCaps} from '../src/section.js';

test('Moving wall caps stay filled between floor stops and restore exact final caps',async()=>{
 const base=new URL('../../build/web/native-current/',import.meta.url);
 const exact=JSON.parse(await fs.readFile(new URL('sections-current.json',base)));
 const moving=JSON.parse(gunzipSync(await fs.readFile(new URL('transition-sections.json.gz',base))));
 const caps=createWallCaps(exact,moving);
 for(const height of [1.71,2.45,3.52,4.12,5.55,6.88,8.42,9.96,10.38,11.12]){
  caps.update(height,true);assert.equal(caps.group.visible,true);
  const wall=caps.group.children[0];assert.equal(wall.position.y,height);assert.ok(wall.geometry.index.count>0,`Empty intermediate cap at ${height}`);
 }
 for(const slice of exact.slices){caps.update(slice.height,true);assert.equal(caps.group.children[0].geometry.index.count,slice.i.length);}
 caps.update(17,false);assert.equal(caps.group.visible,false);caps.dispose();
});

test('OSM additions reuse eight mapped envelopes without adding material batches',async()=>{
 const plan=JSON.parse(await fs.readFile(new URL('../../tools/batch-delivery/context-additions.json',import.meta.url)));
 assert.equal(plan.additions.length,8);assert.equal(new Set(plan.additions.map(p=>p.id)).size,8);
 for(const item of plan.additions){assert.ok(item.osm_url.startsWith('https://www.openstreetmap.org/'));assert.ok(item.footprint_xz.length>=4);}
 const report=JSON.parse(await fs.readFile(new URL('../../build/web/batched/report.json',import.meta.url)));
 for(const profile of Object.values(report.profiles))assert.equal(profile.parts.find(p=>p.name==='context-buildings').primitives,5);
});
