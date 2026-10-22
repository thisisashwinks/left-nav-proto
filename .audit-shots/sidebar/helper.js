() => {
  // Audit helper: injected into both staging and the prototype.
  const vis = e => { const r = e.getBoundingClientRect(); return r.width > 0 && r.height > 0; };
  const ownText = e => [...e.childNodes].filter(n => n.nodeType === 3).map(n => n.textContent).join('').trim();
  const rgbToHex = c => { const m = c.match(/\d+(\.\d+)?/g); if (!m) return c; const [r, g, b, a] = m.map(Number); const h = '#' + [r, g, b].map(x => x.toString(16).padStart(2, '0')).join('').toUpperCase(); return a !== undefined && a < 1 ? `${h} @${a}` : h; };
  const color = c => (c === 'rgba(0, 0, 0, 0)' || c === 'transparent') ? 'none' : rgbToHex(c);
  window.__au = {
    // Find visible elements whose own text matches exactly (case-insensitive), optionally inside a region.
    find(text, { minX = -1, maxX = 1e9, minY = -1, maxY = 1e9, root = document.body } = {}) {
      return [...root.querySelectorAll('*')].filter(e => vis(e) && ownText(e).toLowerCase() === text.toLowerCase()).filter(e => { const r = e.getBoundingClientRect(); return r.x >= minX && r.x <= maxX && r.y >= minY && r.y <= maxY; });
    },
    text(e) { const s = getComputedStyle(e); return { font: s.fontFamily.split(',')[0].replace(/"/g, ''), size: s.fontSize, weight: s.fontWeight, lh: s.lineHeight, ls: s.letterSpacing, tt: s.textTransform, color: color(s.color) }; },
    box(e) { const s = getComputedStyle(e), r = e.getBoundingClientRect(); return { x: Math.round(r.x * 10) / 10, y: Math.round(r.y * 10) / 10, w: Math.round(r.width * 10) / 10, h: Math.round(r.height * 10) / 10, pad: s.padding, gap: s.gap, radius: s.borderRadius, bg: color(s.backgroundColor), border: s.borderWidth !== '0px' ? `${s.borderWidth} ${s.borderStyle} ${color(s.borderColor)}` : 'none', shadow: s.boxShadow === 'none' ? 'none' : s.boxShadow, cursor: s.cursor, opacity: s.opacity, transition: s.transitionDuration !== '0s' ? `${s.transitionProperty} ${s.transitionDuration} ${s.transitionTimingFunction}` : 'none' }; },
    icon(e) { const svg = e.querySelector('svg') || (e.tagName === 'svg' ? e : null); if (!svg) return null; const r = svg.getBoundingClientRect(), s = getComputedStyle(svg); return { w: Math.round(r.width * 10) / 10, h: Math.round(r.height * 10) / 10, color: color(s.color), stroke: s.strokeWidth, cls: String(svg.className.baseVal || '').slice(0, 60) }; },
    // Walk up to the nearest clickable ancestor.
    hit(e) { let p = e; while (p && p !== document.body) { if (['A', 'BUTTON'].includes(p.tagName) || p.getAttribute('role') === 'button' || p.getAttribute('role') === 'menuitem' || getComputedStyle(p).cursor === 'pointer' && getComputedStyle(p.parentElement).cursor !== 'pointer') return p; p = p.parentElement; } return null; },
    chain(e, n = 5) { const out = []; let p = e; for (let i = 0; i < n && p; i++) { out.push({ tag: p.tagName, cls: String(p.className?.baseVal ?? p.className).slice(0, 70), ...this.box(p) }); p = p.parentElement; } return out; },
    mark(e, c = '#F04438', dashed = false) { e.style.outline = `2px ${dashed ? 'dashed' : 'solid'} ${c}`; e.style.outlineOffset = '2px'; e.setAttribute('data-audit', '1'); },
    clear() { document.querySelectorAll('[data-audit]').forEach(e => { e.style.outline = ''; e.style.outlineOffset = ''; e.removeAttribute('data-audit'); }); },
    // Describe a horizontal strip of the page: every visible leaf with text or an svg.
    strip(minY, maxY, minX = 0, maxX = 1e9) {
      return [...document.querySelectorAll('body *')].filter(e => vis(e) && (ownText(e) || e.tagName === 'svg')).filter(e => { const r = e.getBoundingClientRect(); return r.y >= minY && r.y + r.height <= maxY && r.x >= minX && r.x <= maxX; }).filter(e => !(e.tagName !== 'svg' && e.closest('svg'))).map(e => { const r = e.getBoundingClientRect(); return { t: e.tagName === 'svg' ? '[svg]' : ownText(e).slice(0, 40), x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), h: Math.round(r.height), ...(e.tagName === 'svg' ? { color: color(getComputedStyle(e).color) } : this.text(e)) }; });
    },
  };
  return 'helper ready';
}
