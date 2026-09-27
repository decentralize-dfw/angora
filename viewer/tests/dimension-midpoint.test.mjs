import test from 'node:test';
import assert from 'node:assert/strict';
import {layoutDimensionsAtMidpoint,rectanglesOverlap} from '../src/screen-layout.js';

// Ürün sahibi: "ölçü, o çizginin ortasında sabit bir yerde olmalıdır ve oda
// isimleriyle hiçbir zaman çakışmamalıdır."
const name=(x,y)=>({x,y,width:80,height:22,entry:{kind:'name'}});
const dim=(x,y)=>({x,y,width:44,height:16,entry:{kind:'dimension'}});

test('ölçü tam çizgi ortasında kalır, adla çakışırsa ad yol verir', () => {
  const items=[name(200,200),dim(200,205),dim(400,300)];
  const placed=layoutDimensionsAtMidpoint(items,{width:800,height:600,fixedFrom:1});
  const dims=placed.filter(p=>p.entry.kind==='dimension');
  assert.deepEqual(dims.map(d=>[d.x,d.y]),[[200,205],[400,300]]);
  for(const a of placed)for(const b of placed)if(a!==b)assert.equal(rectanglesOverlap(a.rect,b.rect,0),false);
  const moved=placed.find(p=>p.entry.kind==='name');
  if(moved)assert.equal(moved.x,200);
});

test('çakışan ölçü taşınmaz, gizlenir; yerleşim kameraya göre kararlı', () => {
  const items=[dim(300,300),dim(310,302)];
  const placed=layoutDimensionsAtMidpoint(items,{width:800,height:600,fixedFrom:0});
  assert.equal(placed.length,1);assert.deepEqual([placed[0].x,placed[0].y],[300,300]);
  assert.deepEqual(layoutDimensionsAtMidpoint(items,{width:800,height:600,fixedFrom:0}),placed);
});
