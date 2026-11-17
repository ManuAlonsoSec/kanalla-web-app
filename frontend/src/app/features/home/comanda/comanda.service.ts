import { DOCUMENT, Injectable, computed, effect, inject, signal } from '@angular/core';
import { CARTA, COMBO, LOCAL, PLATOS, centimos, euros, eurosCorto, minimoDe, type Plato } from '../../../../data/datos';

// ──────────────────────────────────────────────────────────────────────────────
// La comanda: lo que el cliente va apuntando con «+». Todo pasa en el navegador:
// sin backend, sin pago y sin tocar las reservas. Termina en un enlace de WhatsApp
// con el pedido ya escrito (o en una llamada).
//
// · Se guarda en localStorage (solo claves, cantidades y zona) y se vuelve a poner
//   precio con la carta actual al recuperarla: si la carta cambia, el ticket cambia.
// · Zona de reparto obligatoria: de ella sale el pedido mínimo (sobre los productos,
//   sin el envío). El envío es fijo y se suma al total.
// · Los extras (carne, huevo/bacon, aguacate, queso, pan sin gluten) van SIEMPRE con
//   su burger, nunca como línea suelta: «1 x La Ramona 2.0 (+ extra de queso)».
// · El mensaje de WhatsApp lo lee el asistente de pedidos (n8n), que crea el pedido en
//   el TPV. Reconoce un pedido de la web por el inicio exacto
//   «Hola Kanalla, quiero hacer un pedido a domicilio:» más al menos una línea «N x …»,
//   el combo por «COMBO SOFÁ» y el saludo sin comanda por el mismo texto sin dos
//   puntos. NO cambiar esos textos ni el formato sin cambiar también el asistente.
//
// Claves de línea (lo que se guarda):
//   plato                      tequenos
//   burger con extras          la-ramona-2-0~queso            (extras con «.», en orden de carta)
//   combo                      combo-sofa:la-clasica+la-puerca~queso   (burgers ordenadas)
// ──────────────────────────────────────────────────────────────────────────────

/** Una burger de una línea (la propia línea, o cada una de las del combo), con sus extras. */
export interface BurgerLinea {
  id: string;
  nombre: string;
  /** Suplemento dentro del combo (céntimos); 0 fuera del combo o sin suplemento. */
  suplemento: number;
  /** ids de extras, en el orden de la carta */
  extras: string[];
}

export interface Linea {
  /** Identificador estable mientras la línea exista (aunque cambien sus extras). */
  uid: number;
  /** Clave de la línea: ver arriba. */
  key: string;
  /** id del plato de la carta (sin extras); `combo-sofa` en el combo. */
  base: string;
  nombre: string;
  /** Precio unitario en céntimos, extras incluidos; null = a consultar (hamburguesa del mes). */
  precio: number | null;
  cantidad: number;
  /** Lo que se lee bajo el nombre en el ticket: los extras, o lo que lleva el combo. */
  detalle: string | null;
  combo: boolean;
  /** Burgers a las que se les pueden poner extras; vacío si la línea no los admite. */
  burgers: BurgerLinea[];
}

interface Guardada {
  key: string;
  cantidad: number;
}

const STORAGE_KEY = 'kanalla_comanda_v1';
const ZONA_KEY = 'kanalla_zona_v1';
/** Inicio exacto del mensaje con comanda: el asistente reconoce así los pedidos de la web. */
export const INICIO_PEDIDO = 'Hola Kanalla, quiero hacer un pedido a domicilio:';
/** Mensaje exacto sin comanda (talón «Pide directo» y ticket vacío): saludo desde la web. */
export const SALUDO = 'Hola Kanalla, quiero hacer un pedido a domicilio';
/** Envío fijo en todas las zonas (céntimos). */
export const ENVIO = centimos(LOCAL.gastosEnvio ?? '') ?? 0;
const WA_NUMERO = LOCAL.telefono.e164.replace('+', '');
const MAX_POR_LINEA = 20;

const HAMBURGUESAS: Plato[] = CARTA.find((s) => s.id === 'hamburguesas')?.platos ?? [];

/** Extras que van con una burger (carta.json: `conBurger`), en el orden de la carta. */
export const EXTRAS: Plato[] = CARTA.flatMap((s) => s.platos).filter((p) => p.conBurger);
const ES_EXTRA = new Set(EXTRAS.map((p) => p.id));

/** ¿Se le pueden poner extras a este plato? Solo a las hamburguesas. */
export function admiteExtras(id: string): boolean {
  return HAMBURGUESAS.some((p) => p.id === id);
}

/** Hamburguesas que se pueden elegir en el combo (con precio fijo y no excluidas). */
export const BURGERS_COMBO: Plato[] = HAMBURGUESAS.filter(
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

// ── Claves ────────────────────────────────────────────────────────────────────

/** Extras válidos, sin repetir y en el orden de la carta. */
function ordenarExtras(extras: string[]): string[] {
  return EXTRAS.map((p) => p.id).filter((id) => extras.includes(id));
}

/** `la-puerca` + [`queso`] → `la-puerca~queso` */
export function burgerKey(id: string, extras: string[] = []): string {
  const e = ordenarExtras(extras);
  return e.length ? `${id}~${e.join('.')}` : id;
}

/** `la-puerca~queso` → { id: 'la-puerca', extras: ['queso'] } */
function leerBurger(token: string): { id: string; extras: string[] } {
  const [id, resto] = token.split('~');
  return { id, extras: resto ? resto.split('.') : [] };
}

/**
 * Clave del combo. Acepta ids de burgers o burgers con extras (`la-puerca~queso`);
 * no depende del orden en que se elijan.
 */
export function comboKey(burgers: string[]): string {
  return `${COMBO.id}:${[...burgers].sort().join('+')}`;
}

// ── Textos ────────────────────────────────────────────────────────────────────

/** [«a», «b», «c»] → «a, b y c» */
function lista(textos: string[]): string {
  return textos.length > 1 ? `${textos.slice(0, -1).join(', ')} y ${textos[textos.length - 1]}` : (textos[0] ?? '');
}

/** «extra de queso y pan sin gluten»: los extras de una burger, en minúsculas. */
function extrasTexto(extras: string[]): string {
  return lista(extras.map((id) => (PLATOS.get(id)?.enTicket ?? PLATOS.get(id)?.nombre ?? id).toLowerCase()));
}

function precioExtras(extras: string[]): number {
  return extras.reduce((t, id) => t + (centimos(PLATOS.get(id)?.precio ?? '') ?? 0), 0);
}

/** Nombre de lo que incluye el combo, en minúsculas: «ración de patatas y tequeños». */
const INCLUYE_TEXTO = COMBO.incluye.map((id) => (PLATOS.get(id)?.nombre ?? id).toLowerCase()).join(' y ');

/** «La Clásica +1€ + La Puerca +1€ con extra de queso, ración de patatas y tequeños» */
function detalleCombo(burgers: BurgerLinea[]): string {
  const partes = burgers.map(
    (b) =>
      b.nombre +
      (b.suplemento ? ` +${eurosCorto(b.suplemento)}` : '') + // «+1€» solo junto a las que llevan suplemento
      (b.extras.length ? ` con ${extrasTexto(b.extras)}` : ''),
  );
  return `${partes.join(' + ')}, ${INCLUYE_TEXTO}`;
}

let siguienteUid = 1;

/** Línea nueva (cantidad 1) a partir de su clave, con los precios de la carta actual. */
function crearLinea(key: string): Linea | null {
  if (key.startsWith(COMBO.id + ':')) {
    const tokens = key.slice(COMBO.id.length + 1).split('+');
    const burgers: BurgerLinea[] = [];
    for (const token of tokens) {
      const { id, extras } = leerBurger(token);
      const plato = BURGERS_COMBO.find((p) => p.id === id);
      if (!plato || burgerKey(id, extras) !== token) return null; // burger que no entra, o extras no válidos
      burgers.push({ id, nombre: plato.nombre, suplemento: suplementoCombo(id), extras });
    }
    if (burgers.length !== COMBO.burgers || comboKey(tokens) !== key) return null;
    return {
      uid: siguienteUid++,
      key,
      base: COMBO.id,
      nombre: COMBO.nombre,
      precio: precioCombo(burgers.map((b) => b.id)) + burgers.reduce((t, b) => t + precioExtras(b.extras), 0),
      cantidad: 1,
      detalle: detalleCombo(burgers),
      combo: true,
      burgers,
    };
  }

  const { id, extras } = leerBurger(key);
  const plato = PLATOS.get(id);
  // Los extras no se apuntan sueltos, y solo las hamburguesas los admiten
  if (!plato || ES_EXTRA.has(id) || burgerKey(id, extras) !== key || (extras.length && !admiteExtras(id))) return null;
  const base = centimos(plato.precio);
  return {
    uid: siguienteUid++,
    key,
    base: id,
    nombre: plato.enTicket ?? plato.nombre,
    precio: base === null ? null : base + precioExtras(extras),
    cantidad: 1,
    detalle: extras.length ? `+ ${extrasTexto(extras)}` : null,
    combo: false,
    burgers: admiteExtras(id) ? [{ id, nombre: plato.nombre, suplemento: 0, extras }] : [],
  };
}

@Injectable({ providedIn: 'root' })
export class ComandaService {
  private readonly win = inject(DOCUMENT).defaultView;

  private readonly _lineas = signal<Linea[]>([]);
  readonly lineas = this._lineas.asReadonly();

  readonly unidades = computed(() => this._lineas().reduce((n, l) => n + l.cantidad, 0));
  /** Productos (extras incluidos), sin el envío. Sobre esto se calcula el pedido mínimo. */
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
  /** Cantidad apuntada por id de plato, con o sin extras (sin combos). */
  readonly porPlato = computed(() => {
    const mapa = new Map<string, number>();
    for (const l of this._lineas()) if (!l.combo) mapa.set(l.base, (mapa.get(l.base) ?? 0) + l.cantidad);
    return mapa;
  });
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
    if (!lineas.length) return SALUDO;
    const out = [INICIO_PEDIDO, ''];
    for (const l of lineas) {
      const nombre = l.combo ? l.nombre.toUpperCase() : l.nombre;
      // Combo: «(La Clásica +1€ + La Puerca +1€ con extra de queso, ración de…)».
      // Burger con extras: «(+ extra de queso)».
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

  /**
   * Recupera la comanda guardada. Se llama tras hidratar (el HTML prerenderizado va vacío).
   * Lo que ya no vale (platos retirados, extras sueltos de versiones anteriores) se descarta.
   */
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

  /**
   * Pone o quita un extra a una burger de una línea (`burger`: 0 en una burger suelta;
   * 0 o 1 en el combo). El extra vale para todas las unidades de la línea. Si al
   * cambiarlo la línea queda igual que otra que ya existe, se juntan.
   */
  alternarExtra(key: string, burger: number, extra: string): void {
    const linea = this._lineas().find((l) => l.key === key);
    const b = linea?.burgers[burger];
    if (!linea || !b || !ES_EXTRA.has(extra)) return;
    const pone = !b.extras.includes(extra);
    const tokens = linea.burgers.map((x, i) =>
      burgerKey(x.id, i !== burger ? x.extras : pone ? [...x.extras, extra] : x.extras.filter((e) => e !== extra)),
    );
    const nueva = crearLinea(linea.combo ? comboKey(tokens) : tokens[0]);
    if (!nueva) return;
    this._lineas.update((ls) => {
      const otra = ls.find((l) => l.key === nueva.key && l.uid !== linea.uid);
      if (otra) {
        // Ya había una línea igual: se suman las cantidades en ella
        return ls
          .filter((l) => l.uid !== linea.uid)
          .map((l) => (l.uid === otra.uid ? { ...l, cantidad: Math.min(MAX_POR_LINEA, l.cantidad + linea.cantidad) } : l));
      }
      return ls.map((l) => (l.uid === linea.uid ? { ...nueva, uid: linea.uid, cantidad: linea.cantidad } : l));
    });
    this.vaciada.set(null);
    const nombreExtra = PLATOS.get(extra)?.enTicket ?? PLATOS.get(extra)?.nombre ?? extra;
    this.anunciar(`${nombreExtra}: ${pone ? 'añadido a' : 'quitado de'} ${b.nombre}.`);
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
