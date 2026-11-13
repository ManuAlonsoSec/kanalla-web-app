// ──────────────────────────────────────────────────────────────────────────────
// Datos de la web, tipados. Los textos se editan en los JSON de esta carpeta:
//   carta.json      → platos, precios y novedades
//   local.json      → teléfono, WhatsApp, dirección, horario, zonas de reparto
//   alergenos.json  → tabla de alérgenos
// ──────────────────────────────────────────────────────────────────────────────
import cartaJson from './carta.json';
import localJson from './local.json';
import alergenosJson from './alergenos.json';
import fotosJson from './fotos.generated.json';

export interface Plato {
  /** Identificador estable del plato (comanda y WhatsApp). */
  id: string;
  nombre: string;
  precio: string;
  descripcion: string | null;
  nuevo: string | null;
  /** Nombre en la comanda y en el WhatsApp cuando no basta el de la carta (extras). */
  enTicket?: string;
  /** Filas de alergenos.json, 'consulta' (fila "Consulta al personal") o 'nota' (cubierto por la nota). */
  alergenos: string[] | 'consulta' | 'nota';
}

export interface SeccionCarta {
  id: string;
  titulo: string;
  fotos: FotoSlug[];
  platos: Plato[];
  nota: string | null;
  notaExtra: string | null;
}

export interface Combo {
  id: string;
  nombre: string;
  precio: string;
  burgers: number;
  /** ids de platos que van siempre en el combo */
  incluye: string[];
  /** ids de hamburguesas que no se pueden elegir */
  excluidas: string[];
}

export interface FilaAlergenos {
  plato: string;
  sinGluten: string;
  contiene: string[];
  trazas: string[];
}

export const CARTA = cartaJson.secciones as SeccionCarta[];
export const COMBO = cartaJson.combo as Combo;
/** Pedido mínimo de un grupo de zonas de reparto. */
export interface PedidoMinimo {
  zonas: string[];
  importe: string;
}

export const LOCAL = localJson as Omit<typeof localJson, 'pedidoMinimo' | 'gastosEnvio'> & {
  pedidoMinimo: PedidoMinimo[] | null;
  gastosEnvio: string | null;
};

/** Todos los platos de la carta por id. */
export const PLATOS: ReadonlyMap<string, Plato> = new Map(CARTA.flatMap((s) => s.platos.map((p) => [p.id, p] as const)));

/** «13,50€» → 1350 céntimos. «+1€» → 100. «Consultar» → null. */
export function centimos(precio: string): number | null {
  const m = /(\d+)(?:,(\d{1,2}))?\s*€/.exec(precio);
  if (!m) return null;
  return Number(m[1]) * 100 + Number((m[2] ?? '0').padEnd(2, '0'));
}

/** 1350 → «13,50€». */
export function euros(cents: number): string {
  const e = Math.floor(cents / 100);
  const c = String(cents % 100).padStart(2, '0');
  return `${e},${c}€`;
}
export const ALERGENOS = alergenosJson as {
  fuente: string;
  leyenda: { X: string; T: string; sinGluten: Record<string, string> };
  alergenos: string[];
  etiquetas: Record<string, string>;
  secciones: { seccion: string; platos: FilaAlergenos[] }[];
  nota: string;
};

// ── Fotos ────────────────────────────────────────────────────────────────────
export type FotoSlug = 'la-clasica' | 'la-puerca' | 'la-ramona' | 'nachos' | 'tequenos' | 'fingers-de-pollo';

export interface Foto {
  slug: FotoSlug;
  alt: string;
  /** Plato que aparece, para el pie de foto */
  plato: string;
  width: number;
  height: number;
  widths: number[];
}

const ALT: Record<FotoSlug, { alt: string; plato: string }> = {
  'la-clasica': {
    plato: 'La Clásica',
    alt: 'La Clásica: doble disco de vaca smash con cheddar fundido, bacon, pepinillo, cebolla y salsa de la casa en pan brioche, sobre papel kraft',
  },
  'la-puerca': {
    plato: 'La Puerca',
    alt: 'La Puerca de cerca: burger de vaca con cheddar y edam fundidos, mermelada de bacon casera con cebolla crujiente y brioche glaseado, sobre papel kraft',
  },
  'la-ramona': {
    plato: 'La Ramona 2.0',
    alt: 'La Ramona 2.0: pollo rebozado crujiente con bacon ahumado, queso fundido, lechuga y salsa en pan brioche, sobre papel kraft',
  },
  nachos: {
    plato: 'Nachos',
    alt: 'Nachos: totopos de maíz con pulled pork, salsa de queso, pico de gallo, guacamole, crema agria y jalapeños',
  },
  tequenos: {
    plato: 'Tequeños',
    alt: 'Tequeños dorados de masa enrollada rellenos de queso, con un cuenco de salsa roja para mojar',
  },
  'fingers-de-pollo': {
    plato: 'Fingers de pollo',
    alt: 'Fingers de pollo empanados y crujientes con un cuenco de salsa miel-mostaza espolvoreada con perejil',
  },
};

const fotos = fotosJson as Record<FotoSlug, { width: number; height: number; widths: number[] }>;

export const FOTOS: Record<FotoSlug, Foto> = Object.fromEntries(
  (Object.keys(ALT) as FotoSlug[]).map((slug) => [slug, { slug, ...ALT[slug], ...fotos[slug] }]),
) as Record<FotoSlug, Foto>;

/** `srcset` de una foto para un formato (`avif` | `webp`). */
export function fotoSrcset(f: Foto, fmt: 'avif' | 'webp'): string {
  return f.widths.map((w) => `/images/foto-${f.slug}-${w}.${fmt} ${w}w`).join(', ');
}

/** `srcset` del recorte a tijera (alfa) de una foto: scripts/recortar-fotos.mjs. */
export function recorteSrcset(f: Foto, fmt: 'avif' | 'webp'): string {
  return f.widths.map((w) => `/images/recorte-${f.slug}-${w}.${fmt} ${w}w`).join(', ');
}

/** Respaldo del recorte (WebP con alfa). */
export function recorteFallback(f: Foto): string {
  return `/images/recorte-${f.slug}-720.webp`;
}

/** JPG de respaldo (navegadores sin AVIF ni WebP). */
export function fotoFallback(f: Foto): string {
  return `/images/foto-${f.slug}-720.jpg`;
}
