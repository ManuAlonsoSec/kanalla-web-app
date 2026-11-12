// ──────────────────────────────────────────────────────────────────────────────
// recortar-fotos.mjs — Fotos «recortadas a tijera», como en un fanzine.
//
//   node scripts/recortar-fotos.mjs
//
// El corte de papel va dentro de la imagen (canal alfa), no en un clip-path de CSS:
// recorte-<plato>-<ancho>.{avif,webp}. El borde es el del papel cortado, no el
// contorno de la comida (eso no se aproxima con polígonos).
// Parte de los mismos originales que optimize-images.mjs (fuera del repo: ver
// scripts/originales.mjs), que NO se tocan.
// ──────────────────────────────────────────────────────────────────────────────
import sharp from 'sharp';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { readFileSync } from 'node:fs';
import { original } from './originales.mjs';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const IMG = resolve(root, 'public/images');
const fotos = JSON.parse(readFileSync(resolve(root, 'src/data/fotos.generated.json'), 'utf8'));

// Cortes de tijera (en % del ancho y alto): cada foto con el suyo
const TIJERA = {
  ancha: [
    [1.5, 4], [22, 1.2], [48, 3], [71, 0.6], [98.5, 2.4], [97.6, 30], [99.4, 61],
    [97.8, 97], [70, 99.2], [43, 96.8], [18, 99.4], [0.8, 96.5], [2.2, 63], [0.4, 31],
  ],
  a: [
    [2, 1.5], [35, 0.4], [68, 1.8], [98.4, 0.6], [97.4, 34], [99.4, 70],
    [97.9, 98.6], [62, 99.6], [27, 98.2], [0.6, 99.4], [2.1, 66], [0.4, 33],
  ],
  b: [
    [0.8, 2.6], [31, 0.5], [64, 2.2], [99.2, 1.2], [98.1, 29], [99.6, 63],
    [98.6, 99.1], [66, 97.9], [33, 99.5], [1.4, 98.2], [0.3, 64], [1.9, 30],
  ],
};

const RECORTES = { 'la-puerca': 'ancha', 'la-clasica': 'a', 'la-ramona': 'b', nachos: 'b', tequenos: 'a' };

for (const [slug, corte] of Object.entries(RECORTES)) {
  const f = fotos[slug];
  const src = original(f.original);
  for (const w of f.widths) {
    const h = Math.round((w * f.height) / f.width);
    const puntos = TIJERA[corte].map(([x, y]) => `${((x / 100) * w).toFixed(1)},${((y / 100) * h).toFixed(1)}`).join(' ');
    const mascara = Buffer.from(
      `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}"><polygon points="${puntos}" fill="#fff"/></svg>`,
    );
    const recortada = await sharp(src)
      .resize(w, h)
      .ensureAlpha()
      .composite([{ input: mascara, blend: 'dest-in' }])
      .png()
      .toBuffer();
    await sharp(recortada).avif({ quality: 55, effort: 6 }).toFile(resolve(IMG, `recorte-${slug}-${w}.avif`));
    await sharp(recortada).webp({ quality: 78, alphaQuality: 90, effort: 6 }).toFile(resolve(IMG, `recorte-${slug}-${w}.webp`));
  }
  console.log(`recorte-${slug}: ${f.widths.join(', ')} px`);
}
