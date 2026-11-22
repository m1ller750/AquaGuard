// Переключение языка интерфейса AquaGuard AI (RU/EN).
// Язык хранится в localStorage (aq_lang), по умолчанию русский.
var __aqLang = (function () { try { return localStorage.getItem('aq_lang') || 'ru'; } catch (e) { return 'ru'; } })();
window.__aqLang = __aqLang;

function __aqT1(s) { var k = String(s).trim(); return __aqRU[k] !== undefined ? __aqRU[k] : s; }
var __aqRules = [
  [/^Day (\d+) · (.+)$/, 'День $1 · $2'],
  [/^(\w+): (.+) · (\d+) %$/, function (m, a, b, c) { return __aqT1(a) + ': ' + __aqT1(b) + ' · ' + c + ' %'; }],
  [/^bottom (.+) · min (.+) mg\/L · hypoxic (.+) % vol$/, 'у дна $1 · мин $2 мг/л · гипоксия $3 % объёма'],
  [/^max (.+) mg\/L$/, 'макс $1 мг/л'],
  [/^(.+) · mean (.+) · High\+Critical (.+) % vol$/, function (m, a, b, c) { return __aqT1(a) + ' · среднее ' + b + ' · высокий и критический ' + c + ' % объёма'; }],
  [/^Results · (.+) physics evaluations · (.+) s$/, 'Результаты · $1 физических расчётов · $2 с'],
  [/^x (.+) m, y (.+) m \(need share (.+) %\)$/, 'x $1 м, y $2 м (доля потребности $3 %)'],
  [/^Scenario "(.+)" saved$/, 'Сценарий «$1» сохранён'],
  [/^Loaded "(.+)"$/, 'Загружено: «$1»'],
  [/^Reset to (.+)$/, 'Сбросить к $1'],
  [/^Reset (.+)$/, function (m, a) { return 'Сбросить: ' + __aqT1(a); }],
  [/^Scenario (.+)$/, 'Сценарий $1'],
  [/^source (\d+)$/, 'источник $1'], [/^Source (\d+)$/, 'Источник $1'],
  [/^(Low|Moderate|High|Critical) risk$/, function (m, a) { return __aqT1(a) + ' риск'; }],
  [/^Risk @72 h (\d+) · (.+)$/, function (m, a, b) { return 'Риск через 72 ч ' + a + ' · ' + __aqT1(b); }],
  [/^pred (.+)$/, function (m, a) { return 'прогноз: ' + __aqT1(a); }], [/^true (.+)$/, function (m, a) { return 'факт: ' + __aqT1(a); }],
  [/^Risk class confusion matrix \(acc (.+) %, macro-F1 (.+)\)$/, 'Матрица ошибок классов риска (точность $1 %, macro-F1 $2)'],
  [/^physics: (.+)$/, 'физика: $1'],
  [/^All budgets close: max relative error (.+) ≤ threshold (.+)\.$/, 'Все балансы сходятся: макс. относительная ошибка $1 ≤ порога $2.'],
  [/^Model validation warning: conservation error (.+) exceeds (.+)\.$/, 'Предупреждение: ошибка сохранения $1 превышает $2.'],
  [/^level change (.+) m$/, 'изменение уровня $1 м'], [/^level (.+) m$/, 'уровень $1 м'], [/^Mass (.+)$/, function (m, a) { return 'Масса ' + __aqT1(a); }],
  [/^Local \(physics\): change of (.+) from (.+)$/, 'Локально (физика): изменение $1 от $2'],
  [/^Global Sobol \(ML surrogate, (.+) evals\)$/, 'Глобальные индексы Соболя (ML-модель, $1 расчётов)'],
  [/^≤ (.+) required \(explicit upwind \+ diffusion\)$/, 'требуется ≤ $1 (явная схема против потока и диффузия)'],
  [/^Streeter–Phelps: max \|ΔDO\| = (.+) mg\/L, BOD rel\. err (.+)$/, 'Стритер-Фелпс: макс. |ΔO₂| = $1 мг/л, отн. ошибка БПК $2'],
  [/^DO saturation: max rel\. difference (.+) %$/, 'Насыщение O₂: макс. отн. разница $1 %'],
  [/^Thermocline ≈ (.+) m \(max dT\/dz (.+) °C\/m\)$/, 'Термоклин ≈ $1 м (макс. dT/dz $2 °C/м)'],
  [/^x-index (.+)$/, 'индекс x $1'], [/^y-index (.+)$/, 'индекс y $1'],
  [/^Backend not reachable: (.+)\. Start it with: (.+)$/, 'Сервер недоступен: $1. Запустите: $2'],
  [/^Simulation failed: (.+)$/, 'Ошибка симуляции: $1'], [/^Could not load run: (.+)$/, 'Не удалось загрузить расчёт: $1'],
  [/^Advisor: (.+)$/, 'Советник: $1'], [/^Optimization failed: (.+)$/, 'Ошибка оптимизации: $1'], [/^Scenario run failed: (.+)$/, 'Ошибка расчёта сценария: $1'],
  [/^Upload failed \((.+)$/, 'Ошибка загрузки ($1'],
  [/^(\d+) compared$/, 'сравнено: $1'], [/^(\d+) feasible of (\d+)$/, 'допустимо $1 из $2'],
  [/^Answer by (.+)$/, 'Ответ: $1'], [/^reference: (.+)$/, 'эталон: $1'], [/^physics \((.+)\)$/, function (m, a) { return 'физика (' + (__aqGrid[a] || a) + ')'; }],
  [/^(.+) vs time$/, function (m, a) { return __aqT1(a) + ' во времени'; }],
  [/^(.+) water cells, V = (.+) Mm³$/, '$1 ячеек с водой, V = $2 млн м³'],
  [/^([\d.,\s]+) kWh$/, '$1 кВт·ч'],
  [/^(.+) \(target (.+)\)(.*)$/, function (m, a, b, c) { return a + ' (цель ' + b + ')' + c; }],
  [/^(\d+) h$/, '$1 ч'], [/^(\d+(?:\.\d+)?) h\/s$/, '$1 ч/с'],
  // подписи метрик ML: «Mean DO at 72 h [mg/L]»
  [/^(.+?)( at 72 h)?( \[(.+)\])?$/, function (m, a, at, br, u) {
    var t = __aqRU[a.trim()], uu = u === 'degC' ? '°C' : (u && __aqRU[u]) || u;
    if (!t && !(u && uu !== u)) return m;
    return (t || a) + (at ? ' через 72 ч' : '') + (br ? ' [' + uu + ']' : '');
  }],
  // число и единица: «6.504 mg/L», «85.7 – 85.7 s», «7.21 / 4.10 / 5.04 mg/L»
  [/^([-+\d.,e/–\s]*\d) (.+)$/, function (m, n, u) { var t = __aqRU[u]; return t ? n + ' ' + t : m; }],
];
function __aqTr(v) {
  if (v == null) return v;
  var s = String(v); if (!/[A-Za-z]/.test(s)) return v;
  var m = s.match(/^(\s*)([\s\S]*?)(\s*)$/), core = m[2];
  if (__aqRU[core] !== undefined) return m[1] + __aqRU[core] + m[3];
  for (var i = 0; i < __aqRules.length; i++) {
    var r = __aqRules[i];
    if (r[0].test(core)) { var out = core.replace(r[0], r[1]); if (out !== core) return m[1] + out + m[3]; }
  }
  return v;
}
// заголовки и подписи графиков Plotly
function __aqTrPlot(data, layout) {
  if (__aqLang !== 'ru') return;
  var seen = new Set();
  (function walk(o) {
    if (!o || typeof o !== 'object' || seen.has(o)) return; seen.add(o);
    if (Array.isArray(o)) { for (var i = 0; i < o.length; i++) walk(o[i]); return; }
    for (var k in o) {
      var v = o[k];
      if (typeof v === 'string' && (k === 'text' || k === 'name' || k === 'title')) o[k] = __aqTr(v);
      else if (Array.isArray(v) && (k === 'x' || k === 'y') && v.length < 40 && v.every(function (e) { return typeof e === 'string'; })) o[k] = v.map(__aqTr);
      else if (v && typeof v === 'object' && k !== 'z') walk(v);
    }
  })([data, layout]);
}

(function () {
  function addToggle() {
    var bar = document.querySelector('header.topbar');
    if (!bar || bar.querySelector('.aq-lang')) return;
    var b = document.createElement('button');
    b.className = 'pill aq-lang';
    b.textContent = __aqLang === 'ru' ? 'EN' : 'RU';
    b.title = __aqLang === 'ru' ? 'Switch to English' : 'Переключить на русский';
    b.style.cssText = 'cursor:pointer;background:transparent;margin-left:8px;font:inherit;color:inherit';
    b.onclick = function () { try { localStorage.setItem('aq_lang', __aqLang === 'ru' ? 'en' : 'ru'); } catch (e) {} location.reload(); };
    bar.appendChild(b);
  }
  var SKIP = 'script,style,textarea,.katex,.aq-lang,.no-tr';
  var done = new WeakMap();
  function trText(n) {
    var p = n.parentElement; if (!p || p.closest(SKIP)) return;
    var v = n.nodeValue; if (!v || done.get(n) === v) return;
    var t = __aqTr(v); if (t !== v) { done.set(n, t); n.nodeValue = t; }
  }
  function trAttrs(el) {
    if (el.closest && el.closest(SKIP)) return;
    ['title', 'placeholder', 'aria-label'].forEach(function (a) {
      var v = el.getAttribute && el.getAttribute(a); if (!v) return;
      var t = __aqTr(v); if (t !== v) el.setAttribute(a, t);
    });
  }
  function trTree(root) {
    if (root.nodeType === 3) return trText(root);
    if (root.nodeType !== 1) return;
    trAttrs(root);
    var w = document.createTreeWalker(root, NodeFilter.SHOW_TEXT | NodeFilter.SHOW_ELEMENT), n;
    while ((n = w.nextNode())) { if (n.nodeType === 3) trText(n); else trAttrs(n); }
  }
  function start() {
    addToggle();
    if (__aqLang !== 'ru') return;
    document.documentElement.lang = 'ru';
    document.title = __aqTr(document.title);
    trTree(document.body);
    new MutationObserver(function (list) {
      for (var i = 0; i < list.length; i++) {
        var m = list[i];
        if (m.type === 'characterData') trText(m.target);
        else if (m.type === 'attributes') trAttrs(m.target);
        else for (var j = 0; j < m.addedNodes.length; j++) trTree(m.addedNodes[j]);
      }
      addToggle();
    }).observe(document.body, { subtree: true, childList: true, characterData: true, attributes: true, attributeFilter: ['title', 'placeholder', 'aria-label'] });
  }
  if (__aqLang !== 'ru') { new MutationObserver(addToggle).observe(document.documentElement, { subtree: true, childList: true }); }
  if (document.body) start(); else document.addEventListener('DOMContentLoaded', start);
})();
