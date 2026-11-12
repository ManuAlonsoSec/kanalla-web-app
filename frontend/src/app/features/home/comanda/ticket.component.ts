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
  viewChild,
} from '@angular/core';
import { LOCAL, euros } from '../../../../data/datos';
import { prefersReducedMotion } from '../../../core/motion';
import { ComandaService } from './comanda.service';

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
          @for (l of comanda.lineas(); track l.key) {
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
            </li>
          }
        </ul>

        <p class="ticket__total">
          <span>Total orientativo</span>
          <span class="ticket__suma">{{ total() }}</span>
        </p>
        @if (comanda.aConsultar()) {
          <p class="ticket__nota">La hamburguesa del mes, a consultar.</p>
        }
      } @else {
        <p class="ticket__vacio">
          Aún no has apuntado nada. Toca + en la carta y lo vamos escribiendo aquí.
        </p>
      }

      <div class="ticket__notas">
        @if (local.pedidoMinimo) {
          <p class="ticket__nota">Pedido mínimo: {{ local.pedidoMinimo }}</p>
        }
        @if (local.gastosEnvio) {
          <p class="ticket__nota">Envío: {{ local.gastosEnvio }}</p>
        }
        <p class="ticket__nota">Precio orientativo. Te confirmamos total y hora de entrega por WhatsApp.</p>
        <p class="ticket__nota ticket__nota--fuerte">¿Alergias? Avísanos en el mensaje.</p>
      </div>

      <div class="ticket__acciones">
        <a class="k-btn k-btn--block" [href]="comanda.whatsapp()" target="_blank" rel="noopener">
          <span>{{ comanda.lineas().length ? 'Mandar por WhatsApp' : 'Escríbenos por WhatsApp' }}<span class="sr-only"> (se abre WhatsApp)</span></span>
        </a>
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

  protected id(parte: string): string {
    return `ticket-${this.variante()}-${parte}`;
  }
}
