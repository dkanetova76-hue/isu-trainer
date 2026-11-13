/* «Мой прогресс» для студента: сколько сделано из положенного по модулям, сроки, долги.
   Подключается после основного скрипта учебника; берёт план из plan.js (window.PLANS[COURSE_ID]).
   Показывает блок в окне «Мои работы» и всплывающее напоминание, если срок близко или есть долги. */
(() => {
  const ID = window.COURSE_ID, P = (window.PLANS || {})[ID];
  if (!P || typeof loadMine !== 'function') return;
  const KY = (document.documentElement.lang || '').startsWith('ky'), DAY = 864e5;
  const T = KY ? {
    title: 'Менин прогрессим', week: n => `Семестрдин ${n}-жумасы`, st: {'1': '1-модуль', '2': '2-модуль', F: 'Жыйынтыктоочу көзөмөл'},
    till: d => `${d} чейин`, done: (d, n) => `${n} ичинен ${d} аткарылды`, debt: n => `Мөөнөтү өттү: ${n} иш тапшырыла элек. Мүмкүн болушунча тезирээк тапшырыңыз.`,
    allok: 'Баары тапшырылды ✓', left: n => `${n} күн калды`, behind: (e, d) => `Графикти кармоо үчүн ушул жумага чейин ${e} иш болушу керек, сизде ${d}.`,
    ontrack: 'Графикти кармап жатасыз.', future: d => `${d} башталат`, notdone: n => `Тапшырыла элек (${n})`,
    tests: a => `Тесттердин орточо жыйынтыгы: ${a} %`, reps: (c, n, g) => `Текшерилген отчёттор: ${n} ичинен ${c}${g ? ` · орточо баа ${g}` : ''}`,
    more: 'Толугураак', toastDebt: (m, n) => `${m}: мөөнөтү өттү, ${n} иш тапшырыла элек.`, toastSoon: (m, n, d) => `${m}: ${d} күн калды, дагы ${n} иш тапшыруу керек.`, toastBehind: (m) => `${m}: графиктен артта калып жатасыз.`,
    hint: 'Тест — жок дегенде бир жолу тапшырылса, отчёт — жөнөтүлсө эсептелет.'
  } : {
    title: 'Мой прогресс', week: n => `Неделя ${n} семестра`, st: {'1': 'Модуль 1', '2': 'Модуль 2', F: 'Итоговый контроль'},
    till: d => `до ${d}`, done: (d, n) => `сделано ${d} из ${n}`, debt: n => `Срок прошёл: не сдано ${n}. Сдайте как можно скорее.`,
    allok: 'Всё сдано ✓', left: n => `осталось ${n} ${n % 10 === 1 && n % 100 !== 11 ? 'день' : n % 10 >= 2 && n % 10 <= 4 && (n % 100 < 10 || n % 100 >= 20) ? 'дня' : 'дней'}`,
    behind: (e, d) => `Чтобы идти по графику, к этой неделе нужно сделать ${e}, у вас ${d}.`, ontrack: 'Вы идёте по графику.', future: d => `начнётся ${d}`,
    notdone: n => `Не сдано (${n})`, tests: a => `Средний результат тестов: ${a} %`, reps: (c, n, g) => `Проверено отчётов: ${c} из ${n}${g ? ` · средняя оценка ${g}` : ''}`,
    more: 'Подробнее', toastDebt: (m, n) => `${m}: срок прошёл, не сдано работ — ${n}.`, toastSoon: (m, n, d) => `${m}: ${d}, осталось сдать ${n}.`, toastBehind: m => `${m}: вы отстаёте от графика.`,
    hint: 'Тест засчитывается после первой попытки, отчёт — после отправки.'
  };
  const mon = s => { const d = new Date(s + 'T00:00:00'); d.setDate(d.getDate() - (d.getDay() + 6) % 7); return d; };
  const W0 = mon(P.start), wStart = w => new Date(+W0 + (w - 1) * 7 * DAY), wEnd = w => new Date(+W0 + w * 7 * DAY - 1);
  const fd = d => KY ? d.toLocaleDateString('ru-RU', {day: '2-digit', month: '2-digit'}) : d.toLocaleDateString('ru-RU', {day: 'numeric', month: 'long'});
  const e = s => String(s ?? '').replace(/[&<>"]/g, c => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;'}[c]));
  const css = document.createElement('style');
  css.textContent = `.pg{border:1px solid rgba(127,127,127,.35);border-radius:8px;padding:12px 14px;margin:0 0 16px}.pg h3{margin:0 0 2px}
.pg-sub{font-size:13px;opacity:.75;margin:0 0 6px}.pg-row{margin:12px 0 0}.pg-hd{display:flex;justify-content:space-between;gap:10px;flex-wrap:wrap;font-size:14px}
.pg-bar{height:8px;background:rgba(127,127,127,.22);border-radius:4px;overflow:hidden;margin:5px 0 3px}.pg-bar span{display:block;height:100%;background:#2f6fd6;border-radius:4px}
.pg-st{font-size:13.5px}.pg-red{color:#c0392b;font-weight:600}.pg-amb{color:#b7791f;font-weight:600}.pg-ok{color:#2e8b57}.pg-mut{opacity:.7}
.pg details{font-size:13px;margin-top:3px}.pg ul{margin:4px 0;padding-left:20px}.pg-foot{font-size:13px;opacity:.8;margin-top:10px}
.pg-toast{position:fixed;right:16px;bottom:16px;max-width:380px;z-index:60;background:#fff;color:#16202b;border:1px solid #d8dee5;border-left:5px solid #b7791f;border-radius:8px;box-shadow:0 8px 28px rgba(0,0,0,.2);padding:12px 36px 12px 14px;font-size:14px;line-height:1.45}
.pg-toast.red{border-left-color:#c0392b}.pg-toast b{display:block;margin-bottom:2px}.pg-toast p{margin:0 0 4px}.pg-toast button{font:inherit;cursor:pointer}
.pg-toast .pg-x{position:absolute;top:6px;right:8px;border:0;background:none;font-size:18px;color:inherit;opacity:.6}.pg-toast .pg-go{margin-top:6px;border:1px solid #2f6fd6;background:#2f6fd6;color:#fff;border-radius:5px;padding:5px 10px}
@media (prefers-color-scheme: dark){.pg-toast{background:#18202a;color:#e6ebf0;border-color:#2c3743}}`;
  document.head.appendChild(css);

  async function mySubs(){
    const {data, error} = await SB.from('submissions').select('kind,ref,score,teacher_grade,created_at,user_id,course:data->>course').eq('user_id', ME.id).limit(2000);
    if (error) throw error; return (data || []).filter(s => (s.course || 'isu') === ID);
  }
  function calc(subs){
    const now = Date.now(), w = Math.floor((now - W0) / (7 * DAY)) + 1, has = new Set(subs.map(s => s.kind + ':' + s.ref));
    const S = [['1', P.w1, 1], ['2', P.w2, P.w1 + 1], ['F', P.wf, P.w2 + 1]].map(([m, wd, ws]) => {
      const it = P.items.filter(x => x.m === m), left = it.filter(x => !has.has(x.kind + ':' + x.id)), n = it.length, d = n - left.length;
      const exp = m === '1' ? (w >= P.w1 ? n : Math.round(n * Math.max(0, w) / P.w1)) : m === '2' ? (w <= P.w1 ? 0 : w >= P.w2 ? n : Math.round(n * (w - P.w1) / (P.w2 - P.w1))) : (w >= P.wf ? n : 0);
      const end = wEnd(wd), days = Math.ceil((end - now) / DAY), phase = w > wd ? 'past' : w >= ws ? 'now' : 'future';
      let cls = 'pg-ok', msg = T.allok, alert = null;
      if (!left.length) {}
      else if (phase === 'past'){ cls = 'pg-red'; msg = T.debt(left.length); alert = {lvl: 2, txt: T.toastDebt(T.st[m], left.length)}; }
      else if (phase === 'future'){ cls = 'pg-mut'; msg = T.future(fd(wStart(ws))); }
      else {
        const soon = days <= 14, beh = d < exp;
        cls = days <= 7 ? 'pg-red' : soon || beh ? 'pg-amb' : 'pg-ok';
        msg = T.left(days) + '. ' + (beh ? T.behind(exp, d) : T.ontrack);
        if (soon) alert = {lvl: days <= 7 ? 2 : 1, txt: T.toastSoon(T.st[m], left.length, T.left(days))};
        else if (beh && exp - d >= 2) alert = {lvl: 1, txt: T.toastBehind(T.st[m])};
      }
      return {m, n, d, left, end, phase, cls, msg, alert};
    });
    const tb = {}; subs.filter(s => s.kind === 'test').forEach(s => { tb[s.ref] = Math.max(tb[s.ref] ?? 0, +s.score || 0); });
    const tv = Object.values(tb), reps = {}; subs.filter(s => s.kind === 'report').sort((a, b) => a.created_at < b.created_at ? -1 : 1).forEach(s => { reps[s.ref] = s.teacher_grade || reps[s.ref] || null; });
    const rv = Object.values(reps), rg = rv.filter(Boolean);
    return {w, S, tavg: tv.length ? Math.round(tv.reduce((a, x) => a + x, 0) / tv.length) : null, rn: rv.length, rc: rg.length, rgav: rg.length ? (rg.reduce((a, x) => a + +x, 0) / rg.length).toFixed(1).replace('.', ',') : null};
  }
  function html(R){
    return `<div class="pg"><h3>${T.title} · ${e(P.name)}</h3><p class="pg-sub">${T.week(R.w)} · ${fd(new Date())}</p>
      ${R.S.map(s => `<div class="pg-row"><div class="pg-hd"><b>${T.st[s.m]} · ${T.till(fd(s.end))}</b><span>${T.done(s.d, s.n)}</span></div>
        <div class="pg-bar"><span style="width:${s.n ? Math.round(s.d / s.n * 100) : 0}%"></span></div>
        <div class="pg-st ${s.cls}">${e(s.msg)}</div>
        ${s.left.length && s.phase !== 'future' ? `<details${s.phase === 'past' ? ' open' : ''}><summary>${T.notdone(s.left.length)}</summary><ul>${s.left.map(x => `<li>${e(x.t)}</li>`).join('')}</ul></details>` : ''}</div>`).join('')}
      <p class="pg-foot">${R.tavg != null ? T.tests(R.tavg) + ' · ' : ''}${T.reps(R.rc, R.rn, R.rgav)}<br><span class="pg-mut">${T.hint}</span></p></div>`;
  }
  /* блок в «Мои работы» */
  const _lm = loadMine;
  loadMine = async function(){
    await _lm.apply(this, arguments);
    const box = document.getElementById('au-mine'); if (!box || !ME || ME.role === 'teacher') return;
    try { box.insertAdjacentHTML('afterbegin', html(calc(await mySubs()))); } catch(err){}
  };
  /* напоминание: не чаще раза в день на дисциплину, если есть долги, срок ≤ 14 дней или отставание */
  let shownFor = null;
  async function toast(){
    if (!ME || ME.role === 'teacher' || shownFor === ME.id) return; shownFor = ME.id;
    const key = 'pg-toast-' + ID + '-' + ME.id, today = new Date().toDateString();
    try { if (localStorage.getItem(key) === today) return; } catch(err){}
    let R; try { R = calc(await mySubs()); } catch(err){ return; }
    const A = R.S.map(s => s.alert).filter(Boolean).sort((a, b) => b.lvl - a.lvl); if (!A.length) return;
    const el = document.createElement('div'); el.className = 'pg-toast' + (A[0].lvl > 1 ? ' red' : ''); el.setAttribute('role', 'status');
    el.innerHTML = `<button class="pg-x" aria-label="×">×</button><b>${T.title}</b>${A.slice(0, 2).map(a => `<p>${e(a.txt)}</p>`).join('')}<button class="pg-go">${T.more}</button>`;
    const close = () => { el.remove(); try { localStorage.setItem(key, today); } catch(err){} };
    el.querySelector('.pg-x').onclick = close;
    el.querySelector('.pg-go').onclick = () => { close(); authOpen('mine'); };
    document.body.appendChild(el);
  }
  if (typeof acctRender === 'function'){ const _ar = acctRender; acctRender = function(){ const r = _ar.apply(this, arguments); if (ME && SB) setTimeout(toast, 1500); return r; }; }
})();
