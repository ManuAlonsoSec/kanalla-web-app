// ──────────────────────────────────────────────────────────────────────────────
// vectorize-logo.mjs — Traza el logo Kanalla Burger (PNG tinta) a SVG por capas.
//
//   node scripts/vectorize-logo.mjs
//
// Entrada : public/images/logo-kanalla-burger-tinta.png (1024×1024, alfa)
// Salida  : src/app/features/home/logo/logo-paths.ts   (paths por capa)
//           public/images/logo-kanalla-burger-tinta.svg (SVG estático completo)
//           scripts/out/logo-overlay.png                (comparación visual)
//
// No redibuja nada: cada capa es la tinta original del PNG, separada por
// componentes conectados y trazada con potrace sobre el alfa escalado 2×
// (así la curva sigue el antialias del original en vez del pixelado).
// ──────────────────────────────────────────────────────────────────────────────
import sharp from 'sharp';
import potrace from 'potrace';
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const SRC = resolve(root, 'public/images/logo-kanalla-burger-tinta.png');
const OUT_TS = resolve(root, 'src/app/features/home/logo/logo-paths.ts');
const OUT_SVG = resolve(root, 'public/images/logo-kanalla-burger-tinta.svg');
const OUT_DIR = resolve(root, 'scripts/out');
const INK = '#492310';
const UP = 2; // factor de escalado antes de trazar

// ── 1. Alfa del original ─────────────────────────────────────────────────────
const { data: alpha, info } = await sharp(SRC)
  .ensureAlpha()
  .extractChannel(3)
  .raw()
  .toBuffer({ resolveWithObject: true });
const W = info.width;
const H = info.height;

// ── 2. Componentes conectados (8-vecinos) sobre alfa ≥ 128 ───────────────────
const ink = new Uint8Array(W * H);
for (let i = 0; i < W * H; i++) ink[i] = alpha[i] >= 128 ? 1 : 0;
const label = new Int32Array(W * H);
const comps = [];
{
  let n = 0;
  const stack = [];
  for (let i = 0; i < W * H; i++) {
    if (!ink[i] || label[i]) continue;
    n++;
    const c = { id: n, area: 0, x0: W, x1: 0, y0: H, y1: 0 };
    label[i] = n;
    stack.push(i);
    while (stack.length) {
      const p = stack.pop();
      const x = p % W;
      const y = (p / W) | 0;
      c.area++;
      if (x < c.x0) c.x0 = x;
      if (x > c.x1) c.x1 = x;
      if (y < c.y0) c.y0 = y;
      if (y > c.y1) c.y1 = y;
      for (let dy = -1; dy <= 1; dy++)
        for (let dx = -1; dx <= 1; dx++) {
          const nx = x + dx;
          const ny = y + dy;
          if (nx < 0 || ny < 0 || nx >= W || ny >= H) continue;
          const q = ny * W + nx;
          if (ink[q] && !label[q]) {
            label[q] = n;
            stack.push(q);
          }
        }
    }
    comps.push(c);
  }
}

// ── 3. Asignación de capas ───────────────────────────────────────────────────
// Bandas medidas sobre el PNG (filas con tinta):
//   llamas  64–240 (componente propio, por encima del pan)
//   burger  191–388 (pan, carne, lechuga y la banda de la frente)
//   gafas   389–470 (componente propio, el más ancho de esa franja)
//   cara    resto por encima de 660
//   texto   680–936 (KANALLA + BURGER)
const flames = comps.filter((c) => c.y1 <= 245 && c.y0 < 191);
const glasses = comps
  .filter((c) => c.y0 >= 385 && c.y1 <= 475 && c.x1 - c.x0 > 200)
  .sort((a, b) => b.area - a.area)
  .slice(0, 1);
const layerOf = new Map();
for (const c of comps) {
  let layer;
  if (flames.includes(c)) layer = 'flames';
  else if (glasses.includes(c)) layer = 'glasses';
  else if (c.y0 >= 670) layer = 'text';
  else if (c.y0 >= 185 && c.y1 <= 390 && c.x0 >= 340 && c.x1 <= 680) layer = 'burger';
  else layer = 'face';
  layerOf.set(c.id, layer);
}
const LAYERS = ['flames', 'burger', 'glasses', 'face', 'text'];

// Píxeles de antialias (alfa < 128) → capa del vecino con tinta más cercano (r ≤ 3)
const pixLayer = new Int8Array(W * H).fill(-1);
for (let i = 0; i < W * H; i++) if (label[i]) pixLayer[i] = LAYERS.indexOf(layerOf.get(label[i]));
for (let y = 0; y < H; y++)
  for (let x = 0; x < W; x++) {
    const i = y * W + x;
    if (pixLayer[i] !== -1 || alpha[i] === 0) continue;
    let best = -1;
    let bestD = 99;
    for (let dy = -3; dy <= 3; dy++)
      for (let dx = -3; dx <= 3; dx++) {
        const nx = x + dx;
        const ny = y + dy;
        if (nx < 0 || ny < 0 || nx >= W || ny >= H) continue;
        const q = ny * W + nx;
        if (!label[q]) continue;
        const d = dx * dx + dy * dy;
        if (d < bestD) {
          bestD = d;
          best = pixLayer[q];
        }
      }
    pixLayer[i] = best;
  }

// ── 4. Trazado por capa ──────────────────────────────────────────────────────
const tracer = (buf) =>
  new Promise((res, rej) => {
    const t = new potrace.Potrace({
      threshold: 128,
      blackOnWhite: true,
      turdSize: 3,
      alphaMax: 1,
      optCurve: true,
      optTolerance: 0.2,
      turnPolicy: potrace.Potrace.TURNPOLICY_MINORITY,
    });
    t.loadImage(buf, (err) => (err ? rej(err) : res(t)));
  });

// Redondea coordenadas a 1 decimal (a escala 2× → 0,05 px reales) y escala a 1×
const compact = (d) =>
  d
    .replace(/-?\d+(\.\d+)?/g, (m) => String(Math.round((parseFloat(m) / UP) * 10) / 10))
    .replace(/\s+/g, ' ')
    .replace(/ ?([MCLZ]) ?/g, '$1')
    .replace(/, /g, ',')
    .trim();

const paths = {};
const bboxes = {};
for (let li = 0; li < LAYERS.length; li++) {
  const name = LAYERS[li];
  const gray = Buffer.alloc(W * H, 255);
  let x0 = W, x1 = 0, y0 = H, y1 = 0;
  for (let i = 0; i < W * H; i++) {
    if (pixLayer[i] !== li) continue;
    gray[i] = 255 - alpha[i]; // tinta = negro
    const x = i % W;
    const y = (i / W) | 0;
    if (x < x0) x0 = x;
    if (x > x1) x1 = x;
    if (y < y0) y0 = y;
    if (y > y1) y1 = y;
  }
  bboxes[name] = { x: x0, y: y0, w: x1 - x0 + 1, h: y1 - y0 + 1 };
  const up = await sharp(gray, { raw: { width: W, height: H, channels: 1 } })
    .resize(W * UP, H * UP, { kernel: 'lanczos3' })
    .png()
    .toBuffer();
  const t = await tracer(up);
  const tag = t.getPathTag();
  const d = /d="([^"]+)"/.exec(tag)[1];
  paths[name] = compact(d);
  console.log(`${name.padEnd(8)} ${String(paths[name].length).padStart(7)} chars  bbox ${JSON.stringify(bboxes[name])}`);
}

// ── 5. Salidas ───────────────────────────────────────────────────────────────
// 5a. SVG completo (entregable: vector fiel de forma, sin la textura de impresión)
const svgFull = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" fill="${INK}" fill-rule="evenodd">${LAYERS.map(
  (l) => `<path d="${paths[l]}"/>`,
).join('')}</svg>\n`;
writeFileSync(OUT_SVG, svgFull);

// 5b. Capas raster: la tinta ORIGINAL del PNG (con su textura), recortada por capa.
//     Son las que se ven en la web; el vector solo se usa para el trazo de entrada.
const { data: rgba } = await sharp(SRC).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
const ART = { x: 140, y: 60, w: 748, h: 882 }; // lienzo útil (bbox de tinta + 4 px)
const LAYER_SCALE = 0.3; // 2,5× nítido para el logo de la cabecera y el pie (≤ 105 px CSS de alto)
const LOGO_GRANDE = [420, 748]; // anchos del logo completo para el hero (748 = tamaño original)
const LAYER_DIR = resolve(root, 'public/images/logo-capas');
mkdirSync(LAYER_DIR, { recursive: true });
const layersMeta = {};
for (let li = 0; li < LAYERS.length; li++) {
  const name = LAYERS[li];
  const b = bboxes[name];
  const pad = 3;
  const box = {
    x: Math.max(ART.x, b.x - pad),
    y: Math.max(ART.y, b.y - pad),
    w: Math.min(ART.x + ART.w, b.x + b.w + pad) - Math.max(ART.x, b.x - pad),
    h: Math.min(ART.y + ART.h, b.y + b.h + pad) - Math.max(ART.y, b.y - pad),
  };
  const buf = Buffer.alloc(W * H * 4);
  for (let i = 0; i < W * H; i++) {
    // RGB = tinta plana en todo el lienzo (el original ya es un único color #492310);
    // así toda la información, textura incluida, vive en el canal alfa y comprime mucho mejor.
    buf[i * 4] = 0x49;
    buf[i * 4 + 1] = 0x23;
    buf[i * 4 + 2] = 0x10;
    buf[i * 4 + 3] = pixLayer[i] === li ? rgba[i * 4 + 3] : 0;
  }
  const layerImg = sharp(buf, { raw: { width: W, height: H, channels: 4 } })
    .extract({ left: box.x, top: box.y, width: box.w, height: box.h })
    .resize(Math.round(box.w * LAYER_SCALE));
  // AVIF (principal, ~35 % menos) + WebP de respaldo. Ambos conservan el grano del original.
  await layerImg.clone().avif({ quality: 60, effort: 6 }).toFile(resolve(LAYER_DIR, `${name}.avif`));
  await layerImg.clone().webp({ quality: 85, alphaQuality: 80, effort: 6 }).toFile(resolve(LAYER_DIR, `${name}.webp`));
  // Tamaños grandes para el logo del hero (hasta ~560 px CSS de ancho): <capa>-<ancho del logo>.{avif,webp}
  const grande = [];
  for (const logoW of LOGO_GRANDE) {
    const k = logoW / ART.w;
    const w = Math.round(box.w * k);
    const img = sharp(buf, { raw: { width: W, height: H, channels: 4 } })
      .extract({ left: box.x, top: box.y, width: box.w, height: box.h })
      .resize(w);
    await img.clone().avif({ quality: 55, effort: 6 }).toFile(resolve(LAYER_DIR, `${name}-${logoW}.avif`));
    await img.clone().webp({ quality: 82, alphaQuality: 80, effort: 6 }).toFile(resolve(LAYER_DIR, `${name}-${logoW}.webp`));
    grande.push({ logoW, w });
  }
  // posición relativa al lienzo útil, en %
  layersMeta[name] = {
    avif: `images/logo-capas/${name}.avif`,
    webp: `images/logo-capas/${name}.webp`,
    left: +(((box.x - ART.x) / ART.w) * 100).toFixed(3),
    top: +(((box.y - ART.y) / ART.h) * 100).toFixed(3),
    width: +((box.w / ART.w) * 100).toFixed(3),
    px: { w: Math.round(box.w * LAYER_SCALE), h: Math.round(box.h * LAYER_SCALE) },
    grande,
  };
}

// 5c. Contorno simplificado para la animación de trazo (sin motas pequeñas)
const strokeTracer = (buf) =>
  new Promise((res, rej) => {
    const t = new potrace.Potrace({
      threshold: 128,
      blackOnWhite: true,
      turdSize: 40,
      alphaMax: 1,
      optCurve: true,
      optTolerance: 0.6,
    });
    t.loadImage(buf, (err) => (err ? rej(err) : res(t)));
  });
const strokes = {};
for (let li = 0; li < LAYERS.length; li++) {
  const gray = Buffer.alloc(W * H, 255);
  for (let i = 0; i < W * H; i++) if (pixLayer[i] === li) gray[i] = 255 - alpha[i];
  const png = await sharp(gray, { raw: { width: W, height: H, channels: 1 } }).png().toBuffer();
  const t = await strokeTracer(png);
  const d = /d="([^"]+)"/.exec(t.getPathTag())[1];
  // a coordenadas del lienzo útil, enteros
  strokes[LAYERS[li]] = d
    .replace(/(-?\d+(?:\.\d+)?)[ ,](-?\d+(?:\.\d+)?)/g, (_, x, y) => `${Math.round(+x - ART.x)} ${Math.round(+y - ART.y)}`)
    .replace(/\s+/g, ' ')
    .replace(/ ?([MCLZ]) ?/g, '$1')
    .trim();
}

// 5d. Silueta de las llamas como máscara (botones «PIDE…»: la llama bajo el texto)
{
  const b = bboxes.flames;
  const flameD = paths.flames.replace(/(-?\d+(?:\.\d+)?) (-?\d+(?:\.\d+)?)/g, (_, x, y) =>
    `${Math.round((+x - b.x) * 10) / 10} ${Math.round((+y - b.y) * 10) / 10}`,
  );
  writeFileSync(
    resolve(LAYER_DIR, 'llamas-mask.svg'),
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${b.w} ${b.h}" preserveAspectRatio="none"><path fill="#000" fill-rule="evenodd" d="${flameD}"/></svg>\n`,
  );
}

mkdirSync(dirname(OUT_TS), { recursive: true });
writeFileSync(
  OUT_TS,
  `// AUTO-GENERADO por scripts/vectorize-logo.mjs — no editar a mano.\n` +
    `// Capas recortadas de public/images/logo-kanalla-burger-tinta.png y contorno trazado con potrace.\n` +
    `export const LOGO_ART = ${JSON.stringify(ART)} as const;\n` +
    `export const LOGO_LAYERS = ${JSON.stringify(layersMeta, null, 2)} as const;\n` +
    `export const LOGO_STROKES: Record<'${LAYERS.join("' | '")}', string> = ${JSON.stringify(strokes, null, 2)};\n`,
);
console.log('stroke chars', Object.fromEntries(Object.entries(strokes).map(([k, v]) => [k, v.length])));
console.log('layers', Object.fromEntries(Object.entries(layersMeta).map(([k, v]) => [k, v.px])));

// ── 6. Verificación: rasteriza el SVG y compáralo con el PNG ─────────────────
const raster = await sharp(Buffer.from(svgFull)).resize(W, H).ensureAlpha().extractChannel(3).raw().toBuffer();
let both = 0, onlyPng = 0, onlySvg = 0;
const perLayer = Object.fromEntries(LAYERS.map((l) => [l, { both: 0, onlyPng: 0, onlySvg: 0 }]));
const overlay = Buffer.alloc(W * H * 3);
for (let i = 0; i < W * H; i++) {
  const a = alpha[i] >= 128;
  const b = raster[i] >= 128;
  const L = pixLayer[i] >= 0 ? LAYERS[pixLayer[i]] : null;
  if (a && b) { both++; if (L) perLayer[L].both++; }
  else if (a) { onlyPng++; if (L) perLayer[L].onlyPng++; }
  else if (b) { onlySvg++; }
  // blanco = fondo, gris = coincide, rojo = solo en PNG (falta en SVG), azul = solo en SVG (sobra)
  const c = a && b ? [120, 120, 120] : a ? [230, 30, 30] : b ? [30, 80, 230] : [255, 255, 255];
  overlay.set(c, i * 3);
}
const iou = both / (both + onlyPng + onlySvg);
console.log(`\nIoU global ${(iou * 100).toFixed(2)}%  · faltan ${onlyPng}px · sobran ${onlySvg}px (de ${both + onlyPng} px de tinta)`);
for (const l of LAYERS) {
  const p = perLayer[l];
  console.log(`  ${l.padEnd(8)} faltan ${String(p.onlyPng).padStart(5)}px  (${((p.onlyPng / Math.max(1, p.both + p.onlyPng)) * 100).toFixed(2)}%)`);
}
mkdirSync(OUT_DIR, { recursive: true });
await sharp(overlay, { raw: { width: W, height: H, channels: 3 } }).png().toFile(resolve(OUT_DIR, 'logo-overlay.png'));
console.log(`\n→ ${OUT_TS}\n→ ${OUT_SVG}\n→ ${resolve(OUT_DIR, 'logo-overlay.png')}`);
