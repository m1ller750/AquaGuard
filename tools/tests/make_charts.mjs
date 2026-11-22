// Строит графики по data/test_runs/results.json в формате SVG (docs/figures).
// PNG получаются отдельным шагом (tools/tests/svg2png.ps1) через headless Edge.
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, '../..');
const R = JSON.parse(fs.readFileSync(path.join(root, 'data/test_runs/results.json'), 'utf8'));
const out = path.join(root, 'docs/figures');
fs.mkdirSync(out, { recursive: true });

const W = 1000, H = 560, M = { l: 90, r: 90, t: 30, b: 120 };
const FONT = "font-family=\"'Times New Roman',serif\"";
const nice = (lo, hi, n = 6) => {
  if (hi === lo) { hi = lo + 1; }
  const step0 = (hi - lo) / n, mag = Math.pow(10, Math.floor(Math.log10(step0))), f = step0 / mag;
  const step = (f < 1.5 ? 1 : f < 3 ? 2 : f < 7 ? 5 : 10) * mag;
  const a = Math.floor(lo / step) * step, b = Math.ceil(hi / step) * step;
  const ticks = []; for (let v = a; v <= b + step / 2; v += step) ticks.push(+v.toFixed(10));
  return { a, b, ticks };
};
const fmt = (v) => (Math.abs(v) >= 100 || Number.isInteger(v) ? String(Math.round(v * 100) / 100) : String(+v.toFixed(2))).replace('.', ',');

function chart({ file, xLabel, yl, yr, series, xticks, xmin, xmax }) {
  const xs = series.flatMap((s) => s.pts.map((p) => p[0]));
  const x0 = xmin ?? Math.min(...xs), x1 = xmax ?? Math.max(...xs);
  const pad = (x1 - x0) * 0.04;
  const X = (v) => M.l + ((v - (x0 - pad)) / (x1 - x0 + 2 * pad)) * (W - M.l - M.r);
  const axes = {};
  for (const side of ['l', 'r']) {
    const ss = series.filter((s) => (s.axis || 'l') === side);
    if (!ss.length) continue;
    const ys = ss.flatMap((s) => s.pts.map((p) => p[1]));
    axes[side] = nice(Math.min(...ys), Math.max(...ys));
  }
  const Y = (side, v) => { const a = axes[side]; return H - M.b - ((v - a.a) / (a.b - a.a)) * (H - M.t - M.b); };
  let g = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}"><rect width="100%" height="100%" fill="#fff"/>`;
  const al = axes.l;
  for (const t of al.ticks) { const y = Y('l', t); g += `<line x1="${M.l}" x2="${W - M.r}" y1="${y}" y2="${y}" stroke="#ddd"/><text x="${M.l - 10}" y="${y + 5}" text-anchor="end" font-size="18" ${FONT}>${fmt(t)}</text>`; }
  if (axes.r) for (const t of axes.r.ticks) { const y = Y('r', t); g += `<text x="${W - M.r + 10}" y="${y + 5}" font-size="18" ${FONT}>${fmt(t)}</text>`; }
  for (const t of xticks ?? [...new Set(xs)]) { const x = X(t); g += `<line x1="${x}" x2="${x}" y1="${H - M.b}" y2="${H - M.b + 6}" stroke="#000"/><text x="${x}" y="${H - M.b + 28}" text-anchor="middle" font-size="18" ${FONT}>${fmt(t)}</text>`; }
  g += `<rect x="${M.l}" y="${M.t}" width="${W - M.l - M.r}" height="${H - M.t - M.b}" fill="none" stroke="#000"/>`;
  g += `<text x="${(M.l + W - M.r) / 2}" y="${H - M.b + 62}" text-anchor="middle" font-size="20" ${FONT}>${xLabel}</text>`;
  g += `<text transform="translate(26 ${(M.t + H - M.b) / 2}) rotate(-90)" text-anchor="middle" font-size="20" ${FONT}>${yl}</text>`;
  if (yr) g += `<text transform="translate(${W - 24} ${(M.t + H - M.b) / 2}) rotate(90)" text-anchor="middle" font-size="20" ${FONT}>${yr}</text>`;
  for (const s of series) {
    const side = s.axis || 'l';
    const d = s.pts.map((p, i) => `${i ? 'L' : 'M'}${X(p[0]).toFixed(1)} ${Y(side, p[1]).toFixed(1)}`).join(' ');
    g += `<path d="${d}" fill="none" stroke="${s.color}" stroke-width="3" ${s.dash ? `stroke-dasharray="${s.dash}"` : ''}/>`;
    if (!s.noMarks) for (const p of s.pts) g += `<circle cx="${X(p[0]).toFixed(1)}" cy="${Y(side, p[1]).toFixed(1)}" r="5" fill="${s.color}"/>`;
  }
  let lx = M.l;
  series.forEach((s, i) => {
    const y = H - 24 + (i % 2 ? 0 : -24) * 0;
    const col = i % 2, row = Math.floor(i / 2);
    const x = M.l + col * 430, yy = H - 36 + row * 24;
    g += `<line x1="${x}" x2="${x + 40}" y1="${yy - 6}" y2="${yy - 6}" stroke="${s.color}" stroke-width="3" ${s.dash ? `stroke-dasharray="${s.dash}"` : ''}/><text x="${x + 50}" y="${yy}" font-size="18" ${FONT}>${s.name}</text>`;
  });
  g += '</svg>';
  fs.writeFileSync(path.join(out, file), g);
  console.log('chart', file);
}

const rows = (id) => R.rows.filter((r) => r.series === id);
const pts = (id, key, k = 1) => rows(id).map((r) => [r.value, r[key] * k]);
const BLUE = '#1f5fbf', RED = '#c0392b', GREEN = '#2e7d32', GREY = '#555';

chart({ file: 'fig1_temperature.svg', xLabel: 'Температура воды, °C', yl: 'Средний O₂ через 72 ч, мг/л', yr: 'Индекс риска (P90), 0-100',
  series: [{ name: 'Средний O₂ (левая ось)', color: BLUE, pts: pts('temperature', 'do_mean') }, { name: 'Индекс риска (правая ось)', color: RED, axis: 'r', dash: '8 6', pts: pts('temperature', 'risk_score') }] });
chart({ file: 'fig2_pollution.svg', xLabel: 'Мощность источника загрязнения, кг/ч', yl: 'Средний O₂ через 72 ч, мг/л', yr: 'Индекс риска (P90), 0-100',
  series: [{ name: 'Средний O₂ (левая ось)', color: BLUE, pts: pts('pollution_intensity', 'do_mean') }, { name: 'Индекс риска (правая ось)', color: RED, axis: 'r', dash: '8 6', pts: pts('pollution_intensity', 'risk_score') }] });
chart({ file: 'fig3_bod.svg', xLabel: 'Начальное БПК, мг/л', yl: 'Средний O₂ через 72 ч, мг/л', yr: 'Доля объёма с гипоксией (O₂ < 2), %',
  series: [{ name: 'Средний O₂ (левая ось)', color: BLUE, pts: pts('bod', 'do_mean') }, { name: 'Гипоксия (правая ось)', color: RED, axis: 'r', dash: '8 6', pts: pts('bod', 'hypoxic_fraction', 100) }] });
chart({ file: 'fig4_k2.svg', xLabel: 'Коэффициент реаэрации k₂, 1/сут', yl: 'Средний O₂ через 72 ч, мг/л', yr: 'Индекс риска (P90), 0-100',
  series: [{ name: 'Средний O₂ (левая ось)', color: BLUE, pts: pts('k2', 'do_mean') }, { name: 'Индекс риска (правая ось)', color: RED, axis: 'r', dash: '8 6', pts: pts('k2', 'risk_score') }] });
const sp = R.streeter_phelps;
chart({ file: 'fig5_streeter_phelps.svg', xLabel: 'Время, ч', yl: 'Растворённый кислород, мг/л', yr: 'БПК, мг/л', noMarkers: true,
  series: [
    { name: 'O₂, формула Стритера-Фелпса', color: GREY, dash: '10 6', noMarks: true, pts: sp.t_h.map((t, i) => [t, sp.do_analytical[i]]) },
    { name: 'O₂, расчёт программы', color: BLUE, noMarks: true, pts: sp.t_h.map((t, i) => [t, sp.do_3d[i]]) },
    { name: 'БПК, формула', color: '#8a6d00', dash: '10 6', axis: 'r', noMarks: true, pts: sp.t_h.map((t, i) => [t, sp.bod_analytical[i]]) },
    { name: 'БПК, расчёт программы', color: GREEN, axis: 'r', noMarks: true, pts: sp.t_h.map((t, i) => [t, sp.bod_3d[i]]) },
  ], xticks: [0, 12, 24, 36, 48, 60, 72] });
