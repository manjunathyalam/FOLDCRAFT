/* =====================================================================
   FoldCraft — app.js
   DOM wiring only. All real math lives in folding.js.
===================================================================== */

(function () {

  const HERO_WORDS = ['FOLD', '2026', 'LOVE', 'MUM'];
  const HERO_PAGES = 56;
  const HERO_RES = 90;

  function el(id) { return document.getElementById(id); }

  function buildSpineStrip(word) {
    const strip = el('spineStrip');
    if (!strip) return;
    const grid = FoldCraft.generatePattern(word, HERO_PAGES, "'Work Sans', sans-serif", HERO_RES);
    strip.innerHTML = '';
    const frag = document.createDocumentFragment();
    grid.forEach(col => {
      const span = document.createElement('span');
      span.style.background = gradientFromColumn(col);
      frag.appendChild(span);
    });
    strip.style.opacity = '0';
    requestAnimationFrame(() => {
      strip.appendChild(frag);
      strip.style.opacity = '1';
    });
  }

  function gradientFromColumn(col) {
    const resolution = col.length;
    const stops = [];
    let cursor = 0;
    let current = col[0];
    stops.push(`var(--card) 0%`);
    for (let r = 1; r <= resolution; r++) {
      const val = r < resolution ? col[r] : !current;
      if (val !== current) {
        const pct = (r / resolution * 100).toFixed(2) + '%';
        stops.push(`${current ? 'var(--brass-light)' : 'var(--card)'} ${pct}`);
        stops.push(`${val ? 'var(--brass-light)' : 'var(--card)'} ${pct}`);
        current = val;
      }
    }
    stops.push(`${current ? 'var(--brass-light)' : 'var(--card)'} 100%`);
    return `linear-gradient(to bottom, ${stops.join(', ')})`;
  }

  function cycleHero() {
    let i = 0;
    buildSpineStrip(HERO_WORDS[i]);
    setInterval(() => {
      i = (i + 1) % HERO_WORDS.length;
      buildSpineStrip(HERO_WORDS[i]);
    }, 3200);
  }

  function buildExamples() {
    document.querySelectorAll('.example-canvas').forEach(canvas => {
      const text = canvas.dataset.text || '';
      const grid = FoldCraft.generatePattern(text, 48, "'Fraunces', serif", 60);
      FoldCraft.drawPatternToCanvas(canvas, grid, { bg: '#F8F1DE', ink: '#AD7C3D' });
    });

    document.querySelectorAll('.example-card').forEach(btn => {
      btn.addEventListener('click', () => {
        const value = btn.dataset.value || '';
        el('inputText').value = value;
        el('genForm').dispatchEvent(new Event('submit', { cancelable: true }));
        el('generator').scrollIntoView({ behavior: 'smooth', block: 'start' });
      });
    });
  }

  let lastInstructions = [];

  function runGenerator(e) {
    if (e) e.preventDefault();

    const text = el('inputText').value;
    const pages = clamp(parseInt(el('pageCount').value, 10) || 120, 20, 400);
    const pageHeightMM = clamp(parseInt(el('pageHeight').value, 10) || 210, 100, 400);
    const fontFamily = el('fontChoice').value;

    const grid = FoldCraft.generatePattern(text, pages, fontFamily);
    const instructions = FoldCraft.computeInstructions(grid, pageHeightMM);
    lastInstructions = instructions;

    FoldCraft.drawPatternToCanvas(el('previewCanvas'), grid, { bg: '#F8F1DE', ink: '#E0C28E' });
    renderInstructionsTable(instructions);

    el('genResult').hidden = false;
  }

  function clamp(n, min, max) { return Math.min(max, Math.max(min, n)); }

  function renderInstructionsTable(instructions) {
    const tbody = el('instructionsTable').querySelector('tbody');
    tbody.innerHTML = '';

    instructions.forEach(({ page, segments, hasFold }) => {
      const tr = document.createElement('tr');

      const tdPage = document.createElement('td');
      tdPage.textContent = page;

      const tdLines = document.createElement('td');
      const tdRanges = document.createElement('td');

      if (!hasFold) {
        tdLines.innerHTML = '<span class="no-fold">no fold — leave flat</span>';
        tdRanges.innerHTML = '<span class="no-fold">—</span>';
      } else {
        const allMarks = [];
        segments.forEach(s => { allMarks.push(s.startMM, s.endMM); });
        tdLines.textContent = allMarks.map(m => m.toFixed(1)).join(', ');
        tdRanges.textContent = segments
          .map(s => `${s.startMM.toFixed(1)}–${s.endMM.toFixed(1)} (${s.type})`)
          .join('  ·  ');
      }

      tr.append(tdPage, tdLines, tdRanges);
      tbody.appendChild(tr);
    });
  }

  function downloadCSV() {
    if (!lastInstructions.length) return;
    const csv = FoldCraft.toCSV(lastInstructions);
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const label = (el('inputText').value || 'pattern').trim().replace(/[^a-z0-9]+/gi, '-').toLowerCase();
    a.download = `foldcraft-${label || 'pattern'}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  function printSheet() {
    window.print();
  }

  function init() {
    el('genForm').addEventListener('submit', runGenerator);
    el('printBtn').addEventListener('click', printSheet);
    el('csvBtn').addEventListener('click', downloadCSV);

    buildExamples();
    cycleHero();
    runGenerator(); // show a result immediately so the tool isn't an empty form
  }

  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(init);
  } else {
    document.addEventListener('DOMContentLoaded', init);
  }
})();
