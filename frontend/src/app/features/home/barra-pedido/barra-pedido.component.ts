import {
  ChangeDetectionStrategy,
  Component,
  DOCUMENT,
  ElementRef,
  ViewEncapsulation,
  afterNextRender,
  afterRenderEffect,
  computed,
  inject,
  input,
  viewChild,
} from '@angular/core';
import { LOCAL, euros } from '../../../../data/datos';
import { prefersReducedMotion } from '../../../core/motion';
import { ComandaService } from '../comanda/comanda.service';
import { TicketComponent } from '../comanda/ticket.component';

/** Ancho a partir del cual el ticket va en el lateral (ver home.component.scss). */
const RAIL = '(min-width: 1100px)';

/**
 * Pedido siempre a mano.
 * · Móvil: barra fija abajo. Sin comanda: WhatsApp + llamar. Con comanda:
 *   «Tu comanda · 3 · 28,00€» (abre la hoja con el ticket) + «Mandar».
 * · Escritorio: el ticket va en el lateral; esta barra solo aparece como pestaña
 *   compacta cuando hay comanda y el lateral no se ve.
 * Oculta, no se puede enfocar (visibility: hidden).
 */
@Component({
  selector: 'app-barra-pedido',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  imports: [TicketComponent],
  host: {
    class: 'barra-pedido',
    '[class.is-shown]': 'shown()',
    '[class.is-tab]': 'tab()',
  },
  template: `
    <div class="barra" role="region" aria-label="Pide a domicilio">
      @if (n()) {
        <button type="button" class="barra__comanda" (click)="abrir()" [attr.aria-haspopup]="'dialog'">
          <span class="barra__k">Tu comanda</span>
          <span class="barra__res"
            ><span class="barra__n" #num>{{ n() }}</span>&ngsp;<span aria-hidden="true">·</span>&ngsp;{{ total() }}</span
          >
          <span class="sr-only">: ver el ticket</span>
        </button>
        <a class="k-btn k-btn--line k-btn--line-kraft barra__wa" [href]="comanda.whatsapp()" target="_blank" rel="noopener">
          <span>Mandar<span class="sr-only"> la comanda por WhatsApp (se abre WhatsApp)</span></span>
        </a>
      } @else {
        <a class="k-btn k-btn--kraft" [href]="local.whatsapp.href" target="_blank" rel="noopener">
          <span><span class="barra__largo">Pide por </span>WhatsApp<span class="sr-only"> (se abre WhatsApp)</span></span>
        </a>
        <a class="k-btn k-btn--line k-btn--line-kraft" [href]="local.telefono.href">
          <span>Llamar<span class="sr-only"> al {{ local.telefono.texto }}</span></span>
        </a>
      }
    </div>

    <dialog #hoja class="hoja" aria-labelledby="ticket-hoja-titulo" (click)="fondo($event)">
      <div class="hoja__cuerpo">
        <button type="button" class="hoja__cerrar" (click)="cerrar()">Seguir mirando la carta</button>
        <app-ticket variante="hoja" />
      </div>
    </dialog>
  `,
  styleUrl: './barra-pedido.component.scss',
})
export class BarraPedidoComponent {
  /** Móvil: fuera del hero, o si ya hay comanda. */
  readonly shown = input(false);
  /** Escritorio: el ticket lateral está a la vista. */
  readonly railVisible = input(false);

  protected readonly comanda = inject(ComandaService);
  protected readonly local = LOCAL;
  protected readonly n = this.comanda.unidades;
  protected readonly total = computed(() => euros(this.comanda.total()));
  protected readonly tab = computed(() => this.n() > 0 && !this.railVisible());

  private readonly doc = inject(DOCUMENT);
  private readonly hoja = viewChild.required<ElementRef<HTMLDialogElement>>('hoja');
  private readonly num = viewChild<ElementRef<HTMLElement>>('num');
  private ultimo = -1;

  constructor() {
    // Al pasar a escritorio con la hoja abierta, se cierra (el ticket ya está en el lateral)
    afterNextRender(() => {
      const mq = this.doc.defaultView?.matchMedia(RAIL);
      mq?.addEventListener('change', (e) => e.matches && this.cerrar());
    });

    // El número de la barra cambia con un golpe corto (180 ms) al apuntar
    afterRenderEffect(() => {
      const n = this.n();
      const el = this.num()?.nativeElement;
      const prev = this.ultimo;
      this.ultimo = n;
      const win = this.doc.defaultView;
      if (!el || prev < 1 || n <= prev || !win || prefersReducedMotion(win) || !el.animate) return;
      el.animate(
        [
          { transform: 'translateY(45%)', opacity: 0 },
          { transform: 'none', opacity: 1 },
        ],
        { duration: 180, easing: 'cubic-bezier(0.23, 1, 0.32, 1)' },
      );
    });
  }

  protected abrir(): void {
    const win = this.doc.defaultView;
    if (win?.matchMedia(RAIL).matches) {
      // Escritorio: el ticket está en el lateral
      const rail = this.doc.getElementById('comanda');
      rail?.scrollIntoView({ behavior: prefersReducedMotion(win) ? 'auto' : 'smooth', block: 'start' });
      rail?.focus({ preventScroll: true });
      return;
    }
    const d = this.hoja().nativeElement;
    if (!d.open) d.showModal();
  }

  protected cerrar(): void {
    const d = this.hoja().nativeElement;
    if (d.open) d.close();
  }

  /** Clic en el fondo (fuera del contenido) cierra. */
  protected fondo(e: MouseEvent): void {
    if (e.target === this.hoja().nativeElement) this.cerrar();
  }
}
