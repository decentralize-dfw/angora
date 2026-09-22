// FAZ 0 · Task 0.3 — the measurement harness behind ?stats=1 / ?camera=C0x.
//
// Loaded lazily by main.js only when those parameters are present, so the
// ordinary visitor path is byte-for-byte unchanged. Everything here READS
// the running scene; the one thing it changes is the camera, through the
// same CameraFlight/enterWalk paths a visitor uses, instantly.
//
// Honesty rules (Bölüm 0.7.4): a value this page cannot measure is null,
// never 0. Frame statistics only appear after an explicit measure() run and
// carry their method. Whether the GPU is real or SwiftShader is not knowable
// from here - the capture script stamps softwareRaster on what it saves.
import {cameraById} from './qa-cameras.js';
import {detectTierFromEnvironment} from './quality-profile.js';
import {summarizeFrames} from './frame-measurement.js';

const MiB = 1024 * 1024;

function textureBytes(texture) {
  // Compressed (KTX2) textures carry their true payload in mipmaps.
  if (texture.isCompressedTexture && Array.isArray(texture.mipmaps)) {
    return texture.mipmaps.reduce((sum, mip) => sum + (mip.data?.byteLength ?? 0), 0);
  }
  const image = texture.source?.data ?? texture.image;
  const width = image?.width, height = image?.height;
  if (!width || !height) return 0;
  return width * height * 4 * (texture.generateMipmaps ? 4 / 3 : 1);
}

function collectSceneResources(scene, extraTextures = []) {
  const geometries = new Set(), textures = new Set();
  scene.traverse(object => {
    if (object.isMesh || object.isLine || object.isPoints) geometries.add(object.geometry);
    const materials = Array.isArray(object.material) ? object.material : object.material ? [object.material] : [];
    for (const material of materials) {
      for (const value of Object.values(material)) if (value?.isTexture) textures.add(value);
    }
  });
  if (scene.environment?.isTexture) textures.add(scene.environment);
  for (const texture of extraTextures) if (texture?.isTexture) textures.add(texture);
  // Shared ImageBitmaps count once: the delivery dedupes sources across GLBs.
  const bySource = new Map();
  for (const texture of textures) {
    const key = texture.source ?? texture;
    const bytes = textureBytes(texture);
    bySource.set(key, Math.max(bySource.get(key) ?? 0, bytes));
  }
  let textureBytesTotal = 0;
  for (const bytes of bySource.values()) textureBytesTotal += bytes;
  let geometryBytesTotal = 0;
  for (const geometry of geometries) {
    if (!geometry) continue;
    for (const attribute of Object.values(geometry.attributes ?? {})) {
      geometryBytesTotal += attribute.array?.byteLength ?? 0;
    }
    geometryBytesTotal += geometry.index?.array?.byteLength ?? 0;
  }
  return {
    textureCount: bySource.size,
    geometryCount: geometries.size,
    estimatedTextureMiB: textureBytesTotal / MiB,
    estimatedGeometryMiB: geometryBytesTotal / MiB,
  };
}

function networkReport(readyAt) {
  try {
    const resources = performance.getEntriesByType('resource');
    const bytesOf = entry => entry.transferSize || entry.encodedBodySize || 0;
    const total = resources.reduce((sum, entry) => sum + bytesOf(entry), 0);
    const beforeReady = readyAt === null ? null
      : resources.filter(entry => entry.responseEnd <= readyAt).reduce((sum, entry) => sum + bytesOf(entry), 0);
    return {firstInteractiveBytes: beforeReady, totalBytes: total, requests: resources.length};
  } catch {
    return {firstInteractiveBytes: null, totalBytes: null, requests: null};
  }
}

export function installQaHarness({host, query, hooks}) {
  let contextLost = false;
  let readyAt = null;
  let lastMeasurement = null;
  let appliedCamera = null;

  const waitForReady = () => new Promise(resolve => {
    const poll = () => {
      if (hooks.isReady()) { readyAt ??= performance.now(); resolve(); }
      else setTimeout(poll, 120);
    };
    poll();
  });

  const nextFrames = (count = 2) => new Promise(resolve => {
    const step = remaining => {
      hooks.invalidate();
      requestAnimationFrame(() => remaining > 1 ? step(remaining - 1) : resolve());
    };
    step(count);
  });

  function snapshot() {
    const renderer = hooks.renderer();
    const scene = hooks.scene();
    const camera = hooks.camera();
    const lighting = hooks.lighting();
    const qaState = lighting?.qaState?.() ?? {};
    const delivery = JSON.parse(host.dataset.deliveryStats ?? '{}');
    const resources = collectSceneResources(scene, qaState.textures ?? []);
    const size = renderer.getDrawingBufferSize
      ? renderer.getDrawingBufferSize(new hooks.three.Vector2())
      : {x: renderer.domElement.width, y: renderer.domElement.height};
    const report = {
      camera: appliedCamera?.id ?? null,
      view: hooks.selected(),
      walking: Boolean(hooks.walk()?.active),
      tier: hooks.quality?.()?.tier ?? detectTierFromEnvironment({search: location.search}),
      qualityView: hooks.quality?.()?.view ?? null,
      deliveryProfile: hooks.deliveryProfile,
      commit: null,                       // stamped by the capture script
      capturedAt: new Date().toISOString(),
      timing: {
        firstMeaningfulPaint: null,       // not instrumented
        firstInteractiveOrbit: delivery.readyMs ?? null,
        decodeAndPrepareMs: delivery.decodeAndPrepareMs ?? null,
        villaReady: null,                 // parts are not staged separately yet
        interiorReady: null,
        allReady: delivery.readyMs ?? null,
      },
      frame: lastMeasurement,             // null until measure() runs
      renderer: {
        drawCalls: renderer.info.render.calls,
        triangles: renderer.info.render.triangles,
        programs: renderer.info.programs?.length ?? null,
        geometries: renderer.info.memory.geometries,
        textures: renderer.info.memory.textures,
        drawingBuffer: [size.x, size.y],
        pixelRatio: renderer.getPixelRatio(),
        toneMapping: renderer.toneMapping,
        shadowMapEnabled: renderer.shadowMap.enabled,
      },
      memory: {
        estimatedTextureMiB: Number(resources.estimatedTextureMiB.toFixed(1)),
        estimatedGeometryMiB: Number(resources.estimatedGeometryMiB.toFixed(1)),
        countedTextures: resources.textureCount,
        countedGeometries: resources.geometryCount,
        jsHeapMiB: performance.memory ? Number((performance.memory.usedJSHeapSize / MiB).toFixed(1)) : null,
      },
      network: networkReport(readyAt),
      flags: {
        dynamicSunShadow: renderer.shadowMap.enabled,
        gtao: Boolean(qaState.gtao),
        postProcessing: Boolean(qaState.composer),
        compactOutput: Boolean(qaState.compactOutput),
      },
      cameraState: {
        type: camera.type,
        position: camera.position.toArray().map(v => Number(v.toFixed(4))),
        target: hooks.controls().target.toArray().map(v => Number(v.toFixed(4))),
        fov: camera.fov ?? null,
        zoom: camera.zoom,
      },
      contextLost,
    };
    host.dataset.qaReport = JSON.stringify(report);
    return report;
  }

  // Frame statistics from requestAnimationFrame intervals while the scene is
  // forced to render continuously - the same method device-qa.js documents.
  // Orbit views turn slowly; walk views sweep the gaze. NOT a GPU timer.
  async function measure(seconds = 15) {
    await waitForReady();
    const renderer = hooks.renderer();
    const controls = hooks.controls();
    const walk = hooks.walk();
    const samples = [];
    const walking = Boolean(walk?.active);
    const previousAutoRotate = controls.autoRotate;
    if (!walking) { controls.autoRotate = true; controls.autoRotateSpeed = 0.8; }
    hooks.invalidate();
    const start = performance.now();
    let lastFrameCounter = renderer.info.render.frame, lastTime = null;
    await new Promise(resolve => {
      const tick = time => {
        if (walking) { walk.yaw += 0.004; walk.pose(); }
        hooks.invalidate();
        const counter = renderer.info.render.frame;
        if (counter !== lastFrameCounter) {
          if (lastTime !== null) samples.push({
            interval_ms: time - lastTime,
            draw_calls: renderer.info.render.calls,
            triangles: renderer.info.render.triangles,
            view: hooks.selected(),
          });
          lastFrameCounter = counter; lastTime = time;
        }
        if (time - start >= seconds * 1000) resolve();
        else requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    });
    if (!walking) controls.autoRotate = previousAutoRotate;
    hooks.invalidate();
    const summary = summarizeFrames(samples);
    lastMeasurement = {
      fps: summary.fps === null ? null : Number(summary.fps.toFixed(2)),
      p50FrameMs: summary.frame_ms_p50, p95FrameMs: summary.frame_ms_p95,
      p99FrameMs: null,
      longestFrameMs: summary.frame_ms_max,
      frames: summary.frames,
      sampleSeconds: seconds,
      method: 'requestAnimationFrame intervals during continuous rendering; not GPU timer queries',
    };
    // p99 by hand - summarizeFrames stops at p95.
    const intervals = samples.map(s => s.interval_ms).sort((a, b) => a - b);
    if (intervals.length) lastMeasurement.p99FrameMs = intervals[Math.max(0, Math.ceil(intervals.length * 0.99) - 1)];
    return snapshot();
  }

  async function applyCamera(id) {
    const spec = cameraById(id);
    if (!spec) throw new Error('Unknown QA camera ' + id);
    await waitForReady();
    const three = hooks.three;
    if (spec.walk) {
      hooks.enterWalk(spec.walk.room);
      const walk = hooks.walk();
      walk.yaw = spec.walk.yaw; walk.pitch = spec.walk.pitch; walk.pose();
    } else {
      if (hooks.walk()?.active) hooks.exitWalk?.(true);
      if (spec.plan) hooks.setPlan(true);
      const flight = hooks.flight();
      flight.cancel();
      flight.go({
        target: new three.Vector3(...spec.orbit.target),
        polar: spec.orbit.polar, azimuth: spec.orbit.azimuth,
        span: spec.orbit.span, zoom: spec.orbit.zoom, fov: spec.orbit.fov,
      }, true);
    }
    appliedCamera = spec;
    // The idle detail-map revival (Task 1.3) rebinds hero materials some
    // time after boot; a deterministic frame waits for it, not for luck.
    // Guarded, not optional-chained: an unconditional await yields to the
    // event loop even when the promise does not exist, and that one
    // interleaved frame was measured flipping a z-fight tie at the eaves
    // junction on the mobile C07 gate frame (26 px). With the feature off
    // this path must not yield at all.
    if (window.__angoraGradeReady) await window.__angoraGradeReady;
    // Fixture and daylight fades ease over wall-clock time; a screenshot taken
    // mid-fade depends on boot timing. A far-future update() snaps every fade
    // to its settled state - the same trick the boot's warming renders use.
    hooks.lighting()?.update?.(performance.now() + 60000);
    hooks.invalidate();
    await nextFrames(10);
    return snapshot();
  }

  waitForReady().then(async () => {
    const canvas = hooks.renderer()?.domElement;
    canvas?.addEventListener('webglcontextlost', () => { contextLost = true; snapshot(); });
    const requested = query.get('camera');
    try {
      if (requested) await applyCamera(requested);
      else { await nextFrames(2); snapshot(); }
    } catch (error) {
      console.warn('QA camera failed', error);
      host.dataset.qaError = String(error?.message ?? error);
      await nextFrames(2); snapshot();
    }
  });

  window.__angoraQA = {applyCamera, snapshot, measure, get report() { return JSON.parse(host.dataset.qaReport ?? 'null'); }};
  return window.__angoraQA;
}
