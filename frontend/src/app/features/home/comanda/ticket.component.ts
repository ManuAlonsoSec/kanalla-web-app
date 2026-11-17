import {
  ChangeDetectionStrategy,
  Component,
  DOCUMENT,
  ElementRef,
  ViewEncapsulation,
  afterRenderEffect,
  computed,
  inject,
  input,
  signal,
  viewChild,
} from '@angular/core';
import { LOCAL, euros, eurosCorto, minimoDe } from '../../../../data/datos';
import { prefersReducedMotion } from '../../../core/motion';
import { ComandaService, ENVIO, EXTRAS, type Linea } from './comanda.service';

/**
 * El ticket de la comanda: tira de papel kraft que sale de una ranura.
 * Es el gesto de firma de la web (aparece tres veces: talón del hero, precio del
 * combo y este ticket). Mismo componente en el lateral de escritorio y en la hoja
 * inferior del móvil (`variante`), con ids distintos.
 *
 * Movimiento (emil-design-eng): al apuntar algo, el papel baja una línea como si
 * lo empujara la impresora (220 ms, ease-out fuerte) y la línea nueva aparece
 * (150 ms). Es la respuesta a lo que has hecho, no decoración. Con «reducir
 * movimiento», nada.
 */
@Component({
  selector: 'app-ticket',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  host: { class: 'ticket', '[class.ticket--hoja]': "variante() === 'hoja'" },
  template: `
    <div class="ticket__ranura" aria-hidden="true"></div>
    <div class="ticket__papel" #papel>
      <h2 class="ticket__titulo" [id]="id('titulo')">Tu comanda</h2>
      <p class="ticket__local">Kanalla Skybar · Galapagar</p>

      @if (comanda.lineas().length) {
        <ul class="ticket__lineas" role="list">
          @for (l of comanda.lineas(); track l.uid) {
            <li class="ticket__linea" [attr.data-key]="l.key">
              <span class="ticket__nombre">
                <span class="sr-only">{{ l.cantidad }} × </span>{{ l.nombre }}
                @if (l.detalle) {
                  <span class="ticket__detalle">{{ l.detalle }}</span>
                }
              </span>
              <span class="ticket__precio">{{ l.precio === null ? 'Consultar' : euros(l.precio * l.cantidad) }}</span>
              <span class="ticket__ctrl">
                <button type="button" class="ticket__btn" (click)="comanda.quitar(l.key)">
                  <svg viewBox="0 0 16 16" aria-hidden="true" focusable="false"><path d="M3 8h10" /></svg>
                  <span class="sr-only">Quitar una: {{ l.nombre }}</span>
                </button>
                <span class="ticket__cant" aria-hidden="true">{{ l.cantidad }}</span>
                <button type="button" class="ticket__btn" (click)="comanda.apuntar(l.key)">
                  <svg viewBox="0 0 16 16" aria-hidden="true" focusable="false"><path d="M8 3v10M3 8h10" /></svg>
                  <span class="sr-only">Añadir otra: {{ l.nombre }}</span>
                </button>
              </span>
              @if (l.burgers.length) {
                <!-- Extras: van con su burger, nunca como línea suelta -->
                <div class="ticket__extras">
                  <button
                    type="button"
                    class="ticket__extras-btn"
                    [attr.aria-expanded]="abierta(l.uid)"
                    [attr.aria-controls]="id('extras-' + l.uid)"
                    (click)="alternarPanel(l.uid)"
                  >
                    <svg viewBox="0 0 12 8" aria-hidden="true" focusable="false"><path d="M1 1l5 5 5-5" /></svg>
                    <span>{{ conExtras(l) ? 'Cambiar extras' : 'Añadir extras' }}<span class="sr-only">: {{ l.nombre }}</span></span>
                  </button>
                  @if (abierta(l.uid)) {
                    <div class="ticket__extras-panel" [id]="id('extras-' + l.uid)">
                      @for (b of l.burgers; track $index; let i = $index) {
                        <fieldset class="ticket__extras-grupo">
                          <legend>{{ l.combo ? b.nombre : l.cantidad > 1 ? 'Para cada una de las ' + l.cantidad : 'Para esta burger' }}</legend>
                          @for (e of extras; track e.id) {
                            <label class="ticket__extra">
                              <input
                                type="checkbox"
                                [checked]="b.extras.includes(e.id)"
                                (change)="comanda.alternarExtra(l.key, i, e.id)"
                              />
                              <span class="ticket__extra-n">{{ e.nombre }}</span>
                              <span class="ticket__extra-p">+{{ e.precio }}</span>
                            </label>
                          }
                        </fieldset>
                      }
                    </div>
                  }
                </div>
              }
            </li>
          }
        </ul>

        <!-- Zona de reparto: obligatoria. De ella sale el pedido mínimo. -->
        <div class="ticket__zona">
          <label class="ticket__zona-label" [for]="id('zona')">¿Dónde te lo llevamos?</label>
          <select
            class="ticket__zona-select"
            [id]="id('zona')"
            required
            [attr.aria-describedby]="comanda.aviso() ? id('aviso') : null"
            (change)="zona($event)"
          >
            <option value="" [selected]="!comanda.zona()">Elige tu zona</option>
            @for (z of zonas; track z.nombre) {
              <option [value]="z.nombre" [selected]="z.nombre === comanda.zona()">{{ z.nombre }} · mínimo {{ z.minimo }}</option>
            }
          </select>
        </div>

        <dl class="ticket__cuenta">
          <div class="ticket__fila">
            <dt>Productos</dt>
            <dd>{{ subtotal() }}</dd>
          </div>
          <div class="ticket__fila">
            <dt>Envío</dt>
            <dd>{{ envio() }}</dd>
          </div>
        </dl>
        <p class="ticket__total">
          <span>Total orientativo</span>
          <span class="ticket__suma">{{ total() }}</span>
        </p>
        @if (comanda.aConsultar()) {
          <p class="ticket__nota">La hamburguesa del mes, a consultar.</p>
        }
        @if (comanda.aviso(); as aviso) {
          <p class="ticket__aviso" [id]="id('aviso')" role="status">{{ aviso }}</p>
        }
      } @else {
        <p class="ticket__vacio">
          Aún no has apuntado nada. Toca + en la carta y lo vamos escribiendo aquí.
        </p>
        <!-- Sin comanda todavía: lo que hay que saber antes de pedir -->
        <div class="ticket__reparto">
          <p class="ticket__reparto-cab" [id]="id('minimo')">Pedido mínimo</p>
          <dl [attr.aria-labelledby]="id('minimo')">
            @for (z of zonas; track z.nombre) {
              <div class="ticket__tramo">
                <dt>{{ z.nombre }}</dt>
                <dd>{{ z.minimo }}</dd>
              </div>
            }
          </dl>
          <p class="ticket__tramo ticket__tramo--envio">
            <span>Envío</span>
            <span class="ticket__importe">{{ envioFijo }}</span>
          </p>
        </div>
      }

      <div class="ticket__notas">
        <p class="ticket__nota">Precio orientativo. Te confirmamos total y hora de entrega por WhatsApp.</p>
        <p class="ticket__nota ticket__nota--fuerte">¿Alergias? Avísanos en el mensaje.</p>
      </div>

      <div class="ticket__acciones">
        @if (!comanda.lineas().length) {
          <a class="k-btn k-btn--block" [href]="comanda.whatsapp()" target="_blank" rel="noopener">
            <span>Escríbenos por WhatsApp<span class="sr-only"> (se abre WhatsApp)</span></span>
          </a>
        } @else if (comanda.puedeEnviar()) {
          <a class="k-btn k-btn--block ticket__enviar" [href]="comanda.whatsapp()" target="_blank" rel="noopener">
            <span>Mandar por WhatsApp<span class="sr-only"> (se abre WhatsApp)</span></span>
          </a>
        } @else {
          <!-- Sin zona o sin llegar al mínimo: desactivado; el motivo está en el aviso de arriba -->
          <button type="button" class="k-btn k-btn--block ticket__enviar" disabled [attr.aria-describedby]="id('aviso')">
            <span>Mandar por WhatsApp</span>
          </button>
        }
        <a class="k-btn k-btn--line k-btn--block" [href]="local.telefono.href">
          <span>Prefiero llamar<span class="sr-only"> al {{ local.telefono.texto }}</span></span>
        </a>
      </div>

      @if (comanda.lineas().length) {
        <button type="button" class="k-link ticket__vaciar" (click)="comanda.vaciar()">Vaciar comanda</button>
      } @else if (comanda.puedeDeshacer()) {
        <button type="button" class="k-link ticket__vaciar" (click)="comanda.deshacer()">Deshacer: recuperar la comanda</button>
      }
    </div>
  `,
  styleUrl: './ticket.component.scss',
})
export class TicketComponent {
  /** `rail`: lateral fijo en escritorio. `hoja`: dentro de la hoja inferior del móvil. */
  readonly variante = input<'rail' | 'hoja'>('rail');

  protected readonly comanda = inject(ComandaService);
  protected readonly local = LOCAL;
  protected readonly euros = euros;
  protected readonly total = computed(() => euros(this.comanda.total()));
  protected readonly subtotal = computed(() => euros(this.comanda.subtotal()));
  protected readonly envio = computed(() => euros(this.comanda.envio()));
  protected readonly envioFijo = euros(ENVIO);
  /** Extras que se le pueden poner a una burger, con su precio («+1,50€»). */
  protected readonly extras = EXTRAS.map((p) => ({ id: p.id, nombre: p.enTicket ?? p.nombre, precio: p.precio.replace('+', '') }));
  /** Líneas con el panel de extras desplegado (por uid: sobrevive a cambiar de extras). */
  private readonly paneles = signal<ReadonlySet<number>>(new Set());
  /** Zonas de reparto con su pedido mínimo, en el orden del selector. */
  protected readonly zonas = LOCAL.zonasReparto.map((nombre) => ({ nombre, minimo: eurosCorto(minimoDe(nombre)) }));

  private readonly papel = viewChild.required<ElementRef<HTMLElement>>('papel');
  private readonly doc = inject(DOCUMENT);
  private ultima = 0;

  constructor() {
    afterRenderEffect(() => {
      const imp = this.comanda.impresa();
      if (!imp || imp.n === this.ultima) return;
      this.ultima = imp.n;
      const win = this.doc.defaultView;
      const papel = this.papel().nativeElement;
      // Solo si se ve (el lateral está oculto en móvil y la hoja, cerrada)
      if (!win || prefersReducedMotion(win) || !papel.getClientRects().length || !papel.animate) return;
      const ease = 'cubic-bezier(0.23, 1, 0.32, 1)';
      papel.animate([{ transform: 'translateY(-1.6rem)' }, { transform: 'none' }], { duration: 220, easing: ease });
      const linea = papel.querySelector<HTMLElement>(`[data-key="${CSS.escape(imp.key)}"]`);
      linea?.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 150, easing: 'linear' });
    });
  }

  protected abierta(uid: number): boolean {
    return this.paneles().has(uid);
  }

  protected alternarPanel(uid: number): void {
    this.paneles.update((set) => {
      const nuevo = new Set(set);
      if (!nuevo.delete(uid)) nuevo.add(uid);
      return nuevo;
    });
  }

  protected conExtras(l: Linea): boolean {
    return l.burgers.some((b) => b.extras.length > 0);
  }

  protected zona(e: Event): void {
    this.comanda.elegirZona((e.target as HTMLSelectElement).value || null);
  }

  protected id(parte: string): string {
    return `ticket-${this.variante()}-${parte}`;
  }
}
