// Добавляет русский язык в собранный интерфейс AquaGuard AI.
// Запуск (после tools/pond/patch_frontend.mjs): node tools/i18n/patch_i18n.mjs "_internal/frontend/dist"
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';

const here = path.dirname(fileURLToPath(import.meta.url));
const distDir = process.argv[2];
if (!distDir) { console.error('usage: node patch_i18n.mjs <frontend/dist>'); process.exit(1); }
const indexPath = path.join(distDir, 'index.html');
let html = fs.readFileSync(indexPath, 'utf8');
const oldName = html.match(/\/assets\/(index-[A-Za-z0-9_-]+\.js)/)[1];
const bundlePath = path.join(distDir, 'assets', oldName);
let js = fs.readFileSync(bundlePath, 'utf8');

// если язык уже встроен, заменяем старую версию словаря и кода на новую
const START = '/*aq-i18n-start*/', END = '/*aq-i18n-end*/';
const block = START + fs.readFileSync(path.join(here, 'ru_dict.js'), 'utf8') + '\n' + fs.readFileSync(path.join(here, 'runtime.js'), 'utf8') + END + '\n';
if (js.includes(START)) js = block + js.slice(js.indexOf(END) + END.length + 1);
else {
  const patches = [
    // графики: перевод заголовков, подписей осей и легенды
    ['J.default.react(i.current,e,r,{displaylogo:!1', '__aqTrPlot(e,r),J.default.react(i.current,e,r,{displaylogo:!1'],
    // ИИ-советник отвечает на языке интерфейса
    ['[l,u]=(0,_.useState)(`en`)', '[l,u]=(0,_.useState)(__aqLang===`ru`?`ru`:`en`)'],
  ];
  for (const [from, to] of patches) {
    const n = js.split(from).length - 1;
    if (n !== 1) throw new Error(`anchor found ${n} times: ${from}`);
    js = js.replace(from, () => to);
  }
  js = block + js;
}

const newName = `index-${crypto.createHash('sha256').update(js).digest('base64url').slice(0, 8)}.js`;
fs.writeFileSync(path.join(distDir, 'assets', newName), js);
fs.writeFileSync(indexPath, html.replace(`/assets/${oldName}`, `/assets/${newName}`).replace('<html lang="en">', '<html lang="ru">'));
if (newName !== oldName) fs.unlinkSync(bundlePath);
console.log(`i18n: ${oldName} -> ${newName}`);
