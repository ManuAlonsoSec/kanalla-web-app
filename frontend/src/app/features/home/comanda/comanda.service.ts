import { DOCUMENT, Injectable, computed, effect, inject, signal } from '@angular/core';
import { CARTA, COMBO, LOCAL, PLATOS, centimos, euros, eurosCorto, minimoDe, type Plato } from '../../../../data/datos';

// ──────────────────────────────────────────────────────────────────────────────
// La comanda: lo que el cliente va apuntando con «+». Todo pasa en el navegador:
// sin backend, sin pago y sin tocar las reservas. Termina en un enlace de WhatsApp
// con el pedido ya escrito (o en una llamada).
//
// · Se guarda en localStorage (solo ids, cantidades y zona) y se vuelve a poner precio
//   con la carta actual al recuperarla: si la carta cambia, el ticket cambia con ella.
// · Zona de reparto obligatoria: de ella sale el pedido mínimo (sobre los productos,
//   sin el envío). El envío es fijo y se suma al total.
// · El mensaje de WhatsApp lo lee el asistente de pedidos (n8n), que crea el pedido en
//   el TPV. Reconoce los pedidos de la web por el inicio exacto
//   «Hola Kanalla, quiero hacer un pedido a domicilio:» y el combo por «COMBO SOFÁ».
//   NO cambiar ese formato sin cambiar también el asistente.
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
const ZONA_KEY = 'kanalla_zona_v1';
/** Inicio exacto del mensaje: el asistente lo usa para reconocer los pedidos de la web. */
export const INICIO_PEDIDO = 'Hola Kanalla, quiero hacer un pedido a domicilio:';
/** Envío fijo en todas las zonas (céntimos). */
export const ENVIO = centimos(LOCAL.gastosEnvio ?? '') ?? 0;
const WA_NUMERO = LOCAL.telefono.e164.replace('+', '');
const MAX_POR_LINEA = 20;

/** Hamburguesas que se pueden elegir en el combo (con precio fijo y no excluidas). */
export const BURGERS_COMBO: Plato[] = (CARTA.find((s) => s.id === 'hamburguesas')?.platos ?? []).filter(
  (p) => !COMBO.excluidas.includes(p.id) && centimos(p.precio) !== null,
);

const PRECIO_COMBO = centimos(COMBO.precio) ?? 0;
const PRECIO_INCLUYE = COMBO.incluye.reduce((t, id) => t + (centimos(PLATOS.get(id)?.precio ?? '') ?? 0), 0);

/** Suplemento (céntimos) que suma una burger al precio base del combo; 0 si no tiene. */
export function suplementoCombo(id: string): number {
  return centimos(COMBO.suplementos?.[id] ?? '') ?? 0;
}

/** Precio del combo con esas burgers: el base más el suplemento de cada una (céntimos). */
export function precioCombo(ids: string[]): number {
  return PRECIO_COMBO + ids.reduce((t, id) => t + suplementoCombo(id), 0);
}

/**
 * Lo que te ahorras con esas burgers frente a pedirlo todo por separado (céntimos):
 * precio de carta de las burgers + lo que incluye el combo − precio del combo.
 */
export function ahorroCombo(ids: string[]): number {
  const sueltos = ids.reduce((t, id) => t + (centimos(PLATOS.get(id)?.precio ?? '') ?? 0), 0) + PRECIO_INCLUYE;
  return Math.max(0, sueltos - precioCombo(ids));
}

/** Todas las combinaciones posibles de burgers del combo (se puede repetir). */
function combinaciones(n: number): string[][] {
  if (n === 0) return [[]];
  return combinaciones(n - 1).flatMap((c) => BURGERS_COMBO.map((p) => [...c, p.id]));
}

/** El máximo que se puede ahorrar con las burgers permitidas. */
export const AHORRO_MAX = Math.max(0, ...combinaciones(COMBO.burgers).map(ahorroCombo));

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
  /** Productos, sin el envío. Sobre esto se calcula el pedido mínimo. */
  readonly subtotal = computed(() => this._lineas().reduce((t, l) => t + (l.precio ?? 0) * l.cantidad, 0));
  /** Envío: fijo, en cuanto hay algo apuntado. */
  readonly envio = computed(() => (this._lineas().length ? ENVIO : 0));
  /** Total orientativo: productos + envío. */
  readonly total = computed(() => this.subtotal() + this.envio());

  /** Zona de reparto elegida (obligatoria para mandar el pedido). */
  private readonly _zona = signal<string | null>(null);
  readonly zona = this._zona.asReadonly();
  /** Pedido mínimo de la zona elegida (céntimos); 0 sin zona. */
  readonly minimo = computed(() => (this._zona() ? minimoDe(this._zona()!) : 0));
  /** Lo que falta para llegar al mínimo de la zona (céntimos). */
  readonly falta = computed(() => Math.max(0, this.minimo() - this.subtotal()));
  /** Se puede mandar: hay algo apuntado, hay zona y llega al mínimo. */
  readonly puedeEnviar = computed(() => this._lineas().length > 0 && this._zona() !== null && this.falta() === 0);
  /** Por qué no se puede mandar todavía (texto visible junto al botón), o null. */
  readonly aviso = computed(() => {
    if (!this._lineas().length) return null;
    if (!this._zona()) return 'Elige tu zona de reparto para mandar el pedido.';
    if (this.falta() > 0) return `Te faltan ${euros(this.falta()).replace('€', ' €')} para el mínimo de ${this._zona()}`;
    return null;
  });
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
    const out = [INICIO_PEDIDO, ''];
    for (const l of lineas) {
      const nombre = l.combo ? l.nombre.toUpperCase() : l.nombre;
      const detalle = l.detalle ? ` (${l.detalle})` : '';
      const precio = l.precio === null ? 'precio a consultar' : euros(l.precio * l.cantidad);
      out.push(`${l.cantidad} x ${nombre}${detalle}: ${precio}`);
    }
    out.push('');
    if (this._zona()) out.push(`Zona: ${this._zona()}`);
    if (this.envio()) out.push(`Envío: ${euros(this.envio())}`);
    out.push(`Total orientativo: ${euros(this.total())}${this.aConsultar() ? ' + lo que haya que consultar' : ''}`);
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
    effect(() => {
      const zona = this._zona();
      if (!this.restaurada) return;
      try {
        if (zona) this.win?.localStorage.setItem(ZONA_KEY, zona);
        else this.win?.localStorage.removeItem(ZONA_KEY);
      } catch {
        /* igual que arriba */
      }
    });
  }

  /** Elige la zona de reparto (o la quita con null). Solo acepta zonas de reparto reales. */
  elegirZona(zona: string | null): void {
    const valida = zona && LOCAL.zonasReparto.includes(zona) ? zona : null;
    this._zona.set(valida);
    if (!valida) return;
    const aviso = this.aviso();
    this.anuncio.set(aviso ? `Zona: ${valida}. ${aviso}.` : `Zona: ${valida}. Ya puedes mandar el pedido.`);
  }

  /** Recupera la comanda guardada. Se llama tras hidratar (el HTML prerenderizado va vacío). */
  restaurar(): void {
    if (this.restaurada) return;
    this.restaurada = true;
    let guardadas: unknown;
    try {
      const zona = this.win?.localStorage.getItem(ZONA_KEY);
      if (zona && LOCAL.zonasReparto.includes(zona)) this._zona.set(zona);
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
    const resumen = n
      ? ` Llevas ${n} ${n === 1 ? 'cosa' : 'cosas'}, ${euros(this.total())} orientativos con el envío.`
      : ' La comanda está vacía.';
    const aviso = this._zona() && this.falta() > 0 ? ` ${this.aviso()}.` : '';
    this.anuncio.set(texto + resumen + aviso);
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
      precio: precioCombo(ids),
      cantidad: 1,
      // «La Clásica +1€ + La Puerca +1€, ración de patatas y tequeños»: el «+1€» solo
      // junto a las burgers con suplemento
      detalle: `${burgers.map((b) => b!.nombre + (suplementoCombo(b!.id) ? ` +${eurosCorto(suplementoCombo(b!.id))}` : '')).join(' + ')}, ${INCLUYE_TEXTO}`,
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
