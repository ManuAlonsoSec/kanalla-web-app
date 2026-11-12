// ──────────────────────────────────────────────────────────────────────────────
// integrar-foto.mjs — Integra en el kraft una foto hecha sobre otro fondo.
//
//   swift scripts/vision-mask.swift public/images/DSC08550.jpg scripts/out/DSC08550-mask.png
//   node scripts/integrar-foto.mjs
//
// · Separa la burger del fondo con la máscara de Vision (macOS, en local).
// · Quita el reflejo verde de las plantas en los bordes (despill).
// · Retoque cálido y suave para igualar la luz de estudio de las otras fotos.
// · Fondo kraft con luz central, grano de papel y una sombra muy suave.
// No se genera ni se inventa nada de la comida. El original no se modifica.
// ──────────────────────────────────────────────────────────────────────────────
import sharp from 'sharp';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const SRC = resolve(root, 'public/images/DSC08550.jpg');
const MASK = resolve(root, 'scripts/out/DSC08550-mask.png');
const OUT = resolve(root, 'public/images/la-puerca-kraft.jpg');

const SCALE = 0.5; // master de 2400 px de ancho: de sobra para los 1200 px que se sirven
const meta = await sharp(SRC).metadata();
const w = Math.round(meta.width * SCALE);
const h = Math.round(meta.height * SCALE);
const PAD = Math.round(w * 0.04); // un poco de kraft a los lados
const W = w + PAD * 2;
const H = h;

// 1. Foto y máscara a la misma escala
const rgb = await sharp(SRC).resize(w, h).removeAlpha().raw().toBuffer();
const rawMask = await sharp(MASK).resize(w, h).extractChannel(0).raw().toBuffer();
// Ceñir el borde (erosión de ~3 px): el contorno del original arrastra la sombra
// oscura de las plantas y, sobre kraft, se leería como un perfilado.
const eroded = await sharp(rawMask, { raw: { width: w, height: h, channels: 1 } })
  .blur(3)
  .extractChannel(0)
  .raw()
  .toBuffer();
const tight = Buffer.alloc(w * h);
for (let i = 0; i < w * h; i++) {
  const a = Math.min(rawMask[i], eroded[i]) / 255;
  const t = Math.min(1, Math.max(0, (a - 0.72) / 0.24));
  tight[i] = Math.round(t * t * (3 - 2 * t) * 255);
}
const mask = await sharp(tight, { raw: { width: w, height: h, channels: 1 } })
  .blur(0.9)
  .extractChannel(0)
  .raw()
  .toBuffer();

// 2. Despill + retoque cálido, solo sobre la burger
const cut = Buffer.alloc(w * h * 4);
for (let i = 0; i < w * h; i++) {
  let r = rgb[i * 3], g = rgb[i * 3 + 1], b = rgb[i * 3 + 2];
  // En la comida (pan, queso, carne) el rojo domina al verde: el verde que sobra es reflejo de las plantas
  if (g > r) g = r;
  // calidez suave y algo menos de contraste (luz de estudio sobre kraft)
  r = Math.min(255, r * 0.95 + 14);
  g = Math.min(255, g * 0.95 + 9);
  b = Math.min(255, b * 0.9 + 2);
  cut[i * 4] = r; cut[i * 4 + 1] = g; cut[i * 4 + 2] = b; cut[i * 4 + 3] = mask[i];
}
const burger = await sharp(cut, { raw: { width: w, height: h, channels: 4 } }).png().toBuffer();

// 3. Fondo kraft: tono del centro del hero, luz central suave y grano de papel
const bg = Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">
  <defs>
    <radialGradient id="luz" cx=".5" cy=".46" r=".62">
      <stop offset="0" stop-color="#E4B990"/>
      <stop offset=".55" stop-color="#DCAD82"/>
      <stop offset="1" stop-color="#D3A378"/>
    </radialGradient>
  </defs>
  <rect width="100%" height="100%" fill="url(#luz)"/>
</svg>`);

// Grano de papel: motas de tinta dispersas (ruido propio; librsvg pinta feTurbulence a rayas)
const grainBuf = Buffer.alloc(W * H * 4);
let seed = 7;
const rand = () => ((seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296);
for (let i = 0; i < W * H; i++) {
  const n = rand();
  grainBuf[i * 4] = 0x49; grainBuf[i * 4 + 1] = 0x23; grainBuf[i * 4 + 2] = 0x10;
  grainBuf[i * 4 + 3] = n > 0.82 ? Math.round((n - 0.82) * 160) : 0;
}
const grain = await sharp(grainBuf, { raw: { width: W, height: H, channels: 4 } }).blur(0.6).png().toBuffer();

// 4. Sombra muy suave a partir de la máscara
const shadowAlpha = await sharp(mask, { raw: { width: w, height: h, channels: 1 } })
  .blur(Math.round(w * 0.025))
  .linear(0.28, 0)
  .extractChannel(0) // sharp devuelve RGB tras linear(): volver a un canal
  .raw()
  .toBuffer();
const shadow = Buffer.alloc(w * h * 4);
for (let i = 0; i < w * h; i++) {
  shadow[i * 4] = 0x5a; shadow[i * 4 + 1] = 0x30; shadow[i * 4 + 2] = 0x16; shadow[i * 4 + 3] = shadowAlpha[i];
}
const shadowPng = await sharp(shadow, { raw: { width: w, height: h, channels: 4 } }).png().toBuffer();

await sharp(bg)
  .composite([
    { input: grain, left: 0, top: 0 },
    { input: shadowPng, left: PAD + Math.round(w * 0.006), top: Math.round(h * 0.012) },
    { input: burger, left: PAD, top: 0 },
  ])
  .jpeg({ quality: 90, mozjpeg: true })
  .toFile(OUT);
console.log(`→ ${OUT} (${W}×${H})`);
