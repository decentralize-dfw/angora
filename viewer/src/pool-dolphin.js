import {SRGBColorSpace, TextureLoader, Vector4} from 'three';

// Havuz tabanındaki lacivert yunus mozaiği (ürün sahibinin arka bahçe
// fotoğrafları: angora_24). Doku assets/review-textures/pool-dolphin-web.png'den
// (beyaz zemini saydam) üretilen pool-dolphin.webp. Desen havuz karolarının
// üstüne DÜNYA koordinatında basılır - modelin UV'lerine bağlı değil - ve
// yalnız TABAN kotunda (duvarlara taşmaz). Yunus havuzun uzun ekseninde,
// ortada, havuz boyunun ~yarısı; başı +x'e (fotoğraftaki gibi eve dönük değil,
// bahçe ucuna), karnı -z'ye bakar.
export const POOL_DOLPHIN = Object.freeze({centerX: 3.3, centerZ: -15.96, length: 5.2, width: 5.2 * 683 / 1024, floorBelow: -1.35});

export function applyPoolDolphin(material, url, spec = POOL_DOLPHIN) {
  if (material.userData.poolDolphin) return false;
  material.userData.poolDolphin = true;
  const map = new TextureLoader().load(url);
  map.colorSpace = SRGBColorSpace; map.anisotropy = 8;
  // x0, z0 = kuyruk/karın köşesi; u baştan kuyruğa (-x yönünde), v karından sırta (+z).
  const rect = new Vector4(spec.centerX + spec.length / 2, spec.centerZ - spec.width / 2, spec.length, spec.width);
  const previous = material.onBeforeCompile, key = material.customProgramCacheKey();
  material.onBeforeCompile = (shader, renderer) => {
    previous.call(material, shader, renderer);
    shader.uniforms.dolphinMap = {value: map};
    shader.uniforms.dolphinRect = {value: rect};
    shader.vertexShader = 'varying vec3 dolphinWorld;\n' + shader.vertexShader.replace('#include <project_vertex>',
      '#include <project_vertex>\ndolphinWorld=(modelMatrix*vec4(transformed,1.0)).xyz;');
    shader.fragmentShader = 'varying vec3 dolphinWorld;\nuniform sampler2D dolphinMap;\nuniform vec4 dolphinRect;\n' +
      shader.fragmentShader.replace('#include <map_fragment>', `#include <map_fragment>
      if(dolphinWorld.y<${spec.floorBelow.toFixed(3)}){
        vec2 dolphinUV=vec2((dolphinRect.x-dolphinWorld.x)/dolphinRect.z,(dolphinWorld.z-dolphinRect.y)/dolphinRect.w);
        if(all(greaterThanEqual(dolphinUV,vec2(0.0)))&&all(lessThanEqual(dolphinUV,vec2(1.0)))){
          vec4 dolphin=texture2D(dolphinMap,dolphinUV);
          diffuseColor.rgb=mix(diffuseColor.rgb,dolphin.rgb,dolphin.a);
        }
      }`);
  };
  material.customProgramCacheKey = () => key + '|pool-dolphin-v1';
  material.needsUpdate = true;
  return true;
}
