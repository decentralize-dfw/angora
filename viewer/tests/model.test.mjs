import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createHash} from 'node:crypto';

test('Bundled GLB geometry agrees with all manifest hashes and 1.6 m cuts',()=>{
  const dir=new URL('../public/models/',import.meta.url);
  const manifest=JSON.parse(fs.readFileSync(new URL('manifest.json',dir)));
  assert.equal(manifest.assets.length,6);
  for(const asset of manifest.assets) {
    const data=fs.readFileSync(new URL(asset.file,dir));
    assert.equal(createHash('sha256').update(data).digest('hex'),asset.sha256);
    assert.equal(data.length,asset.bytes);assert.ok(data.length<11800000,'individual asset budget');
    const gltf=JSON.parse(data.subarray(20,20+data.readUInt32LE(12)).toString().trim());
    assert.ok(gltf.extensionsRequired.includes('KHR_draco_mesh_compression'));
    if(asset.id.startsWith('floor-')) {
      assert.ok(Math.abs(asset.section_elevation_m-asset.floor_elevation_m-1.6)<1e-6);
      for(const mesh of gltf.meshes)for(const p of mesh.primitives) {
        const a=gltf.accessors[p.attributes.POSITION];
        assert.ok(a.max[1]<=asset.section_elevation_m+.001,asset.id+' upper bound');
        assert.ok(a.min[1]>=asset.floor_elevation_m-.601,asset.id+' lower bound');
      }
    }
  }
});
