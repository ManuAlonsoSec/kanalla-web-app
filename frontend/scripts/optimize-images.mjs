// ──────────────────────────────────────────────────────────────────────────────
// optimize-images.mjs — Versiones optimizadas de las fotos
//
//   node scripts/optimize-images.mjs
//
// · Fotos de platos → foto-<plato>-<ancho>.{avif,webp} + .jpg de respaldo
// · og-kanalla.jpg (1200×630) para Open Graph
// · favicon-48.png, favicon-32.png y apple-touch-icon.png a partir del logo
// · tabla-alergenos-kanalla.{avif,webp,jpg} a partir de la página 5 de la carta impresa
//
// Los originales se leen de fuera del repo (ver scripts/originales.mjs) y no se
// modifican. En public/ solo se escriben los derivados, con nombres sin espacios ni
// eñes para que las URLs sean limpias.
// ──────────────────────────────────────────────────────────────────────────────
import sharp from 'sharp';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { writeFileSync } from 'node:fs';
import { original } from './originales.mjs';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const IMG = resolve(root, 'public/images');
const PUB = resolve(root, 'public');

// original → slug del derivado
const FOTOS = {
  'laclasicaedit.png': 'la-clasica',
  'ramonaedit.png': 'la-ramona',
  'nachos.png': 'nachos',
  'tequeños edit.png': 'tequenos',
  'Edit-this-photo-Keep-the-chicken-finger.png': 'fingers-de-pollo',
  // DSC08550.jpg integrada en kraft con scripts/integrar-foto.mjs
  'la-puerca-kraft.jpg': 'la-puerca',
};
const WIDTHS = [480, 720, 912];
/** Fotos apaisadas que se ven más anchas en el hero */
const WIDTHS_ANCHAS = [480, 720, 960, 1200];

const manifest = {};
for (const [file, slug] of Object.entries(FOTOS)) {
  const src = sharp(original(file));
  const { width, height } = await src.metadata();
  const base = width / height > 1.2 ? WIDTHS_ANCHAS : WIDTHS;
  const widths = base.map((w) => Math.min(w, width)).filter((w, i, a) => a.indexOf(w) === i);
  for (const w of widths) {
    const r = src.clone().resize(w);
    await r.clone().avif({ quality: 55, effort: 6 }).toFile(resolve(IMG, `foto-${slug}-${w}.avif`));
    await r.clone().webp({ quality: 78, effort: 6 }).toFile(resolve(IMG, `foto-${slug}-${w}.webp`));
  }
  await src.clone().resize(720).jpeg({ quality: 80, mozjpeg: true }).toFile(resolve(IMG, `foto-${slug}-720.jpg`));
  manifest[slug] = { original: file, width, height, widths };
  console.log(`foto-${slug}: ${widths.join(', ')} px`);
}
writeFileSync(
  resolve(root, 'src/data/fotos.generated.json'),
  JSON.stringify(manifest, null, 2) + '\n',
);

// ── Open Graph 1200×630: kraft + logo + La Clásica ──────────────────────────
{
  const W = 1200, H = 630;
  const bg = Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}"><defs><linearGradient id="g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#CF9E76"/><stop offset=".5" stop-color="#DDAC81"/><stop offset="1" stop-color="#ECC9A3"/></linearGradient></defs><rect width="100%" height="100%" fill="url(#g)"/></svg>`,
  );
  const photoH = 630;
  const photoW = Math.round((912 / 1152) * photoH);
  const photo = await sharp(original('laclasicaedit.png')).resize(photoW, photoH).png().toBuffer();
  // borde difuminado para que el kraft de la foto se funda con el fondo
  const mask = Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${photoW}" height="${photoH}"><defs><radialGradient id="m" cx=".5" cy=".55" r=".55"><stop offset=".62" stop-color="#fff"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></radialGradient></defs><rect width="100%" height="100%" fill="url(#m)"/></svg>`,
  );
  const feathered = await sharp(photo).composite([{ input: mask, blend: 'dest-in' }]).png().toBuffer();
  const logo = await sharp(resolve(IMG, 'logo-kanalla-burger-tinta.png'))
    .extract({ left: 140, top: 60, width: 748, height: 882 })
    .resize({ height: 500 })
    .png()
    .toBuffer();
  const logoMeta = await sharp(logo).metadata();
  await sharp(bg)
    .composite([
      { input: logo, left: Math.round(300 - logoMeta.width / 2), top: Math.round((H - 500) / 2) },
      { input: feathered, left: W - photoW - 40, top: 0 },
    ])
    .jpeg({ quality: 84, mozjpeg: true })
    .toFile(resolve(IMG, 'og-kanalla.jpg'));
  console.log('og-kanalla.jpg 1200×630');
}

// ── Favicons: la cabeza del logo (sin texto) sobre kraft ─────────────────────
{
  const head = await sharp(resolve(IMG, 'logo-kanalla-burger-tinta.png'))
    .extract({ left: 292, top: 60, width: 440, height: 596 })
    .png()
    .toBuffer();
  const icon = async (size, pad) => {
    const inner = Math.round(size * (1 - pad * 2));
    const h = await sharp(head).resize({ height: inner, width: inner, fit: 'inside' }).png().toBuffer();
    return sharp({ create: { width: size, height: size, channels: 4, background: '#DDAC81' } })
      .composite([{ input: h, gravity: 'center' }])
      .png();
  };
  await (await icon(32, 0.04)).toFile(resolve(PUB, 'favicon-32.png'));
  await (await icon(48, 0.04)).toFile(resolve(PUB, 'favicon-48.png'));
  await (await icon(180, 0.1)).toFile(resolve(PUB, 'apple-touch-icon.png'));
  console.log('favicon-32.png, favicon-48.png, apple-touch-icon.png');
}

// ── Tabla de alérgenos original (página 5 de la carta impresa) ───────────────
// La web muestra la tabla en HTML; esto es la imagen que se puede descargar.
// Mismo tamaño que el original (texto pequeño: no se reduce) y sin submuestreo de
// color en el JPG para que las letras no se emborronen.
{
  const src = sharp(original('kanalla_carta_05_alergenos.jpg'));
  const base = resolve(IMG, 'tabla-alergenos-kanalla');
  await src.clone().avif({ quality: 50, effort: 6, chromaSubsampling: '4:4:4' }).toFile(`${base}.avif`);
  await src.clone().webp({ quality: 74, effort: 6 }).toFile(`${base}.webp`);
  await src.clone().jpeg({ quality: 68, mozjpeg: true, chromaSubsampling: '4:4:4' }).toFile(`${base}.jpg`);
  console.log('tabla-alergenos-kanalla.{avif,webp,jpg}');
}
