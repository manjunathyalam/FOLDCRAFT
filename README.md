# FoldCraft

A free, self-hostable book-folding pattern generator. Type a word, name,
date, or number, and FoldCraft works out exactly where to fold each page —
in millimetres — based on your book's real page count and page height.

No build step, no backend, no API keys, no tracking, no paywall. It's four files:

```
index.html
css/style.css
css/print.css
js/folding.js
js/app.js
```

## Running it locally

Just double-click `index.html`, or serve the folder with any static server:

```bash
npx serve .
```

## Hosting it for free

Any static-site host works, since there's no server code.

**GitHub Pages**
1. Create a new repo and push these files to it (keep the folder structure).
2. Repo Settings → Pages → set source to the `main` branch, `/ (root)`.
3. Your site is live at `https://yourusername.github.io/your-repo-name`.

**Netlify**
1. netlify.com → "Add new site" → "Deploy manually".
2. Drag this whole folder into the upload box.
3. You get a live URL instantly; rename it for free in site settings.

**Vercel**
1. `npm i -g vercel`, then run `vercel` inside this folder — or drag-and-drop
   the folder at vercel.com/new.
2. No configuration needed; it's fully static.

**Cloudflare Pages**
1. pages.cloudflare.com → "Upload assets".
2. Drag the folder in. Live in seconds.

## How the math works, briefly

- `js/folding.js` renders your text onto an invisible canvas that's exactly
  as wide (in samples) as the number of pages you're folding — one column
  per page.
- For each page/column, it scans top to bottom looking for "ink" pixels and
  groups them into runs.
- Each run gets converted from a pixel range into a millimetre range, scaled
  to the real page height you entered. Those millimetre numbers are the
  fold marks: fold the page in at the first number, fold it back out at the
  second.
- `js/app.js` is purely the UI glue — reading the form, drawing the preview
  canvas, building the instructions table, and wiring up the CSV/print
  export buttons. It has no folding math of its own.

This is a simplified geometric helper, not a precision tool for every
binding type. Test the technique on a few scrap pages before committing to
a real book.

## Customising

- Colours, type, and spacing are CSS variables at the top of `css/style.css`
  under `:root`.
- To change the name/branding: edit the `<title>` and meta description in
  `index.html`, the `.brand` text, and the footer line.
- The three example patterns on the page are defined in `index.html` under
  `#examplesGrid` — add a new `.example-card` with a `data-value` (what
  fills the input) and a matching `data-text` on its inner canvas.
