import test from 'node:test';
import assert from 'node:assert/strict';
import {SpotLight,MeshStandardMaterial,ShaderLib} from 'three';
import {createFixtureVertices} from '../src/fixture-vertices.js';
import {prepareBatchedMaterial} from '../src/batched-material.js';
function setup(baked=false){
 const light=new SpotLight(0xffffff,20);light.position.set(0,3,0);light.target.position.set(0,0,0);
 const controller={slots:[{light}]},fixture=createFixtureVertices(controller),material=new MeshStandardMaterial();
 material.userData.angoraBatch={materials:['wood'],grid:1,pad:4/512,inner:504/512};
 material.userData.hasElectricBake=baked;fixture.apply(material);prepareBatchedMaterial(material);
 const shader={uniforms:{},vertexShader:ShaderLib.standard.vertexShader,fragmentShader:ShaderLib.standard.fragmentShader};
 material.onBeforeCompile(shader,{});return {shader,fixture,light};
}
test('Furniture fixture diffuse tracks lights without per-pixel spot BRDF loops',()=>{
 const {shader,fixture,light}=setup();
 assert.ok(shader.vertexShader.includes('fixtureDiffuse+='));
 assert.ok(!shader.fragmentShader.includes('NUM_SPOT_LIGHTS'));
 assert.ok(shader.fragmentShader.includes('getDirectionalLightInfo'));
 assert.equal(shader.uniforms.fixtureRadiance.value[0].x,20);
 light.intensity=0;fixture.update();assert.equal(shader.uniforms.fixtureRadiance.value[0].x,0);
});
test('Baked architectural receivers do not receive fixture light twice',()=>{
 const {shader}=setup(true);
 assert.ok(!shader.vertexShader.includes('fixtureDiffuse+='));
 assert.ok(!shader.fragmentShader.includes('NUM_SPOT_LIGHTS'));
});
