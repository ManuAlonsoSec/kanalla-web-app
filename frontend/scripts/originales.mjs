// ──────────────────────────────────────────────────────────────────────────────
// originales.mjs — Dónde están los originales (fotos sin optimizar, carta impresa).
//
// Viven FUERA del repo: en public/ solo van las versiones optimizadas que la web usa.
// Por defecto, en ../kanalla-originales/ (junto a la carpeta del proyecto); se puede
// cambiar con la variable de entorno KANALLA_ORIGINALES.
// ──────────────────────────────────────────────────────────────────────────────
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { existsSync } from 'node:fs';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');

export const ORIGINALES = process.env.KANALLA_ORIGINALES ?? resolve(root, '../../kanalla-originales');

/** Ruta de un original; si falta, corta con un mensaje claro. */
export function original(nombre) {
  const ruta = resolve(ORIGINALES, nombre);
  if (!existsSync(ruta)) {
    console.error(`\nFalta el original «${nombre}» en ${ORIGINALES}\n(define KANALLA_ORIGINALES si los guardas en otra carpeta)\n`);
    process.exit(1);
  }
  return ruta;
}
