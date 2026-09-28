import * as THREE from 'three';

// İçeride gez / bahçede yürürken gökyüzü (ürün sahibi, 28.09: "gökyüzünü
// biraz daha gökyüzü gibi yapabiliriz, hafif bulutlu"). Yukarıdan bakılan
// görünümlerin gökyüzü değişmez; bu yalnız yürürken arka plandır.
//
// Tek seferlik bir küp: gök mavisi eğim, güneş halesi ve düzlem üstüne
// izdüşürülmüş fbm bulutları 512 px'lik küpe bir kez çizilir, güneş
// gerçekten yer değiştirdiğinde yeniden. Kare başına maliyet sıfır - arka
// plan zaten bir küp dokusu. Değerler doğrusal HDR; eğri (ACES 0.8) ve
// grade sonra uygulanır.
const SKY = {
  uniforms: {sunDir: {value: new THREE.Vector3(0, 1, 0)}, daylight: {value: 1}},
  vertexShader: `varying vec3 vDir; void main(){ vDir = position; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
  fragmentShader: `
    uniform vec3 sunDir; uniform float daylight; varying vec3 vDir;
    float hash(vec2 p){ p = fract(p * vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x * p.y); }
    float noise(vec2 p){ vec2 i = floor(p), f = fract(p); vec2 u = f * f * (3.0 - 2.0 * f);
      return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), u.x), mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x), u.y); }
    float fbm(vec2 p){ float v = 0.0, a = 0.5; mat2 m = mat2(1.6, 1.2, -1.2, 1.6);
      for (int i = 0; i < 6; i++) { v += a * noise(p); p = m * p; a *= 0.5; } return v; }
    void main(){
      vec3 d = normalize(vDir);
      float h = max(d.y, 0.0);
      vec3 zenith = vec3(0.17, 0.40, 1.30), horizon = vec3(0.98, 1.16, 1.42);
      vec3 col = mix(horizon, zenith, pow(h, 0.5));
      if (d.y < 0.0) col = mix(horizon, vec3(0.62, 0.64, 0.66), clamp(-d.y * 5.0, 0.0, 1.0));
      vec3 s = normalize(sunDir);
      float mu = max(dot(d, s), 0.0);
      col += vec3(1.0, 0.86, 0.66) * (pow(mu, 10.0) * 0.30 + pow(mu, 900.0) * 8.0);
      if (d.y > 0.015) {
        // hafif bulutlu: düzleme izdüşüm, iki ölçek fbm, ufukta sise karışır
        vec2 uv = d.xz / (d.y + 0.07) * 1.3;
        float n = fbm(uv * 0.85 + vec2(3.1, 1.7));
        float detail = fbm(uv * 3.2 + vec2(7.0, 2.0));
        float cover = smoothstep(0.54, 0.80, n) * (0.72 + 0.4 * detail);
        float fade = smoothstep(0.015, 0.25, d.y);
        vec3 lit = vec3(2.15, 2.12, 2.08) * (0.85 + 0.35 * mu);
        vec3 shade = vec3(1.02, 1.07, 1.16);
        vec3 cloud = mix(shade, lit, smoothstep(0.42, 0.92, n + 0.18 * detail));
        col = mix(col, cloud, clamp(cover * fade, 0.0, 0.88));
      }
      // akşam/gece: gök kararır, bulutlar da
      col *= mix(0.025, 1.0, daylight);
      gl_FragColor = vec4(col, 1.0);
    }`,
};

export function createWalkSky(renderer) {
  const material = new THREE.ShaderMaterial({...SKY, uniforms: THREE.UniformsUtils.clone(SKY.uniforms),
    side: THREE.BackSide, depthWrite: false});
  const scene = new THREE.Scene();
  scene.add(new THREE.Mesh(new THREE.SphereGeometry(100, 48, 24), material));
  const target = new THREE.WebGLCubeRenderTarget(512, {type: THREE.HalfFloatType});
  const camera = new THREE.CubeCamera(1, 1000, target);
  const last = new THREE.Vector3();
  let lastDaylight = -1;
  return {
    texture: target.texture,
    update(direction, daylight) {
      if (lastDaylight >= 0 && last.dot(direction) > 0.9999 && Math.abs(daylight - lastDaylight) < 0.01) return;
      last.copy(direction); lastDaylight = daylight;
      material.uniforms.sunDir.value.copy(direction);
      material.uniforms.daylight.value = daylight;
      camera.update(renderer, scene);
    },
    dispose() { target.dispose(); material.dispose(); },
  };
}
