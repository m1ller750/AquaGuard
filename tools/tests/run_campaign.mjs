// Серия тестовых запусков AquaGuard AI: меняем по одному параметру, остальные по умолчанию.
// Результаты записываются в data/test_runs (CSV и JSON). Запуск: node run_campaign.mjs
// Перед запуском должна быть запущена программа AquaGuard AI.exe.
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { baseUrl, api, job, defaults, simulate } from './api.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
const outDir = path.resolve(here, '../../data/test_runs');
fs.mkdirSync(outDir, { recursive: true });

const base = baseUrl();
const d = await defaults(base);
const health = await api(base, '/api/health');
const started = new Date();

const series = [
  { id: 'base', title: 'Базовый вариант (повтор)', param: null, values: [null, null, null] },
  { id: 'temperature', title: 'Температура воды', param: 'temperature', unit: '°C', values: [10, 16, 22, 28, 32] },
  { id: 'pollution_intensity', title: 'Мощность источника загрязнения', param: 'pollution_intensity', unit: 'кг/ч', values: [0, 5, 10, 20, 40] },
  { id: 'bod', title: 'Начальное БПК', param: 'bod', unit: 'мг/л', values: [2.5, 5, 10, 20] },
  { id: 'k2', title: 'Коэффициент реаэрации k₂', param: 'k2', unit: '1/сут', values: [0.2, 0.6, 1.5, 3] },
  { id: 'max_depth', title: 'Максимальная глубина', param: 'max_depth', unit: 'м', values: [4, 6, 10, 15, 20] },
];

function maxCons(run) {
  const c = run.budgets?.conservation; if (!c) return null;
  const errs = [c.oxygen, c.nitrogen, c.phosphorus, c.water].filter(Boolean).map((e) => e.relative_error);
  for (const m of Object.values(c.mass || {})) errs.push(m.relative_error);
  return Math.max(...errs);
}

const rows = [];
let n = 0;
for (const s of series) {
  for (const v of s.values) {
    const params = { ...d };
    if (s.param) params[s.param] = v;
    if (s.param === 'bod') params.cod = Math.max(d.cod, v * 1.5); // ХПК не может быть меньше БПК
    n += 1;
    const { run, seconds } = await simulate(base, params, 'default', `${s.id}=${v}`);
    const m = run.metrics;
    rows.push({
      n, series: s.id, series_title: s.title, param: s.param, value: v, unit: s.unit || '',
      do_mean: m.do_mean, do_p05: m.do_p05, do_min: m.do_min, do_bottom: m.do_bottom, bod_mean: m.bod_mean,
      no3_mean: m.no3_mean, po4_mean: m.po4_mean, alg_mean: m.alg_mean, t_mean: m.t_mean,
      hypoxic_fraction: m.hypoxic_fraction, plume_fraction: m.plume_fraction, risk_score: m.risk_score, risk_class: m.risk_class,
      conservation_max_rel_error: maxCons(run), stable: run.diagnostics.stable, seconds: Number(seconds.toFixed(2)),
      warnings: (run.warnings || []).join(' | '),
    });
    console.log(n, s.id, v, 'DO', m.do_mean.toFixed(3), 'risk', m.risk_score.toFixed(1), seconds.toFixed(1) + ' s');
  }
}

// проверка защиты от неверных данных: программа должна отклонять такие запуски
const invalid = [
  { id: 'bod_gt_cod', title: 'БПК больше ХПК', change: { bod: 20 } },
  { id: 'temp_too_high', title: 'Температура 45 °C (выше предела 35 °C)', change: { temperature: 45 } },
  { id: 'negative_pollution', title: 'Отрицательная мощность источника', change: { pollution_intensity: -5 } },
  { id: 'do_bottom_gt_surface_sat', title: 'O₂ 25 мг/л (выше физического предела)', change: { do: 25 } },
];
const invalidRows = [];
for (const c of invalid) {
  let status = 'принят', message = '';
  try { await simulate(base, { ...d, ...c.change }, 'coarse', c.id); }
  catch (e) { status = 'отклонён'; message = String(e.message).replace('/api/simulate: HTTP 422 ', ''); }
  invalidRows.push({ id: c.id, title: c.title, change: JSON.stringify(c.change), status, message });
  console.log('invalid', c.id, status);
}

// сетки: грубая, стандартная, высокая
const grids = [];
for (const res of ['coarse', 'default', 'high']) {
  const { run, seconds } = await simulate(base, d, res, `grid=${res}`);
  grids.push({ grid: res, cells: run.grid.n_active, nx: run.grid.nx, ny: run.grid.ny, nz: run.grid.nz, seconds: Number(seconds.toFixed(2)),
    do_mean: run.metrics.do_mean, do_p05: run.metrics.do_p05, do_bottom: run.metrics.do_bottom, risk_score: run.metrics.risk_score, hypoxic_fraction: run.metrics.hypoxic_fraction });
  console.log('grid', res, seconds.toFixed(1) + ' s');
}

// эталон: решение Стритера-Фелпса, закон Генри
const sp = await api(base, '/api/validation/streeter-phelps');
const val = await api(base, '/api/validation');

const csvCols = Object.keys(rows[0]);
const csv = [csvCols.join(';'), ...rows.map((r) => csvCols.map((c) => String(r[c] ?? '').replace('.', ',')).join(';'))].join('\n');
fs.writeFileSync(path.join(outDir, 'results.csv'), '﻿' + csv);
fs.writeFileSync(path.join(outDir, 'results.json'), JSON.stringify({
  started: started.toISOString(), finished: new Date().toISOString(), app: health, defaults: d, series, rows, grids,
  streeter_phelps: sp, henry: val.henry, invalid: invalidRows, ml_test: val.ml?.test, ml_classification: val.ml?.classification,
}, null, 1));
console.log('записано в', outDir);
