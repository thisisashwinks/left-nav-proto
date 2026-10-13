/* Prototype controls shared by the docs and the slides.
   Every live prototype (playground.html?embed=1&…) can be driven with the same options as the playground panel.
   PGC.keysFor(q)                     → control keys that apply to the query's scenario
   PGC.strip(el, { q, keys, theme, onChange })  → renders a control bar; onChange(newQuery) on every change
   PGC.live(el)                       → <div data-pg-live data-q="…" data-keys="…" data-caption="…"> becomes a scaled live frame + controls */
(function () {
  'use strict';
  const DEFS = {
    mode: ['System', [['today', 'Today'], ['proposed', 'Proposed']], 'proposed'],
    net: ['Network', [['instant', 'Instant'], ['fast', 'Fast'], ['typical', 'Typical'], ['slow', 'Slow'], ['vslow', 'Very slow'], ['fail', 'Fails'], ['hang', 'Hangs']], 'typical'],
    scale: ['Speed', [['0.5', '0.5×'], ['1', '1×'], ['2', '2×'], ['4', '4×']], '1'],
    trefresh: ['On refresh', [['line', 'Rows stay'], ['rows', 'Skeleton new rows']], 'line'],
    tchanged: ['Older rows change', [['0', 'Off'], ['1', 'On']], '0'],
    tfilter: ['On filter', [['stale', 'Rows stay'], ['skeleton', 'Skeleton all rows']], 'stale'],
    tbar: ['Progress bar', [['1', 'On'], ['0', 'Off']], '1'],
    btnlabel: ['Label next to spinner', [['0', 'Off'], ['1', 'On']], '0'],
    itype: ['Files', [['single', '1 file'], ['multi', 'Multiple']], 'single'],
    icancel: ['Cancel', [['x', 'Top right ✕'], ['below', 'Below'], ['inline', 'Inline with bar']], 'x'],
    ipct: ['Percentage', [['1', 'On'], ['0', 'Off']], '1'],
    ifail: ['Fail a file', [['0', 'Off'], ['1', 'On']], '0'],
    iretry: ['Retry', [['below', 'Below the text'], ['inline', 'Top right']], 'below'],
    inote: ['“Keep working” line', [['header', 'In header'], ['below', 'Below header']], 'header'],
    iwide: ['Wider card', [['0', 'Off'], ['1', 'On']], '0'],
    iacts: ['Actions when done', [['0', 'Off'], ['1', 'On']], '0'],
  };
  const PROPOSED_ONLY = ['trefresh', 'tchanged', 'tfilter', 'tbar', 'btnlabel', 'itype', 'icancel', 'iacts', 'ipct', 'ifail', 'iretry', 'inote', 'iwide'];
  const BY_SCENARIO = { refresh: ['trefresh', 'tchanged', 'tbar'], filter: ['tfilter', 'tbar'], save: ['btnlabel'], import: ['itype', 'icancel', 'ipct', 'ifail', 'iretry', 'inote', 'iwide', 'iacts'] };

  const params = q => new URLSearchParams(String(q || '').replace(/&amp;/g, '&'));
  const get = (q, k) => { const p = params(q); return p.has(k) ? p.get(k) : DEFS[k][2]; };
  const set = (q, k, v) => { const p = params(q); p.set(k, v); return p.toString(); };
  const keysFor = (q, withMode) => [...(withMode ? ['mode'] : []), 'net', 'scale', ...(BY_SCENARIO[params(q).get('scenario')] || [])];

  const css = `
  .pgc{display:flex;flex-wrap:wrap;align-items:center;gap:8px 16px;font:500 12px/16px Inter,system-ui,sans-serif}
  .pgc-g{display:inline-flex;align-items:center;gap:8px}
  .pgc-g>span{color:#475467;white-space:nowrap}
  .pgc-seg{display:inline-flex;flex-wrap:wrap;border:1px solid #eaecf0;background:#f2f4f7;border-radius:8px;padding:2px;gap:2px}
  .pgc-seg button{font:inherit;height:24px;padding:0 9px;border:0;border-radius:6px;background:transparent;color:#475467;cursor:pointer;white-space:nowrap}
  .pgc-seg button[aria-pressed="true"]{background:#fff;color:#101828;box-shadow:0 1px 2px rgba(16,24,40,.08)}
  .pgc-seg button:focus-visible{outline:2px solid #155eef;outline-offset:1px}
  .pgc-g.off{opacity:.45}
  .pgc.dark .pgc-g>span{color:rgba(255,255,255,.72)}
  .pgc.dark .pgc-seg{border-color:rgba(255,255,255,.18);background:rgba(255,255,255,.1)}
  .pgc.dark .pgc-seg button{color:rgba(255,255,255,.82)}
  .pgc.dark .pgc-seg button[aria-pressed="true"]{background:#fff;color:#101828}
  .pgc.deck{font-size:17px;line-height:22px;gap:10px 20px}
  .pgc.deck .pgc-seg button{height:34px;padding:0 12px}
  .pg-live{display:flex;flex-direction:column;gap:10px}
  .pg-live .pgl-frame{position:relative;width:100%;aspect-ratio:1440/900;border:1px solid #eaecf0;border-radius:10px;overflow:hidden;background:#f9fafb}
  .pg-live .pgl-frame iframe{position:absolute;top:0;left:0;width:1440px;height:900px;border:0;transform-origin:0 0;transform:scale(var(--s,.4));pointer-events:none;background:#fff}
  .pg-live .pgl-bar{display:flex;align-items:center;gap:8px;flex-wrap:wrap}
  .pg-live .pgl-bar b{font-size:13px;font-weight:600;color:#101828;margin-right:auto}
  .pg-live .pgl-btn{font:500 12px/16px Inter,system-ui,sans-serif;height:28px;padding:0 10px;border:1px solid #d0d5dd;border-radius:8px;background:#fff;color:#344054;cursor:pointer}
  .pg-live .pgl-btn:hover{background:#f9fafb}
  .pg-live .pgl-cap{font-size:13px;line-height:18px;color:#475467;margin:0}
  .pg-pair{display:flex;flex-direction:column;gap:10px;min-width:0}
  .pg-pair .pgp-frames{display:grid;grid-template-columns:1fr 1fr;gap:12px}
  .pg-pair .pgp-l{display:flex;align-items:center;gap:6px;font:600 12px/16px Inter,system-ui,sans-serif;margin:0 0 6px;color:#101828}
  .pg-pair .pgp-l i{width:8px;height:8px;border-radius:50%;background:#d92d20}
  .pg-pair .pgp-l.p i{background:#079455}
  .pg-pair .pgp-l span{font-weight:400;color:#475467}
  .pg-pair .pgl-frame{position:relative;width:100%;aspect-ratio:1440/900;border:1px solid #eaecf0;border-radius:8px;overflow:hidden;background:#f9fafb;cursor:zoom-in}
  .pg-pair .pgl-frame iframe{position:absolute;top:0;left:0;width:1440px;height:900px;border:0;transform-origin:0 0;transform:scale(var(--s,.3));pointer-events:none;background:#fff}
  .pg-pair .pgp-bar{display:flex;align-items:center;gap:8px 12px;flex-wrap:wrap}
  .pg-pair .pgp-bar .pgc{flex:1}
  .pg-pair .pgl-btn{font:500 12px/16px Inter,system-ui,sans-serif;height:28px;padding:0 10px;border:1px solid #d0d5dd;border-radius:8px;background:#fff;color:#344054;cursor:pointer}
  @media (max-width:640px){.pg-pair .pgp-frames{grid-template-columns:1fr}}`;
  const st = document.createElement('style'); st.textContent = css; document.head.appendChild(st);

  function strip(el, o) {
    let q = o.q;
    const keys = o.keys || keysFor(q);
    const paint = () => {
      const today = get(q, 'mode') === 'today';
      el.classList.add('pgc'); if (o.theme) el.classList.add(o.theme);
      el.innerHTML = keys.map(k => {
        const [label, opts] = DEFS[k], v = get(q, k), off = today && PROPOSED_ONLY.includes(k);
        return `<div class="pgc-g${off ? ' off' : ''}" ${off ? 'title="Applies to Proposed"' : ''}><span>${label}</span><div class="pgc-seg" role="group" aria-label="${label}">${opts.map(([val, t]) => `<button type="button" data-k="${k}" data-v="${val}" aria-pressed="${val === v}">${t}</button>`).join('')}</div></div>`;
      }).join('');
    };
    el.onclick = e => {
      const b = e.target.closest('button[data-k]'); if (!b) return;
      e.stopPropagation();
      if (get(q, b.dataset.k) === b.dataset.v) return;
      q = set(q, b.dataset.k, b.dataset.v); paint(); o.onChange && o.onChange(q);
    };
    paint();
    return { get q() { return q; }, set q(v) { q = v; paint(); } };
  }

  /* Inline live example: lazy-loads when scrolled into view */
  const ro = 'ResizeObserver' in window ? new ResizeObserver(es => es.forEach(e => { const f = e.target.querySelector('iframe'); if (f) f.style.setProperty('--s', e.target.clientWidth / 1440); })) : null;
  const io = 'IntersectionObserver' in window ? new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.__load(); io.unobserve(e.target); } }), { rootMargin: '200px' }) : null;
  function live(el) {
    let q = el.dataset.q.replace(/&amp;/g, '&');
    const keys = el.dataset.keys ? el.dataset.keys.split(',') : keysFor(q, true);
    el.classList.add('pg-live');
    el.innerHTML = `<div class="pgl-bar"><b>${el.dataset.title || 'Live prototype'}</b><button type="button" class="pgl-btn" data-r>↻ Replay</button>${PGC.onExpand ? '<button type="button" class="pgl-btn" data-x>Expand</button>' : ''}</div><div class="pgl-frame"></div><div class="pgl-ctl"></div>${el.dataset.caption ? `<p class="pgl-cap">${el.dataset.caption}</p>` : ''}`;
    const fr = el.querySelector('.pgl-frame');
    let loaded = false;
    const load = () => {
      loaded = true; fr.textContent = '';
      const f = document.createElement('iframe');
      f.title = el.dataset.title || 'Live prototype'; f.tabIndex = -1; f.setAttribute('aria-hidden', 'true');
      f.style.setProperty('--s', (fr.clientWidth || 600) / 1440);
      f.src = 'playground.html?' + q; fr.appendChild(f);
    };
    fr.__load = load;
    strip(el.querySelector('.pgl-ctl'), { q, keys, onChange: nq => { q = nq; el.dataset.cur = q; if (loaded) load(); } });
    el.dataset.cur = q;
    el.querySelector('[data-r]').onclick = () => { if (loaded) load(); };
    const x = el.querySelector('[data-x]'); if (x) x.onclick = () => PGC.onExpand(el.dataset.cur, el.dataset.title || '', el.dataset.caption || '', x);
    if (ro) ro.observe(fr);
    if (io) io.observe(fr); else load();
  }

  /* Today vs Proposed pair: same scenario, both systems, 1 shared control bar. Any change restarts both. */
  function pair(el) {
    let q = el.dataset.q.replace(/&amp;/g, '&');
    const keys = el.dataset.keys ? el.dataset.keys.split(',') : keysFor(q);
    el.classList.add('pg-pair');
    const side = (m, lbl, cap) => `<div class="pgp-f" data-m="${m}"><div class="pgp-l ${m === 'proposed' ? 'p' : ''}"><i></i>${lbl}${cap ? ` <span>· ${cap}</span>` : ''}</div><div class="pgl-frame" title="Expand"></div></div>`;
    el.innerHTML = `<div class="pgp-frames">${side('today', 'Today', el.dataset.todayCap)}${side('proposed', 'Proposed', el.dataset.propCap)}</div><div class="pgp-bar"><div class="pgp-ctl"></div><button type="button" class="pgl-btn" data-r>↻ Replay</button></div>`;
    const frames = [...el.querySelectorAll('.pgl-frame')];
    let loaded = false;
    const load = () => {
      loaded = true;
      frames.forEach(fr => {
        const m = fr.parentElement.dataset.m; fr.textContent = '';
        const f = document.createElement('iframe');
        f.title = (m === 'today' ? 'Today' : 'Proposed') + ' · live prototype'; f.tabIndex = -1; f.setAttribute('aria-hidden', 'true');
        f.style.setProperty('--s', (fr.clientWidth || 400) / 1440);
        f.src = 'playground.html?' + set(q, 'mode', m); fr.appendChild(f);
      });
    };
    frames[0].__load = load;
    strip(el.querySelector('.pgp-ctl'), { q, keys, onChange: nq => { q = nq; if (loaded) load(); } });
    el.querySelector('[data-r]').onclick = () => { if (loaded) load(); };
    frames.forEach(fr => { fr.onclick = () => { if (PGC.onExpand) PGC.onExpand(set(q, 'mode', fr.parentElement.dataset.m), el.dataset.title || '', el.dataset.caption || '', fr); }; if (ro) ro.observe(fr); });
    if (io) io.observe(frames[0]); else load();
  }

  const PGC = window.PGC = { DEFS, keysFor, strip, live, pair, get, set, onExpand: null };
  const boot = () => { document.querySelectorAll('[data-pg-live]').forEach(live); document.querySelectorAll('[data-pg-pair]').forEach(pair); };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else setTimeout(boot, 0);
})();
