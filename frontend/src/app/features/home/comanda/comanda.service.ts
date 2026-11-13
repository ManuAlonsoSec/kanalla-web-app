import { DOCUMENT, Injectable, computed, effect, inject, signal } from '@angular/core';
import { CARTA, COMBO, LOCAL, PLATOS, centimos, euros, type Plato } from '../../../../data/datos';

// ──────────────────────────────────────────────────────────────────────────────
// La comanda: lo que el cliente va apuntando con «+». Todo pasa en el navegador:
// sin backend, sin pago y sin tocar las reservas. Termina en un enlace de WhatsApp
// con el pedido ya escrito (o en una llamada).
//
// · Se guarda en localStorage (solo ids y cantidades) y se vuelve a poner precio
//   con la carta actual al recuperarla: si la carta cambia, el ticket cambia con ella.
// · El mensaje de WhatsApp incluye «COMBO SOFÁ» cuando lo lleva, para poder medirlo.
// ──────────────────────────────────────────────────────────────────────────────

export interface Linea {
  /** id del plato, o `combo-sofa:la-kanalla+la-puerca` */
  key: string;
  nombre: string;
  /** Precio unitario en céntimos; null = a consultar (hamburguesa del mes). */
  precio: number | null;
  cantidad: number;
  /** Lo que lleva el combo */
  detalle: string | null;
  combo: boolean;
}

interface Guardada {
  key: string;
  cantidad: number;
}

const STORAGE_KEY = 'kanalla_comanda_v1';
const WA_NUMERO = LOCAL.telefono.e164.replace('+', '');
const MAX_POR_LINEA = 20;

/** Hamburguesas que se pueden elegir en el combo (con precio fijo y no excluidas). */
export const BURGERS_COMBO: Plato[] = (CARTA.find((s) => s.id === 'hamburguesas')?.platos ?? []).filter(
  (p) => !COMBO.excluidas.includes(p.id) && centimos(p.precio) !== null,
);

const PRECIO_COMBO = centimos(COMBO.precio) ?? 0;
const PRECIO_INCLUYE = COMBO.incluye.reduce((t, id) => t + (centimos(PLATOS.get(id)?.precio ?? '') ?? 0), 0);

/** Lo que te ahorras con esas dos burgers frente a pedirlo todo por separado (céntimos). */
export function ahorroCombo(ids: string[]): number {
  const sueltos = ids.reduce((t, id) => t + (centimos(PLATOS.get(id)?.precio ?? '') ?? 0), 0) + PRECIO_INCLUYE;
  return Math.max(0, sueltos - PRECIO_COMBO);
}

/** El máximo que se puede ahorrar (las más caras, se puede repetir burger). */
export const AHORRO_MAX = (() => {
  const max = Math.max(...BURGERS_COMBO.map((p) => centimos(p.precio) ?? 0));
  return ahorroCombo(Array(COMBO.burgers).fill(BURGERS_COMBO.find((p) => centimos(p.precio) === max)?.id ?? ''));
})();

export function comboKey(ids: string[]): string {
  return `${COMBO.id}:${[...ids].sort().join('+')}`;
}

/** Nombre de lo que incluye el combo, en minúsculas: «ración de patatas y tequeños». */
const INCLUYE_TEXTO = COMBO.incluye
  .map((id) => (PLATOS.get(id)?.nombre ?? id).toLowerCase())
  .join(' y ');

@Injectable({ providedIn: 'root' })
export class ComandaService {
  private readonly win = inject(DOCUMENT).defaultView;

  private readonly _lineas = signal<Linea[]>([]);
  readonly lineas = this._lineas.asReadonly();

  readonly unidades = computed(() => this._lineas().reduce((n, l) => n + l.cantidad, 0));
  readonly total = computed(() => this._lineas().reduce((t, l) => t + (l.precio ?? 0) * l.cantidad, 0));
  readonly aConsultar = computed(() => this._lineas().some((l) => l.precio === null));
  /** Cantidad apuntada por id de plato (sin combos). */
  readonly porPlato = computed(
    () => new Map(this._lineas().filter((l) => !l.combo).map((l) => [l.key, l.cantidad] as const)),
  );
  readonly combos = computed(() =>
    this._lineas()
      .filter((l) => l.combo)
      .reduce((n, l) => n + l.cantidad, 0),
  );

  /** Cada vez que se apunta algo: qué línea y un contador (para la animación del ticket). */
  readonly impresa = signal<{ key: string; n: number } | null>(null);
  /** Texto para la región aria-live de la página. */
  readonly anuncio = signal('');

  /** Copia de la comanda que se acaba de vaciar, para deshacer. */
  private readonly vaciada = signal<Linea[] | null>(null);
  readonly puedeDeshacer = computed(() => this.vaciada() !== null);

  readonly mensaje = computed(() => {
    const lineas = this._lineas();
    if (!lineas.length) return 'Hola Kanalla, quiero hacer un pedido a domicilio.';
    const out = ['Hola Kanalla, quiero hacer un pedido a domicilio:', ''];
    for (const l of lineas) {
      const nombre = l.combo ? l.nombre.toUpperCase() : l.nombre;
      const detalle = l.detalle ? ` (${l.detalle})` : '';
      const precio = l.precio === null ? 'precio a consultar' : euros(l.precio * l.cantidad);
      out.push(`${l.cantidad} x ${nombre}${detalle}: ${precio}`);
    }
    out.push('', `Total orientativo: ${euros(this.total())}${this.aConsultar() ? ' + lo que haya que consultar' : ''}`);
    out.push('', 'Dirección: ');
    return out.join('\n');
  });

  readonly whatsapp = computed(() => `https://wa.me/${WA_NUMERO}?text=${encodeURIComponent(this.mensaje())}`);

  private restaurada = false;
  private contador = 0;

  constructor() {
    // Guardar en el navegador (solo después de haber leído lo guardado)
    effect(() => {
      const datos: Guardada[] = this._lineas().map((l) => ({ key: l.key, cantidad: l.cantidad }));
      if (!this.restaurada) return;
      try {
        if (datos.length) this.win?.localStorage.setItem(STORAGE_KEY, JSON.stringify(datos));
        else this.win?.localStorage.removeItem(STORAGE_KEY);
      } catch {
        /* modo privado o almacenamiento bloqueado: la comanda vive solo en esta visita */
      }
    });
  }

  /** Recupera la comanda guardada. Se llama tras hidratar (el HTML prerenderizado va vacío). */
  restaurar(): void {
    if (this.restaurada) return;
    this.restaurada = true;
    let guardadas: unknown;
    try {
      guardadas = JSON.parse(this.win?.localStorage.getItem(STORAGE_KEY) ?? '[]');
    } catch {
      return;
    }
    if (!Array.isArray(guardadas)) return;
    const lineas: Linea[] = [];
    for (const g of guardadas as Partial<Guardada>[]) {
      const cantidad = Math.min(MAX_POR_LINEA, Math.floor(Number(g?.cantidad)));
      const linea = typeof g?.key === 'string' && cantidad > 0 ? crearLinea(g.key) : null;
      if (linea && !lineas.some((l) => l.key === linea.key)) lineas.push({ ...linea, cantidad });
    }
    this._lineas.set(lineas);
  }

  apuntar(key: string): void {
    const nueva = crearLinea(key);
    if (!nueva) return;
    let nombre = nueva.nombre;
    this._lineas.update((ls) => {
      const i = ls.findIndex((l) => l.key === key);
      if (i === -1) return [...ls, nueva];
      nombre = ls[i].nombre;
      return ls.map((l, j) => (j === i ? { ...l, cantidad: Math.min(MAX_POR_LINEA, l.cantidad + 1) } : l));
    });
    this.vaciada.set(null);
    this.impresa.set({ key, n: ++this.contador });
    this.anunciar(`Apuntado: ${nombre}.`);
  }

  quitar(key: string): void {
    const linea = this._lineas().find((l) => l.key === key);
    if (!linea) return;
    this._lineas.update((ls) =>
      ls.flatMap((l) => (l.key !== key ? [l] : l.cantidad > 1 ? [{ ...l, cantidad: l.cantidad - 1 }] : [])),
    );
    this.anunciar(`Quitado: ${linea.nombre}.`);
  }

  vaciar(): void {
    if (!this._lineas().length) return;
    this.vaciada.set(this._lineas());
    this._lineas.set([]);
    this.anuncio.set('Comanda vaciada. Puedes deshacerlo.');
  }

  deshacer(): void {
    const copia = this.vaciada();
    if (!copia) return;
    this._lineas.set(copia);
    this.vaciada.set(null);
    this.anunciar('Comanda recuperada.');
  }

  private anunciar(texto: string): void {
    const n = this.unidades();
    const resumen = n ? ` Llevas ${n} ${n === 1 ? 'cosa' : 'cosas'}, ${euros(this.total())} orientativos.` : ' La comanda está vacía.';
    this.anuncio.set(texto + resumen);
  }
}

/** Línea nueva (cantidad 1) a partir de su clave, con los precios de la carta actual. */
function crearLinea(key: string): Linea | null {
  if (key.startsWith(COMBO.id + ':')) {
    const ids = key.slice(COMBO.id.length + 1).split('+');
    const burgers = ids.map((id) => BURGERS_COMBO.find((p) => p.id === id));
    if (ids.length !== COMBO.burgers || burgers.some((b) => !b) || comboKey(ids) !== key) return null;
    return {
      key,
      nombre: COMBO.nombre,
      precio: PRECIO_COMBO,
      cantidad: 1,
      detalle: `${burgers.map((b) => b!.nombre).join(' + ')}, ${INCLUYE_TEXTO}`,
      combo: true,
    };
  }
  const plato = PLATOS.get(key);
  if (!plato) return null;
  return {
    key,
    nombre: plato.enTicket ?? plato.nombre,
    precio: centimos(plato.precio),
    cantidad: 1,
    detalle: null,
    combo: false,
  };
}
