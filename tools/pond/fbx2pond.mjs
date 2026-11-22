// Converts the Tripo FBX pond into a compact indexed mesh (pond.bin) normalised to the
// simulation grid: water surface at y=0, water footprint spans x,z in [-0.5,0.5],
// basin floor at y=-1. The app then scales it by (length, max_depth, width).
import fs from 'fs';
import * as THREE from 'three';
globalThis.self = globalThis; globalThis.window = globalThis;
THREE.TextureLoader.prototype.load = function(){ return new THREE.Texture(); };
const { FBXLoader } = await import('three/examples/jsm/loaders/FBXLoader.js');
const { mergeVertices } = await import('three/examples/jsm/utils/BufferGeometryUtils.js');
const [src, out] = process.argv.slice(2);
const buf = fs.readFileSync(src);
const obj = new FBXLoader().parse(buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength), '');
obj.updateMatrixWorld(true);
let mesh; obj.traverse(o => { if (o.isMesh) mesh = o; });
let g = mesh.geometry.clone().applyMatrix4(mesh.matrixWorld);

// find the water surface: the largest flat, upward-facing level
const p = g.attributes.position.array, nTri = p.length / 9;
const a = new THREE.Vector3(), b = new THREE.Vector3(), c = new THREE.Vector3(), n = new THREE.Vector3(), e = new THREE.Vector3();
const flat = [];
for (let t = 0; t < nTri; t++) {
  a.fromArray(p, 9 * t); b.fromArray(p, 9 * t + 3); c.fromArray(p, 9 * t + 6);
  n.subVectors(c, b).cross(e.subVectors(a, b)); const area = n.length() / 2; n.normalize();
  if (n.y > 0.97) flat.push({ y: (a.y + b.y + c.y) / 3, area, tri: t });
}
const hist = new Map(); for (const f of flat) { const k = Math.round(f.y * 100); hist.set(k, (hist.get(k) || 0) + f.area); }
const peak = [...hist.entries()].sort((x, y) => y[1] - x[1])[0][0] / 100;
let ws = 0, wa = 0, x0 = 1e9, x1 = -1e9, z0 = 1e9, z1 = -1e9;
for (const f of flat) if (Math.abs(f.y - peak) < 0.015) {
  ws += f.y * f.area; wa += f.area;
  for (let k = 0; k < 3; k++) { const i = 9 * f.tri + 3 * k; x0 = Math.min(x0, p[i]); x1 = Math.max(x1, p[i]); z0 = Math.min(z0, p[i + 2]); z1 = Math.max(z1, p[i + 2]); }
}
const water = ws / wa;
// basin floor: lowest well-populated upward level inside the water footprint
let floor = Infinity; const fh = new Map();
for (const f of flat) if (f.y < water - 0.05) { const k = Math.round(f.y * 100); fh.set(k, (fh.get(k) || 0) + f.area); }
const floorPeak = [...fh.entries()].sort((x, y) => y[1] - x[1])[0][0] / 100; floor = floorPeak;
const cx = (x0 + x1) / 2, cz = (z0 + z1) / 2, sx = x1 - x0, sz = z1 - z0, sy = water - floor;
console.log({ water, floor, x0, x1, z0, z1, sx, sz, sy });

g.translate(-cx, -water, -cz);
g.scale(1 / sx, 1 / sy, 1 / sz);
// non-uniform scale breaks normals: recompute from the FBX normals transformed by inverse-transpose
const nrm = g.attributes.normal;
for (let i = 0; i < nrm.count; i++) {
  n.set(nrm.getX(i) * sx, nrm.getY(i) * sy, nrm.getZ(i) * sz).normalize();
  nrm.setXYZ(i, n.x, n.y, n.z);
}
g.deleteAttribute('color');
g = mergeVertices(g, 1e-6);
g.computeBoundingBox();
console.log('indexed verts', g.attributes.position.count, 'indices', g.index.count, 'bbox', g.boundingBox.min, g.boundingBox.max);

const nv = g.attributes.position.count, ni = g.index.count;
const header = new Uint32Array([0x444e4f50, nv, ni, 1]); // "POND", version 1
const parts = [header, new Float32Array(g.attributes.position.array), new Float32Array(g.attributes.normal.array), new Float32Array(g.attributes.uv.array), new Uint32Array(g.index.array)];
fs.writeFileSync(out, Buffer.concat(parts.map(x => Buffer.from(x.buffer, x.byteOffset, x.byteLength))));
console.log('wrote', out, fs.statSync(out).size, 'bytes');
