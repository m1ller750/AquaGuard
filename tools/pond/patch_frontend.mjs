// Встраивает 3D-модель водоёма (FBX из Tripo, сконвертированную в pond.bin) в собранный фронтенд.
// Запуск: node tools/pond/patch_frontend.mjs "_internal/frontend/dist" "tools/pond/build"
// Скрипт меняет класс 3D-сцены в бандле: процедурный ландшафт и плоскость воды
// заменяются моделью pond.bin с текстурами. Каждая замена должна найтись ровно один раз,
// иначе скрипт останавливается и ничего не записывает.
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

const [distDir, pondBuildDir] = process.argv.slice(2);
if (!distDir || !pondBuildDir) {
  console.error('usage: node patch_frontend.mjs <frontend/dist> <pond build dir>');
  process.exit(1);
}
const indexPath = path.join(distDir, 'index.html');
let html = fs.readFileSync(indexPath, 'utf8');
const m = html.match(/\/assets\/(index-[A-Za-z0-9_-]+\.js)/);
if (!m) throw new Error('bundle name not found in index.html');
const oldName = m[1];
const bundlePath = path.join(distDir, 'assets', oldName);
let js = fs.readFileSync(bundlePath, 'utf8');
if (js.includes('__aqLoadPond')) throw new Error('bundle is already patched');

// Имена классов three.js после минификации (проверены по бандлу):
// Li = BufferGeometry, Si = BufferAttribute, $n = Texture, fo = MeshStandardMaterial, sa = Mesh
const loader = [
  'var __aqPond=null;',
  'function __aqLoadPond(){return __aqPond||=(async()=>{try{',
  'let e=`/assets/pond/`,t=await fetch(e+`pond.bin`);if(!t.ok)throw Error(`pond.bin HTTP `+t.status);',
  'let n=await t.arrayBuffer(),r=new Uint32Array(n,0,4);if(r[0]!==1145982800)throw Error(`pond.bin: bad header`);',
  'let i=r[1],a=r[2],o=16,s=new Float32Array(n,o,i*3);o+=i*12;let c=new Float32Array(n,o,i*3);o+=i*12;',
  'let l=new Float32Array(n,o,i*2);o+=i*8;let u=new Uint32Array(n,o,a),d=new Li;',
  'd.setAttribute(`position`,new Si(s,3)),d.setAttribute(`normal`,new Si(c,3)),d.setAttribute(`uv`,new Si(l,2)),d.setIndex(new Si(u,1)),d.computeBoundingSphere(),d.computeBoundingBox();',
  'let f=(t,n)=>new Promise(r=>{let i=new Image;i.onload=()=>{let e=new $n(i);n&&(e.colorSpace=`srgb`),e.anisotropy=8,e.needsUpdate=!0,r(e)},i.onerror=()=>r(null),i.src=e+t}),',
  '[p,m,h]=await Promise.all([f(`color.jpg`,!0),f(`normal.jpg`,!1),f(`roughness.jpg`,!1)]),',
  'g=new fo({color:16777215,map:p,normalMap:m,roughnessMap:h,roughness:1,metalness:0}),_=new sa(d,g);',
  'return _.name=`pond-model`,_.castShadow=!0,_.receiveShadow=!0,_',
  '}catch(e){return console.warn(`AquaGuard: модель водоёма не загружена, используется встроенный ландшафт`,e),null}})()}',
].join('');

const methods = [
  // подгоняет модель под размеры расчётной сетки: длина x ширина x макс. глубина
  'fitPond(e){let t=`${e.length}|${e.width}|${e.max_depth}`;this.pondKey=t,__aqLoadPond().then(n=>{',
  'if(!n||this.pondKey!==t)return;n.scale.set(e.length,e.max_depth,e.width),n.position.set(0,0,0),this.scaled.add(n),this.pond=n,',
  'this.lastView&&this.pondView(this.lastView),this.landscape&&(this.landscape.group.visible=!1,this.landscape.trees.visible=!1),',
  'this.renderer.shadowMap.needsUpdate=!0,this.needsRender=!0})}',
  // в режиме Normal модель непрозрачная, в режимах полей (DO, BOD, Risk...) полупрозрачная, чтобы были видны ячейки
  'pondView(e){let t=this.pond;if(!t)return;let n=e?.viz?.showTerrain!==!1,r=(e?.mode??`Normal`)===`Normal`,i=t.material,a=r?1:.2;',
  't.visible=n,this.water&&(this.water.visible=!n),(i.opacity!==a||i.transparent===r)&&(i.opacity=a,i.transparent=!r,i.depthWrite=r,i.needsUpdate=!0),',
  't.renderOrder=r?0:4,t.castShadow!==r&&(t.castShadow=r,this.renderer.shadowMap.needsUpdate=!0)}',
].join('');

const patches = [
  ['var Ld=140,Rd=class{', loader + 'var Ld=140,Rd=class{'],
  ['water=null;waterU=null;', 'water=null;waterU=null;pond=null;pondKey=null;'],
  ['this.water=o.mesh,this.waterU=o.uniforms,this.scaled.add(this.water);',
   'this.water=o.mesh,this.waterU=o.uniforms,this.scaled.add(this.water),this.fitPond(n);'],
  ['setExaggeration(e){let t=e!==this.ve;', methods + 'setExaggeration(e){let t=e!==this.ve;'],
  ['let i=e.viz.showTerrain;if(this.landscape&&(this.landscape.group.visible=i,this.landscape.trees.visible=i),this.waterU){',
   'let i=e.viz.showTerrain;if(this.pondView(e),this.landscape&&(this.landscape.group.visible=i&&!this.pond,this.landscape.trees.visible=i&&!this.pond),this.waterU){'],
  ['Water colour shows depth (bathymetry). Choose a layer above to see the computed 3D fields.',
   '3D model of the water body (cross-section of the pond). Choose a layer above to see the computed 3D fields.'],
];
for (const [from, to] of patches) {
  const count = js.split(from).length - 1;
  if (count !== 1) throw new Error(`patch anchor found ${count} times: ${from.slice(0, 60)}`);
  js = js.replace(from, () => to);
}

const hash = crypto.createHash('sha256').update(js).digest('base64url').slice(0, 8);
const newName = `index-${hash}.js`;
const assetsDir = path.join(distDir, 'assets');
fs.writeFileSync(path.join(assetsDir, newName), js);
html = html.replace(`/assets/${oldName}`, `/assets/${newName}`);
fs.writeFileSync(indexPath, html);
if (newName !== oldName) fs.unlinkSync(bundlePath);

const pondOut = path.join(assetsDir, 'pond');
fs.mkdirSync(pondOut, { recursive: true });
for (const f of ['pond.bin', 'color.jpg', 'normal.jpg', 'roughness.jpg']) {
  fs.copyFileSync(path.join(pondBuildDir, f), path.join(pondOut, f));
}
console.log(`patched ${oldName} -> ${newName}, pond assets copied to ${pondOut}`);
