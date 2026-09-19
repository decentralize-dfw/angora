import {LoadingManager} from 'three';
import {KTX2Loader} from 'three/addons/loaders/KTX2Loader.js';
import basisJS from 'three/examples/jsm/libs/basis/basis_transcoder.js?url';
import basisWasm from 'three/examples/jsm/libs/basis/basis_transcoder.wasm?url';

// Vite emits both decoder files under its base path, including Pages builds.
export function createTextureLoader(renderer,workerLimit=1){
  const manager=new LoadingManager();
  manager.setURLModifier(url=>url.endsWith('/basis_transcoder.js')?basisJS:url.endsWith('/basis_transcoder.wasm')?basisWasm:url);
  const loader=new KTX2Loader(manager).setTranscoderPath('angora-basis/').setWorkerLimit(workerLimit).detectSupport(renderer);
  // UASTC/ASTC and the audited BC7 transcode are the delivery's quality path.
  // Optional BasisU retains original images for devices limited to other
  // compressed formats; do not silently introduce an unaudited ETC/DXT loss.
  if(!loader.workerConfig.astcSupported&&!loader.workerConfig.bptcSupported){loader.dispose();return null;}
  return loader;
}
