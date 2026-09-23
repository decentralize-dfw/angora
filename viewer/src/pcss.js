import {ShaderChunk} from 'three';

// FAZ 7 İŞ 2 - PCSS: contact-hardening sun shadow. One fixed 2048/4096
// map with constant-radius PCF reads "CG gölge"; a real penumbra grows
// with blocker distance. Classic two-step PCSS (three's own pcss example,
// adapted): a Poisson blocker search estimates the average occluder
// depth, the penumbra ratio scales a second Poisson PCF. Injected by
// REWRITING ShaderChunk.shadowmap_pars_fragment once, at lighting init,
// only when the flag + desktop tier resolved shadowType 'pcss' - with
// the flag off the chunk is never touched (zero trace), which is why
// this module keeps the pristine source and can also restore it.
//
// LIGHT_SIZE_UV is the sun's angular size mapped into shadow-map UV.
// The villa frustum spans ~60 m; a 0.5° sun over that frame is ~0.009 UV.
// NEAR_PLANE matches fitSunShadow's ortho near.

const PCSS_FUNCTIONS = /* glsl */`
#define PCSS_LIGHT_SIZE_UV 0.009
#define PCSS_BLOCKER_SAMPLES 17
#define PCSS_PCF_SAMPLES 25
vec2 angoraPoisson( int i ) {
	// 25-point Poisson disc, radius 1 (first 17 double as the blocker set)
	const vec2 disc[25] = vec2[](
		vec2(-0.9786, -0.0477), vec2(-0.8410, 0.5130), vec2(-0.6533, -0.5570),
		vec2(-0.5843, 0.1179), vec2(-0.4630, 0.7202), vec2(-0.3861, -0.8825),
		vec2(-0.3278, -0.2733), vec2(-0.1290, 0.2757), vec2(-0.1231, -0.6151),
		vec2(-0.0959, 0.8577), vec2(0.0450, -0.9737), vec2(0.0743, 0.0201),
		vec2(0.1401, 0.5583), vec2(0.2500, -0.3639), vec2(0.3462, 0.8556),
		vec2(0.3874, 0.2035), vec2(0.4523, -0.7135), vec2(0.5732, 0.5900),
		vec2(0.6592, -0.0731), vec2(0.6841, -0.4467), vec2(0.7215, 0.9435),
		vec2(0.8570, 0.2482), vec2(0.8903, -0.7364), vec2(0.9683, 0.5789),
		vec2(0.9884, -0.1936) );
	return disc[ i ];
}
float angoraPenumbra( sampler2D shadowMap, vec2 uv, float zReceiver ) {
	float blockerSum = 0.0;
	int blockers = 0;
	float searchRadius = PCSS_LIGHT_SIZE_UV;
	for ( int i = 0; i < PCSS_BLOCKER_SAMPLES; i ++ ) {
		float depth = unpackRGBAToDepth( texture2D( shadowMap, uv + angoraPoisson( i ) * searchRadius ) );
		if ( depth < zReceiver ) { blockerSum += depth; blockers ++; }
	}
	if ( blockers == 0 ) return -1.0;
	float avgBlocker = blockerSum / float( blockers );
	return ( zReceiver - avgBlocker ) * PCSS_LIGHT_SIZE_UV / avgBlocker;
}
float angoraPCSS( sampler2D shadowMap, vec2 shadowMapSize, float shadowIntensity, vec4 coord ) {
	float penumbra = angoraPenumbra( shadowMap, coord.xy, coord.z );
	if ( penumbra < 0.0 ) return 1.0;
	// never softer than the search window, never harder than one texel
	float radius = clamp( penumbra, 1.0 / shadowMapSize.x, PCSS_LIGHT_SIZE_UV * 2.0 );
	float sum = 0.0;
	for ( int i = 0; i < PCSS_PCF_SAMPLES; i ++ ) {
		sum += step( coord.z, unpackRGBAToDepth( texture2D( shadowMap, coord.xy + angoraPoisson( i ) * radius ) ) );
	}
	return mix( 1.0 - shadowIntensity, 1.0, sum / float( PCSS_PCF_SAMPLES ) );
}
`;

const PCSS_RETURN = /* glsl */`
		return angoraPCSS( shadowMap, shadowMapSize, shadowIntensity, shadowCoord );
		#if defined( SHADOWMAP_TYPE_PCF )`;

const PRISTINE = ShaderChunk.shadowmap_pars_fragment;

export function pcssShadowChunk(source = PRISTINE) {
  // The functions land right after the guard, the early return right
  // before the PCF branch INSIDE getShadow's frustum test - everything
  // outside the frustum keeps three's own fallthrough (shadow = 1).
  return source
    .replace('#ifdef USE_SHADOWMAP', '#ifdef USE_SHADOWMAP' + PCSS_FUNCTIONS)
    .replace('#if defined( SHADOWMAP_TYPE_PCF )', PCSS_RETURN);
}

let installed = false;
export function installPcss() {
  if (installed) return false;
  ShaderChunk.shadowmap_pars_fragment = pcssShadowChunk(PRISTINE);
  installed = true;
  return true;
}

export function uninstallPcss() {
  ShaderChunk.shadowmap_pars_fragment = PRISTINE;
  installed = false;
}
