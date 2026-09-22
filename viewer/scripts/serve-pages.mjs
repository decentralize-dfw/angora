// A GitHub-Pages-faithful static server for QA capture: serves the repository
// root (the deployed surface - root index.html + web-assets/ + build/web/...)
// with raw bytes and no Content-Encoding negotiation, exactly as Pages hands
// a .json.gz to the browser. Not a production server; a measurement fixture.
import {createServer} from 'node:http';
import {createReadStream, existsSync, statSync} from 'node:fs';
import path from 'node:path';

const TYPES = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.mjs': 'text/javascript',
  '.css': 'text/css', '.json': 'application/json', '.gz': 'application/octet-stream',
  '.glb': 'model/gltf-binary', '.gltf': 'model/gltf+json',
  '.webp': 'image/webp', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml', '.hdr': 'application/octet-stream', '.ktx2': 'image/ktx2',
  '.mp3': 'audio/mpeg', '.wasm': 'application/wasm', '.bin': 'application/octet-stream',
  '.ico': 'image/x-icon',
};

export function servePages(root, port = 0) {
  const server = createServer((request, response) => {
    try {
      const url = new URL(request.url, 'http://localhost');
      let file = path.join(root, decodeURIComponent(url.pathname));
      if (!path.resolve(file).startsWith(path.resolve(root))) { response.writeHead(403).end(); return; }
      if (existsSync(file) && statSync(file).isDirectory()) file = path.join(file, 'index.html');
      if (!existsSync(file)) { response.writeHead(404).end('not found: ' + url.pathname); return; }
      const type = TYPES[path.extname(file).toLowerCase()] ?? 'application/octet-stream';
      response.writeHead(200, {'Content-Type': type, 'Content-Length': statSync(file).size, 'Cache-Control': 'max-age=600'});
      createReadStream(file).pipe(response);
    } catch (error) { response.writeHead(500).end(String(error)); }
  });
  return new Promise(resolve => server.listen(port, '127.0.0.1', () =>
    resolve({server, port: server.address().port, close: () => new Promise(r => server.close(r))})));
}
