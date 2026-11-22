// Вспомогательные функции для запуска расчётов программы AquaGuard AI через её локальный API.
// Порт программы берётся из лога %LOCALAPPDATA%\AquaGuard\aquaguard.log (строка "server ready at ...").
import fs from 'fs';
import path from 'path';
import os from 'os';

export function baseUrl() {
  if (process.env.AQ_URL) return process.env.AQ_URL;
  const log = path.join(process.env.LOCALAPPDATA || path.join(os.homedir(), 'AppData', 'Local'), 'AquaGuard', 'aquaguard.log');
  const m = [...fs.readFileSync(log, 'utf8').matchAll(/server ready at (http:\/\/[\d.]+:\d+)/g)].pop();
  if (!m) throw new Error('в логе нет адреса сервера, запустите AquaGuard AI.exe');
  return m[1];
}

export async function api(base, url, body) {
  const r = await fetch(base + url, body === undefined ? {} : { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
  if (!r.ok) throw new Error(`${url}: HTTP ${r.status} ${await r.text()}`);
  return r.json();
}

export async function job(base, url, body) {
  const { job_id } = await api(base, url, body);
  for (;;) {
    await new Promise((r) => setTimeout(r, 300));
    const j = await api(base, `/api/jobs/${job_id}`);
    if (j.status === 'done') return j.result;
    if (j.status === 'error') throw new Error(j.error || 'job failed');
  }
}

export async function defaults(base) {
  const p = await api(base, '/api/parameters');
  return Object.fromEntries(p.parameters.map((x) => [x.key, x.default]));
}

// один расчёт: возвращает сводку (summary) прогона
export async function simulate(base, params, resolution = 'default', label = 'test') {
  const t0 = Date.now();
  const res = await job(base, '/api/simulate', { params, sources: [], resolution, label });
  const run = await api(base, `/api/runs/${res.run_id}`);
  return { run, seconds: (Date.now() - t0) / 1000 };
}
