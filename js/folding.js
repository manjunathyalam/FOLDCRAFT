/* =====================================================================
   FoldCraft — folding.js
   The actual book-folding math. No UI code lives here.

   How it works:
   1. Render the input text onto an offscreen canvas, one pixel column
      "bucket" per page, supersampled for cleaner letterforms.
   2. For every page (column), scan top-to-bottom and group filled
      pixels into runs ("ink segments").
   3. Convert each run's pixel position into millimetres, scaled to the
      real page height the person entered.

   That's the whole trick: a page is just a column in a bitmap, and a
   fold mark is just where that column's ink starts or stops.
===================================================================== */

const FoldCraft = (() => {

  const SUPER = 3;        // supersampling factor for cleaner letterforms
  const RESOLUTION = 260; // vertical samples per page (internal detail level)

  /**
   * Renders `text` into a boolean grid: grid[pageIndex][rowIndex].
   * true = ink present at that page/row = a fold mark needed there.
   */
  function generatePattern(text, pages, fontFamily, resolution = RESOLUTION) {
    pages = Math.max(1, Math.floor(pages));
    resolution = Math.max(10, Math.floor(resolution));

    const cw = pages * SUPER;
    const ch = resolution * SUPER;

    const canvas = document.createElement('canvas');
    canvas.width = cw;
    canvas.height = ch;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });

    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, cw, ch);
    ctx.fillStyle = '#000000';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    const safeText = (text || '').trim() || '?';
    let fontSize = ch * 0.82;
    ctx.font = `900 ${fontSize}px ${fontFamily}`;
    let textWidth = ctx.measureText(safeText).width;
    const maxWidth = cw * 0.94;
    if (textWidth > maxWidth) {
      fontSize = fontSize * (maxWidth / textWidth);
      ctx.font = `900 ${fontSize}px ${fontFamily}`;
    }
    ctx.fillText(safeText, cw / 2, ch / 2 + fontSize * 0.02);

    const img = ctx.getImageData(0, 0, cw, ch).data;

    const grid = [];
    for (let p = 0; p < pages; p++) {
      const col = new Array(resolution);
      for (let r = 0; r < resolution; r++) {
        let dark = 0;
        const total = SUPER * SUPER;
        for (let dx = 0; dx < SUPER; dx++) {
          for (let dy = 0; dy < SUPER; dy++) {
            const x = p * SUPER + dx;
            const y = r * SUPER + dy;
            const idx = (y * cw + x) * 4;
            if (img[idx] < 130) dark++;
          }
        }
        col[r] = (dark / total) > 0.4;
      }
      grid.push(col);
    }
    return grid;
  }

  /**
   * Turns the boolean grid into real fold instructions in millimetres.
   * Returns one entry per page: { page, segments: [{startMM,endMM,type}], hasFold }
   */
  function computeInstructions(grid, pageHeightMM) {
    return grid.map((col, i) => {
      const resolution = col.length;
      const runs = [];
      let start = null;
      for (let r = 0; r <= resolution; r++) {
        const filled = r < resolution ? col[r] : false;
        if (filled && start === null) start = r;
        if (!filled && start !== null) {
          runs.push([start, r]);
          start = null;
        }
      }
      const segments = runs.map(([s, e], idx) => ({
        startMM: round1((s / resolution) * pageHeightMM),
        endMM: round1((e / resolution) * pageHeightMM),
        type: idx % 2 === 0 ? 'V' : 'M'
      }));
      return { page: i + 1, segments, hasFold: segments.length > 0 };
    });
  }

  function round1(n) {
    return Math.round(n * 10) / 10;
  }

  /**
   * Draws the grid as a pixel-accurate silhouette. Intended to be scaled
   * up with CSS `image-rendering: pixelated` for a crisp barcode look.
   */
  function drawPatternToCanvas(canvas, grid, opts = {}) {
    const pages = grid.length;
    const resolution = pages ? grid[0].length : 1;
    canvas.width = Math.max(pages, 1);
    canvas.height = Math.max(resolution, 1);
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = opts.bg || '#F8F1DE';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = opts.ink || '#E0C28E';
    for (let p = 0; p < pages; p++) {
      for (let r = 0; r < resolution; r++) {
        if (grid[p][r]) ctx.fillRect(p, r, 1, 1);
      }
    }
  }

  /** Builds the CSV export string from a full instructions array. */
  function toCSV(instructions) {
    const rows = [['page', 'segment', 'start_mm', 'end_mm', 'fold_type']];
    instructions.forEach(({ page, segments }) => {
      if (!segments.length) {
        rows.push([page, '', '', '', 'none']);
      } else {
        segments.forEach((s, i) => {
          rows.push([page, i + 1, s.startMM, s.endMM, s.type]);
        });
      }
    });
    return rows.map(r => r.join(',')).join('\n');
  }

  return { generatePattern, computeInstructions, drawPatternToCanvas, toCSV, RESOLUTION };
})();
