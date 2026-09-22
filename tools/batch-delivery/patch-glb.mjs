import fs from 'node:fs/promises';
import {createHash} from 'node:crypto';

const sha = buffer => createHash('sha256').update(buffer).digest('hex');

// In-place GLB surgery for the published batched delivery. The source scene
// (../model-finalization/web) is not in this repository, so build.mjs cannot
// re-run; what CAN change safely is the JSON chunk - materials, extras,
// alpha modes - while the Draco BIN chunk stays byte-for-byte identical.
// The hash check at the end is the contract: if a mutation would touch the
// BIN chunk, the patch throws instead of writing a corrupted delivery.
export async function patchGlbJson(file, mutate) {
  const input = await fs.readFile(file);
  if (input.readUInt32LE(0) !== 0x46546C67) throw Error('Not a glTF binary: ' + file);
  const jsonLength = input.readUInt32LE(12);
  const doc = JSON.parse(input.subarray(20, 20 + jsonLength).toString('utf8'));
  const binHeader = 20 + jsonLength;
  const binLength = input.readUInt32LE(binHeader);
  const bin = input.subarray(binHeader + 8, binHeader + 8 + binLength);
  const before = sha(bin);

  mutate(doc);

  const json = Buffer.from(JSON.stringify(doc), 'utf8');
  const padded = Buffer.concat([json, Buffer.alloc((4 - json.length % 4) % 4, 0x20)]);
  const out = Buffer.alloc(12 + 8 + padded.length + 8 + bin.length);
  out.write('glTF', 0, 'ascii');
  out.writeUInt32LE(2, 4);
  out.writeUInt32LE(out.length, 8);
  out.writeUInt32LE(padded.length, 12);
  out.writeUInt32LE(0x4E4F534A, 16);   // 'JSON'
  padded.copy(out, 20);
  const binOut = 20 + padded.length;
  out.writeUInt32LE(bin.length, binOut);
  out.writeUInt32LE(0x004E4942, binOut + 4);   // 'BIN\0'
  bin.copy(out, binOut + 8);

  if (sha(out.subarray(binOut + 8, binOut + 8 + bin.length)) !== before)
    throw Error('BIN chunk changed - aborted: ' + file);
  return out;
}
