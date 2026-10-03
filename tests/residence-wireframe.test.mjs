import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {gunzipSync} from 'node:zlib';

test('the line-only model contains the villa, garden, neighbours, terrain and trees in one coherent coordinate system',async()=>{
  const base=new URL('../assets/residence/wireframe/',import.meta.url);
  const manifest=JSON.parse(await readFile(new URL('manifest.json',base)));
  const compressed=await readFile(new URL('near-context.bin.gz',base));
  const unpacked=gunzipSync(compressed);
  const depth=gunzipSync(await readFile(new URL('hidden-edges.bin.gz',base)));
  assert.deepEqual(manifest.groups.map(g=>g.name),['villa','garden','neighbours','landscape','trees']);
  assert.equal(unpacked.byteLength,manifest.vertices*3*2);
  assert.equal(depth.readUInt32LE(0),manifest.depthVertices);
  assert.equal(depth.readUInt32LE(4),manifest.depthIndices);
  assert.equal(depth.byteLength,manifest.depthIndexOffset+manifest.depthIndices*4);
  assert.ok(compressed.length<3*1024*1024,'The footer should not load the full textured scene');
  let offset=0;
  for(const group of manifest.groups){assert.equal(group.start,offset);assert.equal(group.count%2,0);assert.ok(group.count>100);offset+=group.count;}
  assert.equal(offset,manifest.vertices);
  const villa=manifest.groups[0];const min=[Infinity,Infinity,Infinity],max=[-Infinity,-Infinity,-Infinity];
  for(let i=0;i<villa.count;i++)for(let axis=0;axis<3;axis++){
    const coordinate=unpacked.readInt16LE((i*3+axis)*2)*manifest.quantum+manifest.target[axis];
    min[axis]=Math.min(min[axis],coordinate);max[axis]=Math.max(max[axis],coordinate);
  }
  assert.ok(max[1]-min[1]>13,'The villa keeps all four floors and its roof');
  assert.ok(max[0]-min[0]>15&&max[2]-min[2]>18,'The actual villa footprint is retained');
});
